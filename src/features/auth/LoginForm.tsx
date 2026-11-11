"use client";

import { useLayoutEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";

import { Alert } from "@/components/ui";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { destinoTrasLogin } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/authStore";

/**
 * Formulario de inicio de sesión (antes LoginPage.jsx).
 *
 * Tras un login correcto vuelve a la ruta que pidió el guard (`?next=`) si el
 * rol puede verla; si no, va a la sección principal del rol.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  // ?correo= llega desde la verificación o la recuperación de contraseña
  const [email, setEmail] = useState(searchParams.get("correo") ?? "");
  const [password, setPassword] = useState("");
  /** Correo que intentó entrar sin haberlo verificado (muestra el aviso con el enlace). */
  const [sinVerificar, setSinVerificar] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  // Con Cache Components la página queda oculta en memoria al navegar.
  // Se borra la contraseña al ocultarse para que no permanezca en el DOM.
  useLayoutEffect(() => {
    return () => setPassword("");
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSinVerificar(null);
    setCargando(true);
    const result = await login(email.trim(), password);
    setCargando(false);

    if (result.success) {
      toast.success("¡Bienvenido al sistema!", { duration: 3000 });
      router.replace(destinoTrasLogin(searchParams.get("next"), result.user.nombreRol));
    } else if (result.error.codigo === "CORREO_NO_VERIFICADO") {
      setSinVerificar(email.trim().toLowerCase());
    } else {
      // El backend explica cada caso (credenciales, cuenta inactiva o
      // bloqueada por intentos); se muestra tal cual.
      toast.error(result.error.message || "Credenciales incorrectas", { duration: 5000 });
    }
  };

  return (
    <div className={`${cardClass} max-w-md`}>
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full bg-verde-claro px-3 py-1 text-xs font-semibold uppercase tracking-wider text-verde-oscuro">
          UAEMéx - Control TIC
        </span>
        <h1 className="text-3xl font-extrabold text-sobre-superficie">Inicio de Sesión</h1>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Correo Electrónico
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="admin@uaemex.mx"
          />
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <div className="-mt-2 text-right">
          <Link
            href={email.trim() ? `/olvide-password?correo=${encodeURIComponent(email.trim().toLowerCase())}` : "/olvide-password"}
            className="text-sm font-semibold text-verde transition-colors hover:text-dorado-texto"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {sinVerificar && (
          <Alert tone="alerta" title="Tu correo aún no está verificado.">
            Escribe el código que te enviamos al registrarte o pide uno nuevo.{" "}
            <Link
              href={`/verificar-correo?correo=${encodeURIComponent(sinVerificar)}`}
              className="font-bold underline underline-offset-2"
            >
              Verificar mi correo
            </Link>
          </Alert>
        )}

        <button type="submit" disabled={cargando} className={`${primaryButtonClass} w-full py-3.5`}>
          {cargando ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {cargando ? "Autenticando..." : "Ingresar al Sistema"}
        </button>
      </form>

      <div className="mt-6 border-t border-variante pt-5 text-center">
        <p className="text-sm text-sobre-variante">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-verde transition-colors hover:text-dorado-texto"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
