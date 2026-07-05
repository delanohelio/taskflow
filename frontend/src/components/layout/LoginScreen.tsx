import React, { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginScreenProps {
  onLogin: (password: string) => void;
  hasError: boolean;
}

export default function LoginScreen({ onLogin, hasError }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    // Trigger login
    onLogin(password);
    // Reset loading state shortly after (in case it fails and stays on this screen)
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-tr from-brand-900 via-brand-700 to-indigo-950 px-4">
      {/* Decorative glowing blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-10">
        <div className="flex flex-col items-center">
          {/* Logo / Icon */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
            <KeyRound className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Acesso Restrito</h2>
          <p className="mt-2 text-center text-sm text-brand-100">
            Esta instância do TaskFlow está protegida por senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-100">
              Senha de Acesso
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-brand-200/60" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha do painel"
                required
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-white placeholder-brand-200/50 outline-none ring-brand-400 transition focus:border-brand-300 focus:bg-white/10 focus:ring-2 focus:ring-offset-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-200/60 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {hasError && (
              <p className="mt-2 text-xs font-medium text-red-300">
                Senha incorreta. Por favor, tente novamente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand-900" />
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
