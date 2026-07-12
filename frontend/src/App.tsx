import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameBoard } from './components/GameBoard';
import { Auth } from './components/Auth';
import { LogOut } from 'lucide-react';
import { auth as firebaseAuth } from './lib/firebase';

const queryClient = new QueryClient();

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [user, setUser] = useState<any>(null); // Ideally typed

  useEffect(() => {
    // Optionally fetch user profile with token here to rehydrate user state
    // For now, if we have a token, we assume logged in.
  }, [token]);

  const handleLoginSuccess = (newToken: string, userData: any) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
    firebaseAuth.signOut();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-secondary/50 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Minority Wins</h1>
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
