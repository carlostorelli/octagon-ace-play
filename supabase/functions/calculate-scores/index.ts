import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Not authorized");

    const { event_id } = await req.json();
    if (!event_id) throw new Error("event_id is required");

    // 1. Get scoring rules
    const { data: rules } = await supabase.from("scoring_rules").select("*");
    const ruleMap: Record<string, number> = {};
    for (const r of rules ?? []) {
      ruleMap[r.action_name] = r.points;
    }

    // 2. Get fights with results for this event
    const { data: fights } = await supabase
      .from("fights")
      .select("id, fight_type, fighter_a_id, fighter_b_id, odds_fighter_a, odds_fighter_b")
      .eq("event_id", event_id);

    const { data: fightResults } = await supabase
      .from("fight_results")
      .select("*")
      .in("fight_id", (fights ?? []).map((f) => f.id));

    // Build result map by fight_id
    const resultMap: Record<string, any> = {};
    for (const r of fightResults ?? []) {
      resultMap[r.fight_id] = r;
    }

    // 3. Get all predictions for this event
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("event_id", event_id);

    // 4. Calculate points per user
    const userPoints: Record<string, { points: number; wins: number }> = {};

    const noWinnerMethods = ["draw", "no_contest", "cancelled"];

    for (const pred of predictions ?? []) {
      if (!userPoints[pred.user_id]) {
        userPoints[pred.user_id] = { points: 0, wins: 0 };
      }

      const fight = fights?.find((f) => f.id === pred.fight_id);
      const result = resultMap[pred.fight_id];
      if (!fight || !result) continue;

      // Skip cancelled/draw/no_contest fights
      if (noWinnerMethods.includes(result.method)) continue;

      // Determine fight category suffix
      const typeSuffix =
        fight.fight_type === "title" ? "_title" :
        fight.fight_type === "5_rounds" ? "_5r" : "_3r";

      // Wrong winner = 0 points
      if (pred.winner_fighter_id !== result.winner_fighter_id) continue;

      // Correct winner
      const winnerPts = ruleMap[`winner${typeSuffix}`] ?? 0;
      userPoints[pred.user_id].points += winnerPts;
      userPoints[pred.user_id].wins += 1;

      // Correct method - normalize for comparison
      if (pred.method && result.method) {
        // Normalize: "Decision" -> "decision", "KO/TKO" -> "ko_tko", "Submission" -> "submission"
        const normalizePredMethod = (m: string) => {
          const lower = m.toLowerCase();
          if (lower === "decision") return "decision";
          if (lower === "ko/tko") return "ko_tko";
          if (lower === "submission") return "submission";
          return lower;
        };
        const normalizeResultMethod = (m: string) => {
          if (m.startsWith("decision")) return "decision";
          return m;
        };
        const normPred = normalizePredMethod(pred.method);
        const normResult = normalizeResultMethod(result.method);
        const isMethodMatch = normPred === normResult;
        if (isMethodMatch) {
          const methodPts = ruleMap[`method${typeSuffix}`] ?? 0;
          userPoints[pred.user_id].points += methodPts;
        }
      }

      // Correct round (only for non-decision methods)
      if (pred.round && result.round && !result.method?.startsWith("decision")) {
        if (pred.round === result.round) {
          const roundPts = ruleMap[`round${typeSuffix}`] ?? 0;
          userPoints[pred.user_id].points += roundPts;
        }
      }

      // FOTN bonus: if fight is FOTN and user got the winner right
      if (result.is_fotn) {
        userPoints[pred.user_id].points += ruleMap["fotn"] ?? 0;
      }

      // POTN bonus
      if (result.is_fatn) {
        userPoints[pred.user_id].points += ruleMap["potn"] ?? 0;
      }

      // Zebra bonus: if the winner was the underdog (positive odds = underdog)
      const winnerIsA = result.winner_fighter_id === fight.fighter_a_id;
      const winnerOdds = winnerIsA ? fight.odds_fighter_a : fight.odds_fighter_b;
      if (winnerOdds != null && winnerOdds > 0) {
        // Progressive zebra bonus based on odds
        let zebraBonus = 0;
        const absOdds = Math.abs(winnerOdds);
        if (absOdds >= 400) zebraBonus = 500;
        else if (absOdds >= 300) zebraBonus = 400;
        else if (absOdds >= 200) zebraBonus = 300;
        else if (absOdds >= 150) zebraBonus = 200;
        else if (absOdds >= 100) zebraBonus = 100;
        userPoints[pred.user_id].points += zebraBonus;
      }
    }

    // 5. Upsert into leaderboard
    // Delete existing entries for this event
    await supabase.from("leaderboard").delete().eq("event_id", event_id);

    // Insert new entries
    const rows = Object.entries(userPoints).map(([user_id, { points, wins }]) => ({
      user_id,
      event_id,
      points,
      wins,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("leaderboard").insert(rows);
      if (insertError) throw insertError;
    }

    // 6. Update general leaderboard (sum all events)
    // We need to also update the "general" leaderboard (event_id = null)
    // First get all leaderboard entries grouped by user
    const { data: allEntries } = await supabase
      .from("leaderboard")
      .select("user_id, points, wins")
      .not("event_id", "is", null);

    const generalMap: Record<string, { points: number; wins: number }> = {};
    for (const entry of allEntries ?? []) {
      if (!generalMap[entry.user_id]) {
        generalMap[entry.user_id] = { points: 0, wins: 0 };
      }
      generalMap[entry.user_id].points += entry.points;
      generalMap[entry.user_id].wins += entry.wins;
    }

    // Delete existing general entries
    await supabase.from("leaderboard").delete().is("event_id", null);

    // Insert general entries
    const generalRows = Object.entries(generalMap).map(([user_id, { points, wins }]) => ({
      user_id,
      event_id: null,
      points,
      wins,
    }));

    if (generalRows.length > 0) {
      const { error: genError } = await supabase.from("leaderboard").insert(generalRows);
      if (genError) throw genError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_scored: rows.length,
        total_predictions: (predictions ?? []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
