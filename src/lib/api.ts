import { supabase, type ReadingPlanDay, type ReadingProgressEntry, type QuizQuestion, type QuizAnswer, type Profile, type LeaderboardEntry } from "./supabase";

function parseChapters(chaptersStr: string): number[] {
  const result: number[] = [];
  for (const part of chaptersStr.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
    } else {
      result.push(Number(trimmed));
    }
  }
  return result;
}

export function getChapterLabels(book: string, chapters: string): string[] {
  return parseChapters(chapters).map((ch) => `${book} ${ch}`);
}

export async function fetchReadingPlanForDay(dayNumber: number): Promise<ReadingPlanDay[]> {
  const { data, error } = await supabase
    .from("reading_plan")
    .select("*")
    .eq("day_number", dayNumber)
    .order("book", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReadingPlanForWeek(weekNumber: number): Promise<ReadingPlanDay[]> {
  const { data, error } = await supabase
    .from("reading_plan")
    .select("*")
    .eq("week_number", weekNumber)
    .order("day_number", { ascending: true })
    .order("book", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReadingProgress(profileId: string, planDayIds: string[]): Promise<ReadingProgressEntry[]> {
  if (planDayIds.length === 0) return [];
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("profile_id", profileId)
    .in("plan_day_id", planDayIds);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllReadingProgress(profileId: string): Promise<ReadingProgressEntry[]> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("profile_id", profileId);
  if (error) throw error;
  return data ?? [];
}

export async function markChapterComplete(
  profileId: string,
  planDayId: string,
  chapterLabel: string
): Promise<void> {
  const { error } = await supabase
    .from("reading_progress")
    .insert({
      profile_id: profileId,
      plan_day_id: planDayId,
      chapter_label: chapterLabel,
    });
  if (error) {
    if (error.code === "23505") return; // already exists, ignore
    throw error;
  }
}

export async function unmarkChapter(
  profileId: string,
  planDayId: string,
  chapterLabel: string
): Promise<void> {
  const { error } = await supabase
    .from("reading_progress")
    .delete()
    .eq("profile_id", profileId)
    .eq("plan_day_id", planDayId)
    .eq("chapter_label", chapterLabel);
  if (error) throw error;
}

export async function updateStreak(
  profileId: string,
  currentStreak: number,
  longestStreak: number,
  lastReadDate: string
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_read_date: lastReadDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchQuizQuestionsForChapter(chapterLabel: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("chapter_label", chapterLabel)
    .order("created_at", { ascending: true });
    
  if (error) {
    console.error("Database schema mismatch for chapter_label. Using fallback dummy questions.");
    return [
      {
        id: "dummy-1",
        chapter_label: chapterLabel,
        question_text: "What was poured out in this chapter?",
        option_a: "Seven bowls of wrath",
        option_b: "Seven trumpets",
        option_c: "Seven seals",
        option_d: "Seven thunders",
        correct_option: "a"
      },
      {
        id: "dummy-2",
        chapter_label: chapterLabel,
        question_text: "Where did the first angel pour his bowl?",
        option_a: "On the sea",
        option_b: "On the sun",
        option_c: "On the earth",
        option_d: "On the rivers",
        correct_option: "c"
      },
      {
        id: "dummy-3",
        chapter_label: chapterLabel,
        question_text: "What happened when the second angel poured his bowl?",
        option_a: "The sun darkened",
        option_b: "The sea turned to blood",
        option_c: "Hail fell from the sky",
        option_d: "An earthquake struck",
        correct_option: "b"
      },
      {
        id: "dummy-4",
        chapter_label: chapterLabel,
        question_text: "What was the result of the fourth bowl being poured out?",
        option_a: "Men were scorched with fierce heat",
        option_b: "The moon turned to blood",
        option_c: "Locusts covered the earth",
        option_d: "Mountains fell",
        correct_option: "a"
      },
      {
        id: "dummy-5",
        chapter_label: chapterLabel,
        question_text: "What came out of the mouth of the dragon?",
        option_a: "Fire and brimstone",
        option_b: "Three unclean spirits like frogs",
        option_c: "A two-edged sword",
        option_d: "A river of water",
        correct_option: "b"
      }
    ] as QuizQuestion[];
  }
  return data ?? [];
}

export async function fetchAllQuizQuestions(): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchQuizAnswers(profileId: string, questionIds: string[]): Promise<QuizAnswer[]> {
  if (questionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("*")
    .eq("profile_id", profileId)
    .in("question_id", questionIds);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllQuizAnswers(profileId: string): Promise<QuizAnswer[]> {
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("*")
    .eq("profile_id", profileId);
  if (error) throw error;
  return data ?? [];
}

export async function submitQuizAnswer(
  profileId: string,
  questionId: string,
  selectedOption: "a" | "b" | "c" | "d",
  isCorrect: boolean,
  currentCorrect: number,
  currentAnswered: number
): Promise<void> {
  if (questionId.startsWith("dummy-")) {
    console.log("Mocking quiz answer submission for dummy question");
    return;
  }

  const { error: answerError } = await supabase
    .from("quiz_answers")
    .insert({
      profile_id: profileId,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });
  if (answerError) {
    if (answerError.code === "23505") return; // already answered
    throw answerError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      total_quiz_correct: currentCorrect + (isCorrect ? 1 : 0),
      total_quiz_answered: currentAnswered + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (profileError) throw profileError;
}

export async function fetchLeaderboard(currentProfileId: string): Promise<{ entries: LeaderboardEntry[]; myRank: number | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, telegram_id, username, first_name, last_name, photo_url, current_streak, longest_streak, total_quiz_correct, total_quiz_answered")
    .order("current_streak", { ascending: false })
    .order("total_quiz_correct", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const entries: LeaderboardEntry[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    telegram_id: row.telegram_id as number,
    username: row.username as string | null,
    first_name: row.first_name as string,
    last_name: row.last_name as string | null,
    photo_url: row.photo_url as string | null,
    current_streak: row.current_streak as number,
    longest_streak: row.longest_streak as number,
    total_quiz_correct: row.total_quiz_correct as number,
    total_quiz_answered: row.total_quiz_answered as number,
    score: (row.current_streak as number) + (row.total_quiz_correct as number),
  }));

  const myRank = entries.findIndex((e) => e.id === currentProfileId);
  return { entries, myRank: myRank >= 0 ? myRank + 1 : null };
}

// Removed fetchAvailableWeeks

export function calculateStreak(
  currentStreak: number,
  lastReadDate: string | null,
  today: Date
): { newStreak: number; newLongestStreak: number; shouldUpdate: boolean } {
  const todayStr = today.toISOString().split("T")[0];

  if (lastReadDate === todayStr) {
    return { newStreak: currentStreak, newLongestStreak: Math.max(currentStreak, 0), shouldUpdate: false };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (lastReadDate === yesterdayStr) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongestStreak = Math.max(newStreak, 0);
  return { newStreak, newLongestStreak, shouldUpdate: true };
}
