import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameBoard } from './components/GameBoard';
import { Auth } from './components/Auth';
import { LogOut } from 'lucide-react';
import { auth as firebaseAuth } from './lib/firebase';

import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  useEffect(() => {
    // Optionally fetch user profile with token here to rehydrate user state
    // For now, if we have a token, we assume logged in.
  }, [token]);

  const handleLoginSuccess = (newToken: string, _userData: any) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    firebaseAuth.signOut();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-secondary/50 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">MW</h1>
          </div>
          {token && (
            <button 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </header>
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {!token ? (
            <Auth onLoginSuccess={handleLoginSuccess} />
          ) : (
            <GameBoard token={token} />
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
