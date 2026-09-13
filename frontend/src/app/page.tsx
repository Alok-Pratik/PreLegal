'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';
import { UserMenu } from '@/components/UserMenu';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#753991]"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#032147]">Prelegal</h1>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h2 className="text-2xl font-bold text-[#032147]">Welcome to Prelegal</h2>
          <p className="text-[#888888] mt-2">
            Document creation is coming soon. You&apos;re signed in as {user.email}.
          </p>
        </div>
      </main>
    </div>
  );
}
