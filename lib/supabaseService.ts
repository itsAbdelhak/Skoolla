

import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { PersonalizationSettings, CourseOutline, CourseOutlineWithProgress, StudyTopic, ActivePath, EducationalMode } from '../services/geminiService';

export type Session = {
    id: string;
    title: string;
    progress: number;
    created_at: string;
    subject?: string;
};

export type UserProfile = {
    id: string;
    full_name: string | null;
    country: string | null;
    streak: number;
    mastered_topics_count: number;
    study_points: number;
    completed_today_count: number;
    time_studied_today_minutes: number;
};

export type Badge = {
    user_id: string;
    badge_type: string;
    created_at: string;
}

export type ReviewPart = {
    id: string;
    title: string;
    summary: string;
    session_id: string;
    srs_stage: number;
    session_title: string;
};

// --- SESSION MANAGEMENT ---

export const getSessionsForUser = async (userId: string): Promise<Session[]> => {
    const { data, error } = await supabase
        .from('study_sessions')
        .select('id, title, progress, created_at, subject')
        .eq('user_id', userId)
        .eq('is_archived', false) // Filter out archived sessions
        .neq('title', 'New Study Session') // Filter out incomplete onboarding sessions
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sessions:', error.message);
        throw error;
    }
    return data || [];
};


export const deleteSession = async (sessionId: string) => {
    const { error } = await supabase.from('study_sessions').delete().eq('id', sessionId);
    if (error) {
        console.error(`Error deleting session ${sessionId}:`, error);
        throw error;
    }
};

export const archiveSession = async (sessionId: string, isArchived: boolean) => {
    const { error } = await supabase
        .from('study_sessions')
        .update({ is_archived: isArchived })
        .eq('id', sessionId);
    if (error) {
        console.error(`Error archiving session ${sessionId}:`, error);
        throw error;
    }
};

export const updateSessionTitle = async (sessionId: string, title: string) => {
    const { error } = await supabase
        .from('study_sessions')
        .update({ title })
        .eq('id', sessionId);
    if (error) {
        console.error(`Error updating session title for ${sessionId}:`, error);
        throw error;
    }
};

export const updateSessionSubject = async (sessionId: string, subject: string) => {
    const { error } = await supabase
        .from('study_sessions')
        .update({ subject })
        .eq('id', sessionId);
    if (error) {
        console.error(`Error updating session subject for ${sessionId}:`, error);
        throw error;
    }
};


export const findOrCreateOnboardingSession = async (userId: string): Promise<any> => {
    // 1. Check for an existing incomplete session (identified by the default title)
    const { data: existing, error: existingError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('title', 'New Study Session')
        .limit(1) // Add this to prevent errors if duplicates exist
        .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return existing;

    // 2. If none, create a new one
    const { data: newSession, error: newError } = await supabase
        .from('study_sessions')
        .insert({ user_id: userId, title: 'New Study Session', personalization: {} })
        .select()
        .single();
        
    if (newError) throw newError;
    return newSession;
};

export const updateOnboardingSession = async (sessionId: string, updates: Record<string, any>) => {
    const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// --- USER PROFILE & GAMIFICATION ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
    return data;
};

export const updateUserProfileStats = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    if (error) {
        console.error("Error updating profile stats:", error);
    }
};

export const awardBadge = async (userId: string, badgeType: string) => {
    const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_type: badgeType });
        
    if (error && error.code !== '23505') { // 23505 is unique violation, which is fine
        console.error("Error awarding badge:", error);
    }
};

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
    const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

    return data || [];
};

export const updateUserProfile = async (userId: string, updates: { full_name?: string; country?: string; teacher_name?: string }) => {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    if (error) throw error;
};


// --- COURSE OUTLINE & PROGRESS ---

export const saveCourseOutlineParts = async (sessionId: string, outline: CourseOutlineWithProgress) => {
    const partsToInsert = outline.topics.flatMap((topic, topic_idx) =>
        topic.subtopics.flatMap((subtopic, subtopic_idx) =>
            subtopic.parts.map((part, part_idx) => ({
                session_id: sessionId,
                topic_idx,
                subtopic_idx,
                part_idx,
                title: part.title,
                summary: part.summary,
                completed: false,
                confidence: null,
            }))
        )
    );

    const { error } = await supabase.from('session_parts').insert(partsToInsert);
    if (error) {
        console.error('Error saving course outline parts:', error);
        throw error;
    }
};

export const updatePartStatus = async (
    sessionId: string,
    path: ActivePath,
    confidence: number
) => {
    // When a part is completed, its SRS journey begins.
    const reviewDueDate = new Date();
    reviewDueDate.setDate(reviewDueDate.getDate() + 1); // Set first review for tomorrow

    const { error } = await supabase
        .from('session_parts')
        .update({ 
            completed: true, 
            confidence,
            srs_stage: 1,
            review_due_at: reviewDueDate.toISOString(),
         })
        .match({
            session_id: sessionId,
            topic_idx: path.topic,
            subtopic_idx: path.subtopic,
            part_idx: path.part,
        });

    if (error) {
        console.error('Error updating part status:', error);
        throw error;
    }
};

export const updateSessionProgress = async (sessionId: string, progress: number) => {
     const { error: updateError } = await supabase
        .from('study_sessions')
        .update({ progress: Math.round(progress) })
        .eq('id', sessionId);

    if (updateError) {
        console.error('Error updating session progress:', updateError);
    }
}


// --- SPACED REPETITION (REVIEW HUB) ---

const srsIntervalsDays = [0, 1, 3, 7, 14, 30, 90, 180]; // days from now

export const getPartsForReview = async (userId: string): Promise<ReviewPart[]> => {
    const { data, error } = await supabase
        .from('session_parts')
        .select(`
            id, title, summary, session_id, srs_stage,
            study_sessions ( title )
        `)
        .eq('study_sessions.user_id', userId)
        .lte('review_due_at', new Date().toISOString())
        .order('review_due_at', { ascending: true });

    if (error) {
        console.error("Error fetching parts for review:", error);
        return [];
    }

    // Supabase TS auto-generation isn't available, so we manually map the shape
    return data.map((item: any) => ({
        ...item,
        session_title: item.study_sessions?.title || 'Unknown Session'
    }));
};

export const updatePartAfterReview = async (partId: string, currentStage: number, success: boolean) => {
    let nextStage = success ? currentStage + 1 : Math.max(1, Math.floor(currentStage / 2));
    if (nextStage >= srsIntervalsDays.length) {
        nextStage = srsIntervalsDays.length - 1; // Cap at max stage
    }
    
    const nextReviewInterval = srsIntervalsDays[nextStage];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewInterval);

    const { error } = await supabase
        .from('session_parts')
        .update({
            srs_stage: nextStage,
            review_due_at: nextReviewDate.toISOString()
        })
        .eq('id', partId);

    if (error) {
        console.error("Error updating part after review:", error);
        throw error;
    }
};

// --- DAILY BRIEFING ---
export const getWeakTopicsForSession = async (sessionId: string) => {
    const { data, error } = await supabase
        .from('session_parts')
        .select('title, confidence')
        .eq('session_id', sessionId)
        .lt('confidence', 3) // Confidence is low (1 or 2)
        .order('confidence', { ascending: true })
        .limit(3);

    if (error) {
        console.error("Error fetching weak topics:", error);
        return [];
    }
    return data;
};

// --- STUDY AIDS (Generated Content) ---

export const upsertStudyAid = async (
    sessionId: string,
    path: ActivePath,
    mode: EducationalMode,
    content: any
) => {
    const { error } = await supabase
        .from('session_outputs')
        .upsert({
            session_id: sessionId,
            topic_idx: path.topic,
            subtopic_idx: path.subtopic,
            part_idx: path.part,
            mode,
            content,
        }, { onConflict: 'session_id,topic_idx,subtopic_idx,part_idx,mode' });

    if (error) {
        console.error(`Error upserting study aid for mode ${mode}:`, error);
        throw error;
    }
};

// --- COMPREHENSIVE SESSION LOADER ---

export const getFullSessionData = async (sessionId: string) => {
    const { data: sessionData, error: sessionError } = await supabase
        .from('study_sessions')
        .select('*, full_outline_json')
        .eq('id', sessionId)
        .single();

    if (sessionError) throw new Error(`Could not fetch session: ${sessionError.message}`);

    const { data: partsData, error: partsError } = await supabase
        .from('session_parts')
        .select('*')
        .eq('session_id', sessionId);

    if (partsError) throw new Error(`Could not fetch session parts: ${partsError.message}`);

    const { data: outputsData, error: outputsError } = await supabase
        .from('session_outputs')
        .select('*')
        .eq('session_id', sessionId);

    if (outputsError) throw new Error(`Could not fetch session outputs: ${outputsError.message}`);

    const storedOutline = sessionData.full_outline_json as CourseOutline;
    if (!storedOutline || !storedOutline.topics) {
         throw new Error('Session is missing a valid course outline.');
    }

    const outline: CourseOutlineWithProgress = {
        ...storedOutline,
        course_title: sessionData.title,
        subject: sessionData.subject,
        topics: storedOutline.topics.map((topic, topicIdx) => ({
            ...topic,
            subtopics: (topic.subtopics || []).map((subtopic, subtopicIdx) => ({
                ...subtopic,
                parts: (subtopic.parts || []).map((part, partIdx) => {
                    const partProgress = partsData.find(p => 
                        p.topic_idx === topicIdx && 
                        p.subtopic_idx === subtopicIdx && 
                        p.part_idx === partIdx
                    );
                    return {
                        ...part,
                        completed: partProgress?.completed || false,
                        confidence: partProgress?.confidence || null,
                    };
                })
            }))
        }))
    };
    
    return {
        session: sessionData,
        outline: outline,
        outputs: outputsData,
    };
};

export const appendCourseOutlineParts = async (sessionId: string, newTopics: StudyTopic[], topicIndexOffset: number) => {
    const partsToInsert = newTopics.flatMap((topic, topic_idx_local) =>
        (topic.subtopics || []).flatMap((subtopic, subtopic_idx) =>
            (subtopic.parts || []).map((part, part_idx) => ({
                session_id: sessionId,
                topic_idx: topic_idx_local + topicIndexOffset,
                subtopic_idx,
                part_idx,
                title: part.title,
                summary: part.summary,
                completed: false,
                confidence: null,
            }))
        )
    );

    if (partsToInsert.length === 0) {
        console.log("No new parts to append.");
        return;
    }

    const { error } = await supabase.from('session_parts').insert(partsToInsert);
    if (error) {
        console.error('Error appending course outline parts:', error);
        throw error;
    }
};