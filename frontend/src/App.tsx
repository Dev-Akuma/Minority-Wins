import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameBoard } from './components/GameBoard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-secondary/50 p-4">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Minority Wins</h1>
        </header>
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <GameBoard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
