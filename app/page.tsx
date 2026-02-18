import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

/**
 * SSR Root Page.
 * Decides whether to send the user to the Dashboard or Login page based on session.
 * Justification for SSR: Eliminates the loading flicker and client-side fetch on the landing page.
 */
import LandingPage from "@/components/LandingPage";

export default async function IndexPage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
