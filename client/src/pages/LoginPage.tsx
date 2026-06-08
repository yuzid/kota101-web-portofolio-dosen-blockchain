import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, FileCheck, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email tidak boleh kosong');
      return;
    }
    if (!password) {
      setError('Password tidak boleh kosong');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsLoading(true);
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        navigate('/dashboard');
      } else {
        throw new Error('ID Token tidak ditemukan dari Google.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
              <FileCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">POLBAN</h1>
              <p className="text-sm opacity-90">Politeknik Negeri Bandung</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Sistem Manajemen<br />
              Portofolio Kinerja Dosen
            </h2>
            <p className="text-lg opacity-90">
              Berbasis Blockchain untuk Transparansi dan Integritas Data
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm opacity-75">
          <p>Jurusan Teknik Komputer dan Informatika</p>
          <p>&copy; 2026 Politeknik Negeri Bandung</p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold mb-2">Masuk ke Sistem</h1>
            <p className="text-muted-foreground">
              Masukkan kredensial Anda untuk mengakses sistem
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="w-full flex flex-col items-center justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Otentikasi Google gagal.')}
              theme="outline"
              size="large"
            />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Atau masuk dengan email</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@polban.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                className="h-11"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun? Hubungi administrator sistem.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}