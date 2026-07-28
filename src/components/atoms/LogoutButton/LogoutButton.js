"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./LogoutButton.scss";

export default function LogoutButton({ className = "logout-button" }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={logout}>
      Se déconnecter
    </button>
  );
}
