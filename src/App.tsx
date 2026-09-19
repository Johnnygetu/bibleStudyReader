import { useState, useEffect, useCallback } from "react";
import { BookOpen, Trophy } from "lucide-react";
import { TodayScreen } from "./components/TodayScreen";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { AppProvider } from "./lib/context";
import { authenticate, getCachedProfile, fetchProfile, initTelegramApp } from "./lib/auth";
import type { Profile } from "./lib/supabase";
import { Skeleton } from "./components/ui";

function AppContent({ isPreviewMode }: { isPreviewMode: boolean }) {
  const [activeTab, setActiveTab] = useState<"today" | "leaderboard">("today");

  const tabs = [
    { id: "today", label: "Today", icon: BookOpen },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-ink-950 text-ink-100 pb-20">
      {isPreviewMode && (
        <aside
          aria-label="Preview mode notice"
          className="bg-primary-950/90 border-b border-primary-500/20 px-4 py-2 text-xs text-primary-200 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px] text-ink-300">
              Web Preview Mode &bull; Open in Telegram for personal streak
            </span>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto">
        {activeTab === "today" && <TodayScreen onNavigate={(tab) => setActiveTab(tab as any)} />}
        {activeTab === "leaderboard" && <LeaderboardScreen />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-ink-900/90 backdrop-blur-md border-t border-ink-800 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex items-center justify-around p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
                  isActive ? "text-primary-400" : "text-ink-400 hover:text-ink-300"
                }`}
              >
                <Icon 
                  className={`w-5 h-5 mb-1 ${isActive ? "drop-shadow-[0_0_8px_rgba(2,41,66,0.5)]" : ""}`}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const DEMO_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  telegram_id: 12345,
  username: "devmode",
  first_name: "Developer",
  last_name: "Mode",
  photo_url: "",
  current_streak: 12,
  longest_streak: 15,
  last_read_date: new Date().toISOString().split("T")[0],
  total_quiz_correct: 42,
  total_quiz_answered: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const activateDemoMode = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsPreviewMode(true);
    try {
      const p = await fetchProfile(DEMO_PROFILE.id);
      setProfile(p || DEMO_PROFILE);
    } catch {
      setProfile(DEMO_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try cached profile first for fast load
      const cached = getCachedProfile();
      if (cached) {
        setProfile(cached);
        setIsPreviewMode(false);
        // Refresh silently
        fetchProfile(cached.id).then((p) => {
          if (p) setProfile(p);
        }).catch(() => {});
        return;
      }
      
      // Check if running inside Telegram WebApp
      const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
      if (!isTelegram) {
        // Not in Telegram (e.g. direct browser visit on Vercel) -> enter preview mode
        await activateDemoMode();
        return;
      }

      // Authenticate via Telegram
      const newProfile = await authenticate();
      setProfile(newProfile);
      setIsPreviewMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [activateDemoMode]);

  useEffect(() => {
    initTelegramApp();
    loadProfile();
  }, [loadProfile]);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-ink-950 p-5 pt-10">
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-5 space-y-4">
        <div className="text-center p-6 bg-ink-850 rounded-2xl border border-ink-800 max-w-sm w-full shadow-lg">
          <p className="text-danger-500 mb-2 font-semibold">Authentication Notice</p>
          <p className="text-ink-400 text-sm mb-5 leading-relaxed">
            {error || "Profile not found"}
          </p>
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={activateDemoMode}
              className="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Continue in Web Preview Mode
            </button>
            <button 
              onClick={loadProfile}
              className="w-full px-4 py-2 bg-ink-800 hover:bg-ink-700 rounded-xl text-sm text-ink-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppProvider 
      value={{ 
        profile, 
        refreshProfile: loadProfile,
        // Using January 1st, 2024 as a placeholder challenge start date
        challengeStartDate: new Date("2024-01-01T00:00:00Z") 
      }}
    >
      <AppContent isPreviewMode={isPreviewMode} />
    </AppProvider>
  );
}

export default App;
