import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/';
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return null;

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f9fafb',
    }}>
      {/* Left panel - branding */}
      <div style={{
        display: 'none',
        flex: '0 0 480px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        padding: '60px 48px',
        justifyContent: 'space-between',
        flexDirection: 'column',
      }} className="lg:flex lg:flex-col">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#0f172a" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>SwiftPOS</span>
          </div>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2, lineHeight: 1.3, color: '#f1f5f9' }}>
            Point of Sale<br />Made Simple
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
            Manage sales, inventory, customers, and eTIMS compliance all in one place.
          </Typography>
        </div>
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
            {['Sales', 'Inventory', 'Reports', 'eTIMS'].map(label => (
              <span key={label} style={{ fontSize: 12, color: '#475569' }}>{label}</span>
            ))}
          </div>
          <Typography sx={{ color: '#334155', fontSize: 12 }}>
            &copy; {new Date().getFullYear()} SwiftPOS. All rights reserved.
          </Typography>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: 400, maxWidth: '100%' }}>
          {/* Mobile header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }} className="lg:hidden">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color="#0f172a" />
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>SwiftPOS</span>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Sign in to your account to continue
            </Typography>
          </div>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: 13 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="small"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: '#fff',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0f172a', borderWidth: 1.5 },
                },
                '& .MuiInputLabel-root': { fontSize: 13 },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0f172a' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: '#fff',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0f172a', borderWidth: 1.5 },
                },
                '& .MuiInputLabel-root': { fontSize: 13 },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0f172a' },
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={submitting}
              disableElevation
              sx={{
                py: 1.4,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 600,
                background: '#0f172a',
                '&:hover': { background: '#1e293b' },
                '&.Mui-disabled': { background: '#94a3b8' },
              }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 4,
              color: '#94a3b8',
              fontSize: 12,
            }}
            className="hidden lg:block"
          >
            &copy; {new Date().getFullYear()} SwiftPOS
          </Typography>
        </div>
      </div>
    </div>
  );
}
