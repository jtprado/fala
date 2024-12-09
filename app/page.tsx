import { redirect } from "next/navigation";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WelcomeScreen } from "@/components/chat/welcome-screen";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  
  // Use getUser instead of getSession for security
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  // Get user's active sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('last_accessed_at', { ascending: false })
    .limit(1);

  // If user has an active session, redirect to it
  if (sessions && sessions.length > 0) {
    redirect(`/c/${sessions[0].id}`);
  }

  return (
    <main className="flex min-h-screen flex-col">
      <WelcomeScreen />
    </main>
  );
}
