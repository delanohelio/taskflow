import React, { useState } from "react";
import { KeyRound, Lock, User as UserIcon, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "Usuário ou senha incorretos. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-tr from-brand-900 via-brand-700 to-indigo-950 px-4">
      {/* Decorative glowing blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-10">
        <div className="flex flex-col items-center">
          {/* Logo / Icon */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
            <KeyRound className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Login no TaskFlow</h2>
          <p className="mt-2 text-center text-sm text-brand-100">
            Informe suas credenciais para acessar seu plano de tarefas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-100">
              Usuário
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon className="h-5 w-5 text-brand-200/60" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Insira seu usuário"
                required
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-brand-200/50 outline-none ring-brand-400 transition focus:border-brand-300 focus:bg-white/10 focus:ring-2 focus:ring-offset-0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-100">
              Senha
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-brand-200/60" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira sua senha"
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
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-500/20 p-3 text-center text-xs font-medium text-red-200 border border-red-500/30">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-brand-900" /> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
