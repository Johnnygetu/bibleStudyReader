import { supabase, type Profile } from "./supabase";
import { getTelegramInitData, getTelegramUser, getTelegramWebApp } from "./telegram";

const AUTH_STORAGE_KEY = "bible_challenge_profile";

export async function authenticate(): Promise<Profile> {
  const tgUser = getTelegramUser();
  const initData = getTelegramInitData();

  if (!tgUser || !initData) {
    throw new Error("Not running inside Telegram");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/telegram-auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.profile) {
    throw new Error("No profile returned from auth");
  }

  const profile = data.profile as Profile;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ profile, telegramId: tgUser.id }));
  return profile;
}

export function getCachedProfile(): Profile | null {
  try {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!cached) return null;
    const { profile, telegramId } = JSON.parse(cached);
    const tgUser = getTelegramUser();
    if (tgUser && tgUser.id !== telegramId) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return profile;
  } catch {
    return null;
  }
}

export function getMyProfileId(): string | null {
  const cached = getCachedProfile();
  return cached?.id ?? null;
}

export async function fetchProfile(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor("#0a0a0b");
      tg.setBackgroundColor("#0a0a0b");
    } catch {
      // ignore if not supported
    }
  }
}
