import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';

export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: {
    sessionId: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const sessionId = params.sessionId;

  if (!sessionId) {
    redirect('/');
  }
  
  // Use getUser instead of getSession for security
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/sign-in');
  }

  // Verify the chat session exists and belongs to the user
  const { data: chatSession, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !chatSession) {
    redirect('/');
  }

  return (
    <div className="flex h-screen">
      <ChatInterface sessionId={sessionId} />
    </div>
  );
}
