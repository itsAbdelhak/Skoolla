

import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT: SUPABASE SETUP FOR AI STUDIO ---
// 1. Get your Supabase Project URL and Anon Key from your Supabase Dashboard:
//    - Go to Project Settings > API.
//    - Under "Project API Keys", copy the URL and the "anon" "public" key.
// 2. Paste them directly into the createClient function below.
//    - Replace 'YOUR_PROJECT_URL_HERE' with your URL.
//    - Replace 'YOUR_ANON_KEY_HERE' with your anon key.
//
// ⚠️ WARNING: This method is ONLY for testing in environments like AI Studio
// where .env files are not supported. DO NOT commit these keys to a public
// repository like GitHub.

const supabaseUrl = 'https://blqwgloagwxhuiitshjr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscXdnbG9hZ3d4aHVpaXRzaGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTcxMzEsImV4cCI6MjA3ODAzMzEzMX0.lADDIMEWKkYNFzZC6jNvkuSJlrggxr6LkbAEcSzbaDk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- DATABASE SETUP: COMPLETE SCHEMA FOR NEW FEATURES ---
// This is the full SQL script required for all current features.
// If you are setting up your database for the first time or adding the new features,
// run this entire script in your Supabase SQL Editor.
/*

  -- =================================================================
  --  FULL DATABASE SETUP (for first-time setup with ALL features)
  -- =================================================================

  -- STEP 1: CLEAN UP (Run this first to ensure a fresh start)
  DROP TABLE IF EXISTS public.user_badges, public.session_outputs, public.session_parts, public.study_sessions, public.profiles CASCADE;


  -- STEP 2: CREATE TABLES & POLICIES (Run this after cleaning up)

  -- Table for user profiles and gamification stats
  CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    teacher_name text,
    country text, -- Add this line for the new settings page feature
    streak integer NOT NULL DEFAULT 0,
    mastered_topics_count integer NOT NULL DEFAULT 0,
    study_points integer NOT NULL DEFAULT 0,
    completed_today_count integer NOT NULL DEFAULT 0,
    time_studied_today_minutes integer NOT NULL DEFAULT 0,
    updated_at timestamp WITH time zone
  );
  -- RLS for profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
  CREATE POLICY "Users can manage their own profile." ON public.profiles FOR ALL USING (auth.uid() = id);

  -- Table for storing main study session information
  CREATE TABLE public.study_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    progress integer NOT NULL DEFAULT 0,
    personalization jsonb,
    full_outline_json jsonb,
    created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_archived boolean NOT NULL DEFAULT false,
    subject text
  );
  -- RLS for study_sessions
  ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage their own sessions." ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

  -- Table for storing each part of a course outline with SRS fields
  CREATE TABLE public.session_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid REFERENCES public.study_sessions ON DELETE CASCADE NOT NULL,
    topic_idx integer NOT NULL,
    subtopic_idx integer NOT NULL,
    part_idx integer NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    confidence integer,
    review_due_at timestamp with time zone,
    srs_stage integer NOT NULL DEFAULT 0,
    CONSTRAINT session_parts_unique UNIQUE(session_id, topic_idx, subtopic_idx, part_idx)
  );
  -- RLS for session_parts
  ALTER TABLE public.session_parts ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage parts of their own sessions." ON public.session_parts FOR ALL USING (EXISTS (SELECT 1 FROM study_sessions WHERE id = session_id AND auth.uid() = user_id));

  -- Table for storing AI-generated content (e.g., quizzes, diagrams)
  CREATE TABLE public.session_outputs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    session_id uuid REFERENCES public.study_sessions ON DELETE CASCADE NOT NULL,
    topic_idx integer NOT NULL,
    subtopic_idx integer NOT NULL,
    part_idx integer NOT NULL,
    mode text NOT NULL, -- e.g., 'Simplify', 'Quiz', 'Diagram'
    content jsonb NOT NULL,
    created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT session_outputs_unique UNIQUE(session_id, topic_idx, subtopic_idx, part_idx, mode)
  );
  -- RLS for session_outputs
  ALTER TABLE public.session_outputs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage outputs of their own sessions." ON public.session_outputs FOR ALL USING (EXISTS (SELECT 1 FROM study_sessions WHERE id = session_id AND auth.uid() = user_id));
  
  -- Table for storing earned badges
  CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    badge_type text NOT NULL, -- e.g., 'first_session_complete', '7_day_streak'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_badges_unique UNIQUE(user_id, badge_type)
  );
  -- RLS for user_badges
  ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view their own badges." ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert their own badges." ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);


  -- STEP 3: HELPER FUNCTIONS & TRIGGERS

  -- This trigger automatically creates a profile entry when a new user signs up
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY definer;

  -- Create the trigger if it doesn't exist
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

*/