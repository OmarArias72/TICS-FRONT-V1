"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { Alert, ConfirmDialog, PageContainer, PageLoader } from "@/components/ui";
import { equipoComputoService, salaService } from "@/lib/api/services";
import type { EquipoComputo, Sala } from "@/types/api";

import { CLAVES_INVENTARIO, clavesAulas } from "./claves";
import { EquipoFormModal } from "./EquipoFormModal";
import { agruparPorSala } from "./equipos";
import { ResumenSalaModal } from "./ResumenSalaModal";
import { SalaEquiposView } from "./SalaEquiposView";
import { SalaFormModal } from "./SalaFormModal";
import { SalasView } from "./SalasView";

/**
 * Mapa de Aulas para Admin y Operador (antes ClassroomMapPage.jsx).
 * Permiso de la ruta: "salas.ver".
 *
 * La sala abierta va en la URL (`/aulas?sala=3`), así el botón Atrás del
 * navegador regresa al listado y el enlace se puede compartir. En el original
 * vivía en un estado que se perdía al recargar.
 */
export function AulasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const idSala = Number(searchParams.get("sala")) || null;
  const [idEquipo, setIdEquipo] = useState<number | null>(null);

  const [editandoSala, setEditandoSala] = useState<{ sala: Sala | null } | null>(null);
  const [resumenDe, setResumenDe] = useState<Sala | null>(null);
  const [editandoEquipo, setEditandoEquipo] = useState<{ equipo: EquipoComputo | null } | null>(null);
  const [eliminando, setEliminando] = useState<EquipoComputo | null>(null);

  const salasQuery = useQuery({ queryKey: clavesAulas.salas, queryFn: salaService.listarTodas });
  const equiposQuery = useQuery({ queryKey: clavesAulas.equipos, queryFn: equipoComputoService.listarTodos });

  const salas = salasQuery.data ?? [];
  const porSala = agruparPorSala(equiposQuery.data ?? []);
  const sala = idSala === null ? null : (salas.find((s) => s.idSala === idSala) ?? null);

  const abrirSala = (s: Sala | null) => {
    setIdEquipo(null);
    router.push(s ? `${pathname}?sala=${s.idSala}` : pathname, { scroll: true });
  };

  const eliminar = useMutation({
    mutationFn: (ec: EquipoComputo) => equipoComputoService.eliminar(ec.idEquipoComputo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesAulas.equipos });
      for (const clave of CLAVES_INVENTARIO) void queryClient.invalidateQueries({ queryKey: clave });
      toast.success("Equipo eliminado");
      setEliminando(null);
      setIdEquipo(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (salasQuery.isPending) return <PageLoader label="Cargando salas..." />;
  if (salasQuery.isError) {
    return (
      <PageContainer>
        <Alert tone="error">{salasQuery.error.message}</Alert>
      </PageContainer>
    );
  }

  return (
    <>
      {equiposQuery.isError && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
          <Alert tone="error">{equiposQuery.error.message}</Alert>
        </div>
      )}

      {sala ? (
        <SalaEquiposView
          key={sala.idSala}
          sala={sala}
          equipos={porSala.get(sala.idSala) ?? []}
          cargando={equiposQuery.isPending}
          idSeleccionado={idEquipo}
          onSeleccionar={setIdEquipo}
          onVolver={() => abrirSala(null)}
          onResumen={() => setResumenDe(sala)}
          onNuevo={() => setEditandoEquipo({ equipo: null })}
          onEditar={(equipo) => setEditandoEquipo({ equipo })}
          onEliminar={setEliminando}
        />
      ) : (
        <>
          {idSala !== null && (
            <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
              <Alert tone="alerta">La sala solicitada no existe o fue eliminada.</Alert>
            </div>
          )}
          <SalasView
            salas={salas}
            porSala={porSala}
            cargandoEquipos={equiposQuery.isPending}
            onAbrir={abrirSala}
            onResumen={setResumenDe}
            onEditar={(s) => setEditandoSala({ sala: s })}
          />
        </>
      )}

      <SalaFormModal open={editandoSala !== null} sala={editandoSala?.sala ?? null} onClose={() => setEditandoSala(null)} />
      <ResumenSalaModal
        sala={resumenDe}
        equipos={resumenDe ? (porSala.get(resumenDe.idSala) ?? []) : []}
        onClose={() => setResumenDe(null)}
      />
      {sala && (
        <EquipoFormModal
          open={editandoEquipo !== null}
          equipo={editandoEquipo?.equipo ?? null}
          salaInicial={sala}
          salas={salas}
          onClose={() => setEditandoEquipo(null)}
          onGuardado={(guardado) => setIdEquipo(guardado.idEquipoComputo)}
        />
      )}
      <ConfirmDialog
        open={eliminando !== null}
        onClose={() => setEliminando(null)}
        onConfirm={() => eliminando && eliminar.mutate(eliminando)}
        loading={eliminar.isPending}
        title="Eliminar equipo"
        description={
          eliminando
            ? `Se eliminará ${eliminando.equipo.inventario} del mapa y también del inventario. Si solo dejó de usarse, mejor cámbialo a BAJA.`
            : undefined
        }
        confirmLabel="Eliminar"
      />
    </>
  );
}
