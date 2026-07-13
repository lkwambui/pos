import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2, Store, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/';
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-white" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-blue-300" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
            <Store size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">SwiftPOS</h1>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Point of sale system designed for Kenyan businesses. Manage sales, inventory, reports, and eTIMS compliance.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            {['Sales & Payments', 'Inventory Management', 'eTIMS Integration', 'Reports & Analytics'].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-blue-100 text-sm">
                <ChevronRight size={14} className="text-blue-300" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-in fade-in duration-500">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Store size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">SwiftPOS</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to continue to SwiftPOS</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">!</span>
              </div>
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@swiftpos.com"
                  required
                  autoFocus
                  className="w-full h-11 pl-4 pr-4 rounded-xl bg-input-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full h-11 pl-4 pr-11 rounded-xl bg-input-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              {submitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : null}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            SwiftPOS v1.0 &mdash; Kenya Edition
          </p>
        </div>
      </div>
    </div>
  );
}
