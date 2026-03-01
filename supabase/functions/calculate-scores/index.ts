import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Normalize prediction method strings
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

interface UserStats {
  points: number;
  wins: number;
  correct_methods: number;
  correct_rounds: number;
  main_event_winner: boolean;
  main_event_method: boolean;
  main_event_round: boolean;
  fotn_correct: boolean;
  potn_correct: boolean;
  zebra_count: number;
}

const newStats = (): UserStats => ({
  points: 0, wins: 0, correct_methods: 0, correct_rounds: 0,
  main_event_winner: false, main_event_method: false, main_event_round: false,
  fotn_correct: false, potn_correct: false, zebra_count: 0,
});

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
      .select("id, fight_type, fighter_a_id, fighter_b_id, odds_fighter_a, odds_fighter_b, fight_order, card_type")
      .eq("event_id", event_id)
      .order("fight_order", { ascending: false });

    const { data: fightResults } = await supabase
      .from("fight_results")
      .select("*")
      .in("fight_id", (fights ?? []).map((f) => f.id));

    const resultMap: Record<string, any> = {};
    for (const r of fightResults ?? []) {
      resultMap[r.fight_id] = r;
    }

    // Find main event fight (highest fight_order)
    const mainEventFight = fights?.[0] ?? null;

    // 3. Get all predictions for this event
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("event_id", event_id);

    // 4. Calculate points per user
    const userPoints: Record<string, UserStats> = {};
    const noWinnerMethods = ["draw", "no_contest", "cancelled"];

    for (const pred of predictions ?? []) {
      if (!userPoints[pred.user_id]) {
        userPoints[pred.user_id] = newStats();
      }

      const fight = fights?.find((f) => f.id === pred.fight_id);
      const result = resultMap[pred.fight_id];
      if (!fight || !result) continue;

      if (noWinnerMethods.includes(result.method)) continue;

      const typeSuffix =
        fight.fight_type === "title" ? "_title" :
        fight.fight_type === "5_rounds" ? "_5r" : "_3r";

      // Wrong winner = 0 points
      if (pred.winner_fighter_id !== result.winner_fighter_id) continue;

      // Correct winner
      const winnerPts = ruleMap[`winner${typeSuffix}`] ?? 0;
      userPoints[pred.user_id].points += winnerPts;
      userPoints[pred.user_id].wins += 1;

      // Check if this is the main event
      const isMainEvent = mainEventFight && fight.id === mainEventFight.id;
      if (isMainEvent) {
        userPoints[pred.user_id].main_event_winner = true;
      }

      // Check method match
      let methodMatch = false;
      if (pred.method && result.method) {
        const normPred = normalizePredMethod(pred.method);
        const normResult = normalizeResultMethod(result.method);
        methodMatch = normPred === normResult;
        if (methodMatch) {
          const methodPts = ruleMap[`method${typeSuffix}`] ?? 0;
          userPoints[pred.user_id].points += methodPts;
          userPoints[pred.user_id].correct_methods += 1;
          if (isMainEvent) {
            userPoints[pred.user_id].main_event_method = true;
          }
        }
      }

      // Check round match (only for non-decision)
      if (pred.round && result.round && !result.method?.startsWith("decision")) {
        if (pred.round === result.round) {
          const roundPts = ruleMap[`round${typeSuffix}`] ?? 0;
          userPoints[pred.user_id].points += roundPts;
          userPoints[pred.user_id].correct_rounds += 1;
          if (isMainEvent) {
            userPoints[pred.user_id].main_event_round = true;
          }
        }
      }

      // FOTN bonus
      if (result.is_fotn) {
        userPoints[pred.user_id].points += ruleMap["fotn"] ?? 0;
        userPoints[pred.user_id].fotn_correct = true;
      }

      // POTN bonus
      if (result.is_fatn) {
        userPoints[pred.user_id].points += ruleMap["potn"] ?? 0;
        userPoints[pred.user_id].potn_correct = true;
      }

      // Zebra bonus
      const winnerIsA = result.winner_fighter_id === fight.fighter_a_id;
      const winnerOdds = winnerIsA ? fight.odds_fighter_a : fight.odds_fighter_b;
      if (winnerOdds != null && winnerOdds > 0) {
        let zebraBonus = 0;
        const absOdds = Math.abs(winnerOdds);
        if (absOdds >= 400) zebraBonus = 500;
        else if (absOdds >= 300) zebraBonus = 400;
        else if (absOdds >= 200) zebraBonus = 300;
        else if (absOdds >= 150) zebraBonus = 200;
        else if (absOdds >= 100) zebraBonus = 100;
        userPoints[pred.user_id].points += zebraBonus;
        userPoints[pred.user_id].zebra_count += 1;
      }
    }

    // 5. Upsert into leaderboard
    await supabase.from("leaderboard").delete().eq("event_id", event_id);

    const rows = Object.entries(userPoints).map(([user_id, s]) => ({
      user_id,
      event_id,
      points: s.points,
      wins: s.wins,
      correct_methods: s.correct_methods,
      correct_rounds: s.correct_rounds,
      main_event_winner: s.main_event_winner,
      main_event_method: s.main_event_method,
      main_event_round: s.main_event_round,
      fotn_correct: s.fotn_correct,
      potn_correct: s.potn_correct,
      zebra_count: s.zebra_count,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("leaderboard").insert(rows);
      if (insertError) throw insertError;
    }

    // 6. Update general leaderboard (aggregate all events)
    const { data: allEntries } = await supabase
      .from("leaderboard")
      .select("user_id, points, wins, correct_methods, correct_rounds, main_event_winner, main_event_method, main_event_round, fotn_correct, potn_correct, zebra_count")
      .not("event_id", "is", null);

    const generalMap: Record<string, UserStats> = {};
    for (const entry of allEntries ?? []) {
      if (!generalMap[entry.user_id]) {
        generalMap[entry.user_id] = newStats();
      }
      const g = generalMap[entry.user_id];
      g.points += entry.points;
      g.wins += entry.wins;
      g.correct_methods += entry.correct_methods;
      g.correct_rounds += entry.correct_rounds;
      if (entry.main_event_winner) g.main_event_winner = true;
      if (entry.main_event_method) g.main_event_method = true;
      if (entry.main_event_round) g.main_event_round = true;
      if (entry.fotn_correct) g.fotn_correct = true;
      if (entry.potn_correct) g.potn_correct = true;
      g.zebra_count += entry.zebra_count;
    }

    await supabase.from("leaderboard").delete().is("event_id", null);

    const generalRows = Object.entries(generalMap).map(([user_id, s]) => ({
      user_id,
      event_id: null,
      points: s.points,
      wins: s.wins,
      correct_methods: s.correct_methods,
      correct_rounds: s.correct_rounds,
      main_event_winner: s.main_event_winner,
      main_event_method: s.main_event_method,
      main_event_round: s.main_event_round,
      fotn_correct: s.fotn_correct,
      potn_correct: s.potn_correct,
      zebra_count: s.zebra_count,
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
