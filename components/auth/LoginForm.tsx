"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import BaseButton from "@/components/ui/BaseButton";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("🔐 [LOGIN FORM]: Submitting login form");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save token to localStorage SYNCHRONOUSLY and IMMEDIATELY
      console.log("💾 [LOGIN FORM]: Saving JWT token to localStorage");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("guestMode"); // Clear guest mode if switching to login

      // Verify the token was actually saved
      const savedToken = localStorage.getItem("token");
      console.log("✅ [LOGIN FORM]: Token saved and verified:", !!savedToken);

      // Dispatch a custom event to notify other components that auth state changed
      const authChangeEvent = new Event("authStateChanged");
      window.dispatchEvent(authChangeEvent);

      // Give a tiny delay to ensure localStorage is committed before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log(
        "✅ [LOGIN FORM]: Login successful, redirecting to /role-selection",
      );
      router.push("/role-selection");
    } catch (error: any) {
      console.error("❌ [LOGIN FORM]: Login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    console.log("👤 [LOGIN FORM]: Continue as guest clicked");
    localStorage.setItem("guestMode", "true");
    router.push("/role-selection?guest=true");
  };

  return (
    // FIX: Container Background -> White in Light Mode, Slate in Dark Mode
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-brand-slate/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl dark:shadow-brand border border-gray-200 dark:border-brand-slate/50 transition-colors duration-300">
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-brand-light">
          Sign in to your MorehGuide account
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-5">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 text-sm text-center p-3 rounded-lg border font-medium">
            {error}
          </div>
        )}

        <BaseButton
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full py-3 text-base"
        >
          Sign in
        </BaseButton>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-brand-slate/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            {/* The background here MUST match the container background to hide the line */}
            <span className="px-2 bg-white dark:bg-brand-slate/50 text-gray-500 dark:text-brand-light/60 transition-colors duration-300">
              Or
            </span>
          </div>
        </div>

        {/* Guest Button - Light Mode: Gray, Dark Mode: Slate */}
        <button
          type="button"
          onClick={handleContinueAsGuest}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 dark:bg-brand-slate/50 dark:hover:bg-brand-slate/70 dark:text-brand-cream dark:border-brand-slate/50 font-semibold rounded-lg transition-all duration-200 border hover:border-gray-300 dark:hover:border-brand-slate/70 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue as Guest
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 dark:text-brand-light">
        Don't have an account?{" "}
        <a
          href="/register"
          className="text-brand-accent hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
        >
          Register now
        </a>
      </p>
    </div>
  );
}