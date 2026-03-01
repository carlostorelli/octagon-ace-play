import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Not authenticated");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await callerClient.auth.getUser();
    if (userError || !callerUser) throw new Error("Not authenticated");
    const callerId = callerUser.id;

    const { data: isAdmin } = await callerClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 500 });
      if (error) throw error;

      const { data: roles } = await adminClient.from("user_roles").select("*");
      const { data: profiles } = await adminClient.from("profiles").select("*");

      const enriched = users.map((u) => {
        const profile = profiles?.find((p) => p.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          display_name: profile?.display_name || u.email,
          avatar_url: profile?.avatar_url,
          instagram: profile?.instagram || "",
          verified: profile?.verified || false,
          roles: roles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [],
          banned: u.banned_until ? (new Date(u.banned_until) > new Date() || u.banned_until === "forever") : false,
        };
      });

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TOGGLE ADMIN
    if (req.method === "POST" && action === "toggle-admin") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const { data: existing } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .eq("role", "admin")
        .maybeSingle();

      if (existing) {
        await adminClient.from("user_roles").delete().eq("id", existing.id);
        return new Response(JSON.stringify({ action: "removed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        await adminClient.from("user_roles").insert({ user_id, role: "admin" });
        return new Response(JSON.stringify({ action: "added" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // CREATE USER
    if (req.method === "POST" && action === "create-user") {
      const { email, password, display_name } = await req.json();
      if (!email || !password) throw new Error("email and password required");

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: display_name || email },
      });
      if (error) throw error;

      return new Response(JSON.stringify({ user: { id: data.user.id, email: data.user.email } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE USER
    if (req.method === "POST" && action === "delete-user") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");
      if (user_id === callerId) throw new Error("Você não pode excluir a si mesmo");

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // BAN USER
    if (req.method === "POST" && action === "ban-user") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");
      if (user_id === callerId) throw new Error("Você não pode bloquear a si mesmo");

      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "876000h", // ~100 years
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UNBAN USER
    if (req.method === "POST" && action === "unban-user") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "none",
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RESET PASSWORD (sends recovery email)
    if (req.method === "POST" && action === "reset-password") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      // Get user email
      const { data: { user: targetUser }, error: getUserError } = await adminClient.auth.admin.getUserById(user_id);
      if (getUserError || !targetUser?.email) throw new Error("Usuário não encontrado");

      // Send recovery email using the auth API (this actually sends the email)
      const { error } = await adminClient.auth.resetPasswordForEmail(targetUser.email, {
        redirectTo: `${req.headers.get("origin") || supabaseUrl.replace(".supabase.co", ".lovable.app")}/reset-password`,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, email: targetUser.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE USER (display_name, email)
    if (req.method === "POST" && action === "update-user") {
      const { user_id, display_name, email } = await req.json();
      if (!user_id) throw new Error("user_id required");

      // Update auth email if changed
      if (email) {
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { email });
        if (error) throw error;
      }

      // Update profile display_name
      if (display_name) {
        const { error } = await adminClient
          .from("profiles")
          .update({ display_name })
          .eq("user_id", user_id);
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TOGGLE VERIFIED
    if (req.method === "POST" && action === "toggle-verified") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const { data: profile } = await adminClient
        .from("profiles")
        .select("verified")
        .eq("user_id", user_id)
        .maybeSingle();

      const newVal = !(profile?.verified ?? false);
      const { error } = await adminClient
        .from("profiles")
        .update({ verified: newVal })
        .eq("user_id", user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ verified: newVal }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
