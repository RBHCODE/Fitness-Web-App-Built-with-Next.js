/*
  # Fitness App Database Schema

  ## Overview
  Creates a comprehensive database structure for tracking workouts, exercises, and user progress.

  ## New Tables
  
  ### `exercise_categories`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Category name (e.g., "Strength", "Cardio", "Flexibility")
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Record creation timestamp

  ### `exercises`
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Exercise name
  - `description` (text) - Detailed exercise description
  - `category_id` (uuid, foreign key) - Links to exercise_categories
  - `muscle_groups` (text array) - Target muscle groups
  - `difficulty` (text) - Difficulty level (beginner, intermediate, advanced)
  - `instructions` (text) - Step-by-step instructions
  - `created_at` (timestamptz) - Record creation timestamp

  ### `workouts`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User identifier for future auth integration
  - `name` (text) - Workout name
  - `date` (date) - Workout date
  - `duration_minutes` (integer) - Total workout duration
  - `notes` (text) - Optional workout notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### `workout_exercises`
  - `id` (uuid, primary key) - Unique identifier
  - `workout_id` (uuid, foreign key) - Links to workouts
  - `exercise_id` (uuid, foreign key) - Links to exercises
  - `sets` (integer) - Number of sets performed
  - `reps` (integer) - Number of repetitions per set
  - `weight` (numeric) - Weight used (in kg or lbs)
  - `duration_seconds` (integer) - Duration for time-based exercises
  - `order_index` (integer) - Order of exercise in workout
  - `notes` (text) - Exercise-specific notes

  ### `progress_metrics`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User identifier
  - `date` (date) - Measurement date
  - `weight` (numeric) - Body weight
  - `body_fat_percentage` (numeric) - Body fat percentage
  - `measurements` (jsonb) - Additional measurements (chest, waist, etc.)
  - `notes` (text) - Progress notes
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - RLS enabled on all tables
  - Public access policies for demo purposes (will be restricted with auth)
  
  ## Notes
  - All tables use UUID primary keys for scalability
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure referential integrity
  - Indexes added for common query patterns
*/

-- Create exercise categories table
CREATE TABLE IF NOT EXISTS exercise_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES exercise_categories(id),
  muscle_groups text[] DEFAULT '{}',
  difficulty text DEFAULT 'intermediate',
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  duration_minutes integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create workout_exercises junction table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id),
  sets integer DEFAULT 0,
  reps integer DEFAULT 0,
  weight numeric DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  order_index integer DEFAULT 0,
  notes text
);

-- Create progress metrics table
CREATE TABLE IF NOT EXISTS progress_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date DEFAULT CURRENT_DATE,
  weight numeric,
  body_fat_percentage numeric,
  measurements jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode)
CREATE POLICY "Allow public read access to exercise_categories"
  ON exercise_categories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to exercise_categories"
  ON exercise_categories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to exercises"
  ON exercises FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to exercises"
  ON exercises FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access to workouts"
  ON workouts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to workouts"
  ON workouts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to workout_exercises"
  ON workout_exercises FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to workout_exercises"
  ON workout_exercises FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to progress_metrics"
  ON progress_metrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to progress_metrics"
  ON progress_metrics FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_date ON progress_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_user ON progress_metrics(user_id);

-- Insert sample exercise categories
INSERT INTO exercise_categories (name, description) VALUES
  ('Strength', 'Resistance and weight training exercises'),
  ('Cardio', 'Cardiovascular and endurance exercises'),
  ('Flexibility', 'Stretching and mobility exercises'),
  ('Core', 'Abdominal and core strengthening exercises')
ON CONFLICT DO NOTHING;

-- Insert sample exercises
INSERT INTO exercises (name, description, category_id, muscle_groups, difficulty, instructions)
SELECT 
  'Bench Press',
  'Classic upper body strength exercise',
  (SELECT id FROM exercise_categories WHERE name = 'Strength'),
  ARRAY['Chest', 'Triceps', 'Shoulders'],
  'intermediate',
  '1. Lie on bench with feet flat on floor\n2. Grip bar slightly wider than shoulders\n3. Lower bar to chest\n4. Press up until arms are extended'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bench Press');

INSERT INTO exercises (name, description, category_id, muscle_groups, difficulty, instructions)
SELECT 
  'Squats',
  'Fundamental lower body exercise',
  (SELECT id FROM exercise_categories WHERE name = 'Strength'),
  ARRAY['Quadriceps', 'Glutes', 'Hamstrings'],
  'beginner',
  '1. Stand with feet shoulder-width apart\n2. Lower body by bending knees and hips\n3. Keep chest up and back straight\n4. Push through heels to return to start'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squats');

INSERT INTO exercises (name, description, category_id, muscle_groups, difficulty, instructions)
SELECT 
  'Deadlift',
  'Full body compound movement',
  (SELECT id FROM exercise_categories WHERE name = 'Strength'),
  ARRAY['Back', 'Glutes', 'Hamstrings', 'Core'],
  'advanced',
  '1. Stand with feet hip-width apart, bar over midfoot\n2. Bend and grip bar\n3. Keep back straight, lift by extending hips and knees\n4. Lower bar with control'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Deadlift');

INSERT INTO exercises (name, description, category_id, muscle_groups, difficulty, instructions)
SELECT 
  'Running',
  'Classic cardiovascular exercise',
  (SELECT id FROM exercise_categories WHERE name = 'Cardio'),
  ARRAY['Legs', 'Cardiovascular System'],
  'beginner',
  '1. Start with warm-up walk\n2. Maintain steady pace\n3. Focus on breathing rhythm\n4. Cool down with walking'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Running');

INSERT INTO exercises (name, description, category_id, muscle_groups, difficulty, instructions)
SELECT 
  'Plank',
  'Isometric core strengthening exercise',
  (SELECT id FROM exercise_categories WHERE name = 'Core'),
  ARRAY['Core', 'Shoulders', 'Back'],
  'beginner',
  '1. Start in push-up position\n2. Lower to forearms\n3. Keep body straight from head to heels\n4. Hold position while breathing normally'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank');

INSERT INTO exercises (name, description, category_id, muscle_groups, difficulty, instructions)
SELECT 
  'Pull-ups',
  'Upper body pulling exercise',
  (SELECT id FROM exercise_categories WHERE name = 'Strength'),
  ARRAY['Back', 'Biceps', 'Shoulders'],
  'advanced',
  '1. Hang from bar with overhand grip\n2. Pull body up until chin clears bar\n3. Lower with control\n4. Repeat without swinging'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pull-ups');