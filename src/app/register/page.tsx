"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to login page on success
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Algo salió mal al crear la cuenta.");
      }
    } catch (err) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#070913] text-[#c5c6c7] p-6">
      <div className="w-full max-w-md p-8 bg-[#0d1124] border border-[#252a52] rounded-xl shadow-2xl space-y-6">
        <div className="text-center">
          <span className="text-2xl font-extrabold tracking-wider text-[#a78bfa]">🌌 CHRON0V4</span>
          <h2 className="text-xl font-bold text-white mt-4">Crear Nueva Cuenta</h2>
          <p className="text-xs text-[#7c8ba1] mt-1">Regístrate para gestionar tu trazabilidad técnica</p>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-500 bg-red-950/20 border border-red-900/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-2">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ada Lovelace"
              className="w-full bg-[#070913] border border-[#252a52] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
            />
          </div>
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
            {submitting ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#7c8ba1]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#a78bfa] hover:underline font-semibold">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
