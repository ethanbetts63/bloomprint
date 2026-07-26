"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from "@/app/login/LoginForm";
import { useAuth } from '@/context/AuthContext';
import { roleHome } from '@/lib/roleHome';

const LoginPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(roleHome(user.role));
  }, [isLoading, router, user]);

  if (isLoading || user) {
    return <div className="min-h-screen bg-[var(--surface-beige)]" />;
  }

  return (
    <div className="bg-[var(--surface-beige)] flex flex-grow min-h-full flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
