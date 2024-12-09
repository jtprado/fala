export interface Message {
    id: string;
    session_id: string;
    user_id: string;
    content: string;
    type: 'text' | 'audio' | 'system';
    translation?: string;
    feedback?: any;
    sequence_number: number;
    created_at: string;
}
  
export interface Session {
    id: string;
    user_id: string;
    title: string;
    language: 'en' | 'es' | 'fr' | 'de';
    level: 'beginner' | 'intermediate' | 'advanced';
    last_message_at: string;
    last_accessed_at: string;
    status: 'active' | 'archived' | 'deleted';
    created_at: string;
}