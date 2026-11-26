import { CapacidadEconomica, CondicionFormalidad } from "../../types/negova";

interface Step4CapacidadProps {
  capacidad: CapacidadEconomica;
  formalidad: CondicionFormalidad;
  onChange: (updated: CapacidadEconomica) => void;
}

const INPUT_CLASS =
  "w-full h-11 px-3.5 text-sm font-mono tabular-nums bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)] transition-colors";

export function Step4Capacidad({
  capacidad,
  formalidad,
  onChange,
}: Step4CapacidadProps) {
  const esJuridicaFormal =
    formalidad === "Persona jurídica 100% formal (EE.FF. auditados)";

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)]">
        <p className="text-xs font-mono text-[var(--accent-teal)]">Etapa 04 · Respaldo y cargas</p>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
          4. Capacidad económica
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Diferencia las obligaciones del negocio de las cargas personales o familiares según el
          régimen del solicitante ({formalidad}).
        </p>
      </div>

      {/* Nota de cumplimiento ético */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-xs text-[var(--text-secondary)]">
        Regla metodológica activa:{" "}
        <strong className="font-semibold text-[var(--text-primary)]">
          no se solicita ni utiliza sexo ni edad
        </strong>{" "}
        del solicitante para predecir el ciclo económico ni determinar las cuotas del cronograma.
      </div>

      {esJuridicaFormal ? (
        <div className="bg-[var(--accent-teal-soft)] border border-[var(--accent-teal)]/30 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Persona jurídica 100% formal
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Las finanzas corporativas se evalúan de forma independiente; no se incorporan
                cargas familiares ni deudas personales en el flujo del negocio.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={capacidad.usaEstadosFinancierosAuditados}
                onChange={(e) =>
                  onChange({
                    ...capacidad,
                    usaEstadosFinancierosAuditados: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[var(--accent-teal)]"
              />
              Estados financieros auditados
            </label>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="deudas-negocio"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Cuotas mensuales de deudas vigentes del negocio (S/)
          </label>
          <input
            id="deudas-negocio"
            type="number"
            min={0}
            step={50}
            value={capacidad.cuotasDeudasNegocioMensual}
            onChange={(e) =>
              onChange({
                ...capacidad,
                cuotasDeudasNegocioMensual: Math.max(0, Number(e.target.value)),
              })
            }
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="patrimonio-declarado"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Patrimonio neto o respaldo de activos del negocio (S/)
          </label>
          <input
            id="patrimonio-declarado"
            type="number"
            min={0}
            step={500}
            value={capacidad.patrimonioNetoDeclarado}
            onChange={(e) =>
              onChange({
                ...capacidad,
                patrimonioNetoDeclarado: Math.max(0, Number(e.target.value)),
              })
            }
            className={INPUT_CLASS}
          />
        </div>

        {!esJuridicaFormal && (
          <>
            <div>
              <label
                htmlFor="otras-fuentes"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Otras fuentes de ingreso mensual verificables (S/)
              </label>
              <input
                id="otras-fuentes"
                type="number"
                min={0}
                step={50}
                value={capacidad.otrasFuentesIngresoMensual}
                onChange={(e) =>
                  onChange({
                    ...capacidad,
                    otrasFuentesIngresoMensual: Math.max(0, Number(e.target.value)),
                  })
                }
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="deudas-personales"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Cuotas de otras deudas personales vigentes (S/)
              </label>
              <input
                id="deudas-personales"
                type="number"
                min={0}
                step={50}
                value={capacidad.cuotasDeudasPersonalesMensual}
                onChange={(e) =>
                  onChange({
                    ...capacidad,
                    cuotasDeudasPersonalesMensual: Math.max(0, Number(e.target.value)),
                  })
                }
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="carga-familiar"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Carga familiar y gastos esenciales del hogar (S/)
              </label>
              <input
                id="carga-familiar"
                type="number"
                min={0}
                step={50}
                value={capacidad.cargaFamiliarMensual}
                onChange={(e) =>
                  onChange({
                    ...capacidad,
                    cargaFamiliarMensual: Math.max(0, Number(e.target.value)),
                  })
                }
                className={INPUT_CLASS}
              />
            </div>
          </>
        )}

        <div className={esJuridicaFormal ? "md:col-span-2" : ""}>
          <label
            htmlFor="obligaciones-desc"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Detalle de obligaciones financieras vigentes
          </label>
          <input
            id="obligaciones-desc"
            type="text"
            value={capacidad.obligacionesVigentesDescripcion}
            onChange={(e) =>
              onChange({
                ...capacidad,
                obligacionesVigentesDescripcion: e.target.value,
              })
            }
            placeholder="Ej. Crédito capital de trabajo vigente / sin deudas adicionales"
            className="w-full h-11 px-3.5 text-sm bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
