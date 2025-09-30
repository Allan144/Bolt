import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { AuthUser, validateStoredAuth } from './lib/supabase';
import { initializeCapacitor } from './lib/capacitor';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(true);

  useEffect(() => {
    // Check for stored authentication session
    const initializeAuth = async () => {
      try {
        // Initialize Capacitor for mobile platforms
        await initializeCapacitor();
        
        // Validate current Supabase session
        const validatedUser = await validateStoredAuth();
        if (validatedUser) {
          setUser(validatedUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const handleAuthSuccess = (userData: AuthUser) => {
    setUser(userData);
  };

  const handleSignOut = async () => {
    setUser(null);
  };

  const handleExit = () => {
    setShowApp(false);
  };

  if (!showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <div className="text-6xl">👋</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank you for using MedReminder Pro</h1>
          <p className="text-gray-600 text-lg">Your medication management companion</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onSignOut={handleSignOut} onExit={handleExit} />
      ) : (
        <AuthForm onAuthSuccess={handleAuthSuccess} onExit={handleExit} />
      )}
    </div>
  );
}

export default App;