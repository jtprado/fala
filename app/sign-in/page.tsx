"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/lib/supabase/client";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Refresh to update auth state
      router.refresh();
      
      // Get the redirect URL from query parameters or default to home
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirectUrl') || '/';
      router.push(redirectUrl);
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "Invalid login credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check your email to confirm your account",
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: "Error creating account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Pass the current URL's redirect parameter to the OAuth flow
            redirectTo: new URLSearchParams(window.location.search).get('redirectUrl') || '/',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('OAuth sign in error:', error);
      toast({
        title: "Error",
        description: "Error signing in with OAuth",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Language Learning Chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to start learning
          </p>
        </div>

        <form onSubmit={handleSignIn} className="mt-8 space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          
          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Sign in"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={handleSignUp}
            >
              Create account
            </Button>
          </div>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
          >
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading}
          >
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
