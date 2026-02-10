import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get all events
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });
    if (eventsErr) throw eventsErr;

    // 2. Get all fighters
    const { data: fighters, error: fightersErr } = await supabase
      .from("fighters")
      .select("id, name, nickname, weight_class");
    if (fightersErr) throw fightersErr;

    // 3. Get existing associations to avoid duplicates
    const { data: existing, error: existingErr } = await supabase
      .from("event_fighters")
      .select("event_id, fighter_id");
    if (existingErr) throw existingErr;

    const existingSet = new Set(
      (existing ?? []).map((ef: any) => `${ef.event_id}_${ef.fighter_id}`)
    );

    // 4. Build fighter name list for the AI prompt
    const fighterList = fighters!
      .map((f: any) => `- ${f.name} (${f.nickname}, ${f.weight_class}) [ID: ${f.id}]`)
      .join("\n");

    const eventList = events!
      .map((e: any) => `- "${e.name}" on ${e.date}, main event: ${e.main_event} [ID: ${e.id}]`)
      .join("\n");

    // 5. Ask AI to match fighters to events
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a UFC expert. Given a list of UFC events and a list of fighters available in the database, determine which fighters belong to each event's fight card based on the real UFC 2026 schedule. 

IMPORTANT RULES:
- Only assign fighters that are in the provided list
- A fighter can appear in multiple events if they are scheduled for multiple fights
- Use the real UFC 2026 schedule data you know
- If you're unsure if a fighter is on a card, don't include them
- Return ONLY valid JSON, no explanation

Return a JSON array with objects: {"event_id": "...", "fighter_id": "..."}`,
          },
          {
            role: "user",
            content: `EVENTS:\n${eventList}\n\nAVAILABLE FIGHTERS:\n${fighterList}\n\nReturn the JSON array mapping fighters to their correct event cards.`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      throw new Error(`AI Gateway error [${aiResponse.status}]: ${errBody}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`Could not parse AI response: ${content.substring(0, 200)}`);
    }

    const mappings: { event_id: string; fighter_id: string }[] = JSON.parse(jsonMatch[0]);

    // Validate IDs exist
    const validEventIds = new Set(events!.map((e: any) => e.id));
    const validFighterIds = new Set(fighters!.map((f: any) => f.id));

    const validMappings = mappings.filter(
      (m) =>
        validEventIds.has(m.event_id) &&
        validFighterIds.has(m.fighter_id) &&
        !existingSet.has(`${m.event_id}_${m.fighter_id}`)
    );

    // 6. Insert new associations
    if (validMappings.length > 0) {
      const { error: insertErr } = await supabase
        .from("event_fighters")
        .insert(validMappings);
      if (insertErr) throw insertErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: validMappings.length,
        total_mappings_from_ai: mappings.length,
        skipped_existing: mappings.length - validMappings.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error syncing event fighters:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
