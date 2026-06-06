import React, { useState, useEffect } from 'react';
import { AppUser } from './types';
import { validateStoredAuth } from './lib/auth';
import { initializeCapacitor } from './lib/capacitor';
import LandingPage from './components/landing/LandingPage';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

type AppView = 'landing' | 'auth' | 'app';

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeCapacitor();
        const validUser = await validateStoredAuth();
        if (validUser) {
          setUser(validUser);
          setView('app');
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAuthSuccess = (userData: AppUser) => {
    setUser(userData);
    setView('app');
  };

  const handleSignOut = () => {
    setUser(null);
    setView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-stone-400 text-sm">Loading LCE Lessons...</p>
        </div>
      </div>
    );
  }

  if (view === 'app' && user) {
    return <Dashboard user={user} onSignOut={handleSignOut} />;
  }

  if (view === 'auth') {
    return <AuthForm onAuthSuccess={handleAuthSuccess} onBack={() => setView('landing')} />;
  }

  return <LandingPage onEnterApp={() => setView('auth')} />;
}

export default App;
