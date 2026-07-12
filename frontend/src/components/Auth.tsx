import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setupRecaptcha, auth as firebaseAuth } from '../lib/firebase';
import { signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { Phone, ShieldCheck, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function Auth({ onLoginSuccess }: { onLoginSuccess: (token: string, user: any) => void }) {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Setup recaptcha on mount
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = setupRecaptcha('recaptcha-container');
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.startsWith('+91') || phoneNumber.length < 13) {
      setError('Please enter a valid Indian phone number starting with +91');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('OTP must be exactly 6 digits.');
      return;
    }
    if (!confirmationResult) return;

    setError(null);
    setIsLoading(true);

    try {
      // 1. Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // 2. Send token to our NestJS Backend
      const res = await fetch(`${API_URL}/auth/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, // Still keeping it in header for best practices
        },
        body: JSON.stringify({ idToken, phoneNumber }), // Passing idToken in the body!
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Backend authentication failed');
      }

      const data = await res.json();
      
      // 3. Complete login
      onLoginSuccess(data.access_token, data.user);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP or authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-secondary/10 p-8 rounded-3xl border border-secondary/30 backdrop-blur-md shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">Welcome</h2>
          <p className="text-muted-foreground">Log in to place your stakes.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.form 
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-background border border-secondary/50 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Enter 6-Digit OTP
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading}
                    className="w-full bg-background border border-secondary/50 rounded-xl py-3 pl-10 pr-4 text-foreground text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    placeholder="------"
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('phone')}
                disabled={isLoading}
                className="w-full text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Change Phone Number
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        
        {/* Invisible Recaptcha */}
        <div id="recaptcha-container" className="mt-4 flex justify-center"></div>
      </motion.div>
    </div>
  );
}
