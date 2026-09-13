'use client';

import { ReactNode } from 'react';
import { User } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';

export type AppView = 'documents' | 'chat';

interface AppHeaderProps {
  user: User;
  view: AppView;
  onNavigate: (view: AppView) => void;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

function NavTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-brand-purple text-brand-purple' : 'border-transparent text-brand-gray hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

export function AppHeader({ user, view, onNavigate, title, subtitle, actions }: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow" aria-hidden="true" />
            <span className="text-lg font-bold text-brand-navy">Prelegal</span>
          </div>
          <UserMenu user={user} />
        </div>

        <div className="flex items-center justify-between pt-3 pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-brand-navy">{title}</h1>
            <p className="text-sm text-brand-gray">{subtitle}</p>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        <nav className="flex gap-6">
          <NavTab active={view === 'documents'} onClick={() => onNavigate('documents')}>
            My Documents
          </NavTab>
          <NavTab active={view === 'chat'} onClick={() => onNavigate('chat')}>
            New Document
          </NavTab>
        </nav>
      </div>
    </header>
  );
}
