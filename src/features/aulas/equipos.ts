import type { EquipoComputo, EstadoComputadora } from "@/types/api";

/**
 * Utilidades del Mapa de Aulas (antes ClassroomMapPage.jsx y
 * RoomDetailsHubModal.jsx). Se trabaja con la entidad del backend tal cual;
 * el original la copiaba a un objeto con nombres en snake_case.
 */

/** Opciones válidas según los CHECK de la base de datos. */
export const OPCIONES = {
  teclado: ["Bueno", "Teclas dañadas", "Teclas faltantes", "Sin respuesta", "Cable dañado", "Dañado"],
  mouse: ["Bueno", "Clic dañado", "Scroll dañado", "Sin respuesta", "Cable dañado", "Dañado"],
  monitor: ["Bueno", "Sin imagen", "Imagen distorsionada", "Píxeles muertos", "Pantalla rayada", "Pantalla rota", "Dañado"],
  ethernet: ["Bueno", "Conector dañado", "Cable cortado", "Sin conexión", "Dañado"],
  cpu: ["Funciona", "No funciona", "Con fallas", "En revisión", "Requiere mantenimiento"],
  computadora: ["Funcionando", "Requiere revisión", "Requiere Mantenimiento", "No funciona"],
} as const;

export const ESTADOS_COMPUTADORA = OPCIONES.computadora;

/**
 * Estado general de la PC. Si no se capturó `estadoComputadora`, se deduce del
 * estado del CPU, como hacía el original.
 */
export function estadoPc(ec: EquipoComputo): EstadoComputadora {
  if (ec.estadoComputadora) return ec.estadoComputadora;
  switch (ec.estadoCpu) {
    case "No funciona":
      return "No funciona";
    case "Requiere mantenimiento":
      return "Requiere Mantenimiento";
    case "Con fallas":
    case "En revisión":
      return "Requiere revisión";
    default:
      return "Funcionando";
  }
}

/** Orden en la cuadrícula: primero lo que más urge atender. */
const PRIORIDAD: Record<string, number> = {
  "No funciona": 3,
  "Requiere Mantenimiento": 2,
  "Requiere revisión": 1,
  Funcionando: 0,
};

export function compararPorPrioridad(a: EquipoComputo, b: EquipoComputo): number {
  return (
    (PRIORIDAD[estadoPc(b)] ?? 0) - (PRIORIDAD[estadoPc(a)] ?? 0) ||
    a.equipo.inventario.localeCompare(b.equipo.inventario, "es", { numeric: true })
  );
}

export interface ConteoSala {
  total: number;
  porEstado: Record<string, number>;
  /** Equipos que no están "Funcionando". */
  problemas: number;
}

export function contarEquipos(equipos: EquipoComputo[]): ConteoSala {
  const porEstado: Record<string, number> = {};
  for (const ec of equipos) {
    const e = estadoPc(ec);
    porEstado[e] = (porEstado[e] ?? 0) + 1;
  }
  return { total: equipos.length, porEstado, problemas: equipos.length - (porEstado.Funcionando ?? 0) };
}

/** Agrupa los equipos por sala. Los que no tienen sala quedan fuera. */
export function agruparPorSala(equipos: EquipoComputo[]): Map<number, EquipoComputo[]> {
  const mapa = new Map<number, EquipoComputo[]>();
  for (const ec of equipos) {
    const id = ec.sala?.idSala;
    if (id === undefined) continue;
    const lista = mapa.get(id);
    if (lista) lista.push(ec);
    else mapa.set(id, [ec]);
  }
  return mapa;
}

/** Nombre corto del sistema operativo para el resumen. */
function familiaSistema(so: string | null): string {
  const v = (so ?? "").toLowerCase();
  if (!v.trim()) return "No especificado";
  if (v.includes("windows 11")) return "Windows 11";
  if (v.includes("windows 10")) return "Windows 10";
  if (v.includes("windows")) return "Windows (otra versión)";
  if (v.includes("ubuntu")) return "Ubuntu";
  if (v.includes("linux")) return "Linux";
  if (v.includes("mac")) return "macOS";
  return so!.trim();
}

export type Periferico = "teclado" | "mouse" | "monitor" | "ethernet" | "cpu";

export const NOMBRE_PERIFERICO: Record<Periferico, string> = {
  teclado: "Teclado",
  mouse: "Mouse",
  monitor: "Monitor",
  ethernet: "Cable de red",
  cpu: "CPU",
};

/** Valor del periférico en un equipo; null si no se capturó. */
export function valorPeriferico(ec: EquipoComputo, p: Periferico): string | null {
  switch (p) {
    case "teclado":
      return ec.estadoTeclado;
    case "mouse":
      return ec.estadoMouse;
    case "monitor":
      return ec.estadoMonitor;
    case "ethernet":
      return ec.estadoCableEthernet;
    case "cpu":
      return ec.estadoCpu;
  }
}

/** Un periférico está bien si es "Bueno" (o "Funciona" para el CPU) o no se capturó. */
export function perifericoConFalla(valor: string | null): boolean {
  return valor !== null && valor !== "" && valor !== "Bueno" && valor !== "Funciona";
}

export interface ResumenSala {
  conteo: ConteoSala;
  sistemas: Array<[string, number]>;
  /** Por periférico: total con falla y desglose por tipo de falla. */
  fallas: Array<{ periferico: Periferico; total: number; detalle: Array<[string, number]> }>;
}

/** Resumen de una sala (decisión 2026-10-30: sin el conteo de software por palabras clave). */
export function resumirSala(equipos: EquipoComputo[]): ResumenSala {
  const sistemas: Record<string, number> = {};
  const fallas: Record<Periferico, Record<string, number>> = { teclado: {}, mouse: {}, monitor: {}, ethernet: {}, cpu: {} };

  for (const ec of equipos) {
    const so = familiaSistema(ec.sistemaOperativo);
    sistemas[so] = (sistemas[so] ?? 0) + 1;
    for (const p of Object.keys(fallas) as Periferico[]) {
      const v = valorPeriferico(ec, p);
      if (perifericoConFalla(v)) fallas[p][v!] = (fallas[p][v!] ?? 0) + 1;
    }
  }

  const ordenar = (r: Record<string, number>) => Object.entries(r).sort((a, b) => b[1] - a[1]);
  return {
    conteo: contarEquipos(equipos),
    sistemas: ordenar(sistemas),
    fallas: (Object.keys(fallas) as Periferico[]).map((p) => {
      const detalle = ordenar(fallas[p]);
      return { periferico: p, total: detalle.reduce((s, [, n]) => s + n, 0), detalle };
    }),
  };
}
