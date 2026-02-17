"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function App() {
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Check if user has session
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          // User is authenticated, go to dashboard
          router.push("/dashboard");
        } else {
          // Not authenticated, go to login
          router.push("/login");
        }
      } catch (error) {
        // Error, go to login
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
