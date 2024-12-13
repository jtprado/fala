export type SessionLanguage = 'en' | 'es' | 'fr' | 'de';
export type SessionLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionStatus = 'active' | 'archived' | 'deleted';
export type MessageType = 'text' | 'audio' | 'system';

export interface Message {
    id: string;
    session_id: string;
    user_id: string;
    content: string;
    type: MessageType;
    translation?: string;
    sequence_number: number;
    created_at: string;
}

export interface MessageFeedback {
    id: string;
    message_id: string;
    pronunciation_score: number;
    accuracy_score: number;
    fluency_score: number;
    completeness_score: number;
    created_at: string;
    updated_at: string;
}
  
export interface Session {
    id: string;
    user_id: string;
    title: string;
    language: SessionLanguage;
    level: SessionLevel;
    last_message_at: string;
    last_accessed_at: string;
    status: SessionStatus;
    created_at: string;
}
