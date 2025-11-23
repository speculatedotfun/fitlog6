-- Universal FitLog Database Schema
-- This schema supports the complete workout and nutrition tracking system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('trainer', 'trainee')),
  trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Exercise Library table
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  video_url TEXT,
  image_url TEXT,
  muscle_group TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Workout Plans table
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  weekly_target_workouts INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Routines table (A, B, C workouts)
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  letter TEXT NOT NULL CHECK (letter IN ('A', 'B', 'C', 'D', 'E')),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, letter)
);

-- 5. Routine Exercises table (links exercises to routines with targets)
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps_min INTEGER NOT NULL DEFAULT 6,
  target_reps_max INTEGER NOT NULL DEFAULT 12,
  rir_target INTEGER NOT NULL DEFAULT 1 CHECK (rir_target >= 0 AND rir_target <= 4),
  rest_time_seconds INTEGER DEFAULT 180,
  notes TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Workout Logs table (actual workout sessions)
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  body_weight DECIMAL(5,2),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Set Logs table (individual set performance)
CREATE TABLE set_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  rir_actual INTEGER NOT NULL CHECK (rir_actual >= 0 AND rir_actual <= 4),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Nutrition Swaps table (for nutrition calculator)
CREATE TABLE nutrition_swaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_name TEXT NOT NULL,
  category TEXT NOT NULL,
  conversion_factor DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  protein_per_100g DECIMAL(5,2),
  carbs_per_100g DECIMAL(5,2),
  fat_per_100g DECIMAL(5,2),
  calories_per_100g DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Daily Nutrition Logs table
CREATE TABLE daily_nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_protein DECIMAL(6,2),
  total_carbs DECIMAL(6,2),
  total_fat DECIMAL(6,2),
  total_calories DECIMAL(7,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for performance optimization
CREATE INDEX idx_users_trainer_id ON users(trainer_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_workout_plans_trainee ON workout_plans(trainee_id);
CREATE INDEX idx_workout_plans_active ON workout_plans(is_active);
CREATE INDEX idx_routines_plan ON routines(plan_id);
CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date);
CREATE INDEX idx_workout_logs_routine ON workout_logs(routine_id);
CREATE INDEX idx_set_logs_log ON set_logs(log_id);
CREATE INDEX idx_set_logs_exercise ON set_logs(exercise_id);
CREATE INDEX idx_nutrition_logs_user_date ON daily_nutrition_logs(user_id, date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_library_updated_at BEFORE UPDATE ON exercise_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_exercises_updated_at BEFORE UPDATE ON routine_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON daily_nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Sample nutrition swap data
INSERT INTO nutrition_swaps (food_name, category, conversion_factor, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g) VALUES
('אורז', 'carbs', 1.0, 2.7, 28.2, 0.3, 130),
('פסטה', 'carbs', 0.8, 5.0, 25.0, 0.9, 131),
('שיבולת שועל', 'carbs', 0.7, 13.2, 55.7, 6.5, 379),
('בטטה', 'carbs', 1.2, 1.6, 20.1, 0.1, 86),
('חזה עוף', 'protein', 1.0, 31.0, 0.0, 3.6, 165),
('בשר בקר', 'protein', 1.1, 26.0, 0.0, 15.0, 250),
('ביצים', 'protein', 0.9, 13.0, 1.1, 11.0, 155),
('קוטג''', 'protein', 0.85, 11.0, 3.4, 4.3, 98);
