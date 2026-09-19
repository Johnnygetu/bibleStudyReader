import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<TelegramUserData | null> {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const encoder = new TextEncoder();
  const secretKeyHmac = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secretKey = await crypto.subtle.sign("HMAC", secretKeyHmac, encoder.encode(botToken));

  const validationKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const computedHash = await crypto.subtle.sign("HMAC", validationKey, encoder.encode(dataCheckString));
  const computedHashHex = Array.from(new Uint8Array(computedHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedHashHex !== hash) return null;

  const userJson = params.get("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as TelegramUserData;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(
        JSON.stringify({ error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userData = await verifyTelegramInitData(initData, BOT_TOKEN);

    if (!userData) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("telegram_id", userData.id)
      .maybeSingle();

    let profile;

    if (existing) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (userData.first_name && userData.first_name !== existing.first_name) {
        updates.first_name = userData.first_name;
      }
      if (userData.last_name !== undefined && userData.last_name !== existing.last_name) {
        updates.last_name = userData.last_name ?? null;
      }
      if (userData.username !== undefined && userData.username !== existing.username) {
        updates.username = userData.username ?? null;
      }
      if (userData.photo_url !== undefined && userData.photo_url !== existing.photo_url) {
        updates.photo_url = userData.photo_url ?? null;
      }

      const hasUpdates = Object.keys(updates).length > 1;
      if (hasUpdates) {
        const { data: updated, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) throw error;
        profile = updated;
      } else {
        profile = existing;
      }
    } else {
      const { data: created, error } = await supabase
        .from("profiles")
        .insert({
          telegram_id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name ?? null,
          username: userData.username ?? null,
          photo_url: userData.photo_url ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      profile = created;
    }

    return new Response(
      JSON.stringify({ profile }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
