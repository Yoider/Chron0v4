"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered")) {
      setSuccess("¡Cuenta creada exitosamente! Por favor inicia sesión.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Usuario o contraseña incorrectos.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error en el inicio de sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGitHubLogin = () => {
    signIn("github", { callbackUrl: "/" });
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#0d1124] border border-[#252a52] rounded-xl shadow-2xl space-y-6">
      <div className="text-center">
        <span className="text-2xl font-extrabold tracking-wider text-[#a78bfa]">🌌 CHRON0V4</span>
        <h2 className="text-xl font-bold text-white mt-4">Iniciar Sesión</h2>
        <p className="text-xs text-[#7c8ba1] mt-1">Ingresa a tu espacio personal de trazabilidad</p>
      </div>

      {success && (
        <div className="p-3 text-xs text-[#a78bfa] bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 text-xs text-red-500 bg-red-950/20 border border-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-2">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="correo@ejemplo.com"
            className="w-full bg-[#070913] border border-[#252a52] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-2">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-[#070913] border border-[#252a52] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] rounded-lg font-bold text-sm transition-all"
        >
          {submitting ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 w-full border-t border-[#252a52]" />
        <span className="relative px-3 bg-[#0d1124] text-xs text-[#7c8ba1]">O continuar con</span>
      </div>

      <button
        onClick={handleGitHubLogin}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#151932] hover:bg-[#252a52] border border-[#252a52] rounded-lg text-sm font-semibold text-white transition-all"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span>GitHub</span>
      </button>

      <div className="text-center text-xs text-[#7c8ba1]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[#a78bfa] hover:underline font-semibold">
          Regístrate
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#070913] text-[#c5c6c7] p-6">
      <Suspense fallback={<div className="text-[#7c8ba1]">Cargando...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
