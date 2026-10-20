import { getDb } from '../db.ts';
import { getBookmarks, getUserStats, getWeakTopics, getWeeklyActivity } from './study.ts';

export interface Profile {
  id: string;
  name: string;
  email: string;
  examYear: number | null;
  preparationLevel: string | null;
  dailyGoalMinutes: number;
  onboardingComplete: boolean;
  createdAt: string;
}

export function readProfile(userId: string): Profile | null {
  const row = getDb()
    .prepare(
      `SELECT id, name, email, exam_year, preparation_level, daily_goal_minutes,
              onboarding_complete, created_at FROM profiles WHERE id = ?`,
    )
    .get(userId) as any;
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    examYear: row.exam_year === null ? null : Number(row.exam_year),
    preparationLevel: row.preparation_level === null ? null : String(row.preparation_level),
    dailyGoalMinutes: Number(row.daily_goal_minutes),
    onboardingComplete: Number(row.onboarding_complete) === 1,
    createdAt: String(row.created_at),
  };
}

export function getProfileOverview(userId: string) {
  return {
    user: readProfile(userId),
    stats: getUserStats(userId),
    weakTopics: getWeakTopics(userId, 6),
    weeklyActivity: getWeeklyActivity(userId, 7),
    bookmarks: getBookmarks(userId),
  };
}
