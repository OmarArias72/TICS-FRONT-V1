"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LogOut, Menu, X } from "lucide-react";

import { enlacesDeMenu } from "@/lib/auth/roles";
import { cerrarSesion, useAuthStore } from "@/store/authStore";

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-superficie transition-colors hover:text-dorado"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-dorado" aria-hidden="true" />
      Control<span className="text-dorado">Tech</span>
    </Link>
  );
}

/**
 * Barra superior y menú lateral.
 *
 * Los enlaces del menú salen de `lib/auth/roles.ts`, la misma tabla que usa el
 * guard de rutas, así que cada rol solo ve las secciones a las que puede entrar.
 */
export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const rol = user?.nombreRol;
  const enlacesPrincipales = enlacesDeMenu(rol, "principal");
  const enlacesAdmin = enlacesDeMenu(rol, "admin");
  const nombreCompleto = user ? `${user.nombre} ${user.apellidos ?? ""}`.trim() : "";

  // Cerrar el menú con la tecla Escape mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const cerrarMenu = () => setIsOpen(false);

  // "/" solo se marca activo en la portada; las demás rutas incluyen sus subrutas.
  const claseEnlace = (href: string) => {
    const activo =
      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    return `flex items-center gap-2 px-6 py-3 transition-colors ${
      activo
        ? "bg-verde-claro/50 font-bold text-verde"
        : "hover:bg-superficie hover:text-verde"
    }`;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-verde-oscuro bg-verde-oscuro text-superficie shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {hasHydrated && user && (
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="rounded-xl p-2 text-verde-claro transition-colors hover:bg-verde hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
                  aria-label="Abrir menú"
                  aria-expanded={isOpen}
                  aria-controls="menu-lateral"
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </button>
              )}
              <Logo />
            </div>

            {hasHydrated && !user && (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-verde-claro transition-colors hover:bg-verde hover:text-white"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-xl bg-dorado px-4 py-2 text-sm font-semibold text-dorado-oscuro shadow-md transition-colors hover:bg-dorado-claro"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {user && isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-verde-oscuro/60 backdrop-blur-sm"
            onClick={cerrarMenu}
            aria-hidden="true"
          />

          <aside
            id="menu-lateral"
            role="dialog"
            aria-modal="true"
            aria-label="Menú del sistema"
            className="relative z-10 flex h-full w-80 max-w-xs flex-col border-r border-variante bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-verde-oscuro p-5 text-superficie">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-dorado" aria-hidden="true" />
                <span className="text-sm font-extrabold tracking-wide">Menú del Sistema</span>
              </div>
              <button
                type="button"
                onClick={cerrarMenu}
                className="rounded-lg p-1 text-verde-claro transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-dorado"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-variante bg-superficie p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                Usuario Activo
              </span>
              <p className="truncate text-sm font-bold text-sobre-superficie">{nombreCompleto}</p>
              <span className="mt-1 inline-block rounded-full border border-verde/20 bg-verde-claro px-2.5 py-0.5 text-[10px] font-semibold uppercase text-verde-oscuro">
                {rol}
              </span>
            </div>

            <div className="flex-1 divide-y divide-variante overflow-y-auto py-2 text-sm font-semibold text-sobre-variante">
              <div className="py-2">
                <Link href="/" onClick={cerrarMenu} className={claseEnlace("/")}>
                  <House className="h-4 w-4" aria-hidden="true" />
                  Inicio
                </Link>
                {enlacesPrincipales.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={cerrarMenu}
                    className={claseEnlace(item.href)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {enlacesAdmin.length > 0 && (
                <div className="bg-superficie/60 py-2">
                  <span className="block px-6 py-1 text-[10px] font-bold uppercase tracking-wider text-dorado-texto">
                    Administración TIC
                  </span>
                  {enlacesAdmin.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={cerrarMenu}
                      className={`${claseEnlace(item.href)} py-2.5 text-xs`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-variante bg-white p-4">
              <button
                type="button"
                onClick={cerrarSesion}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-error-claro py-2.5 text-xs font-bold text-error-oscuro transition-colors hover:bg-error hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar Sesión
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
