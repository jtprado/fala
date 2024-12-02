"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Database } from "@/lib/supabase/client";

export default function SignIn() {
  const supabase = createClientComponentClient<Database>();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <h1 className="mb-8 text-2xl font-bold text-center">
          Welcome to Language Learning Chat
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          redirectTo="/auth/callback"
          theme="dark"
          providers={[]}
        />
      </div>
    </div>
  );
}
