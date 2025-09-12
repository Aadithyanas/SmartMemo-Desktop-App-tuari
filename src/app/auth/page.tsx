"use client";

import Auth from "../../components/AuthScreen";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    
    router.replace("/");
  };

  return <Auth onAuthSuccess={handleAuthSuccess} />;
}
