import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ExerciseCategory = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  muscle_groups: string[];
  difficulty: string;
  instructions: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string | null;
  name: string;
  date: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number;
  duration_seconds: number;
  order_index: number;
  notes: string | null;
};

export type ProgressMetric = {
  id: string;
  user_id: string | null;
  date: string;
  weight: number | null;
  body_fat_percentage: number | null;
  measurements: Record<string, number>;
  notes: string | null;
  created_at: string;
};
