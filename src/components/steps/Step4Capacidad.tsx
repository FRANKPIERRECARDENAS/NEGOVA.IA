import { CapacidadEconomica, CondicionFormalidad } from "../../types/negova";

interface Step4CapacidadProps {
  capacidad: CapacidadEconomica;
  formalidad: CondicionFormalidad;
  onChange: (updated: CapacidadEconomica) => void;
}

export function Step4Capacidad({
  capacidad,
  formalidad,
  onChange,
}: Step4CapacidadProps) {
  const esJuridicaFormal =
    formalidad === "Persona jurídica 100% formal (EE.FF. auditados)";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">4. Capacidad económica</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Diferencia las obligaciones del negocio de las cargas personales o familiares según el
          régimen del solicitante ({formalidad}).
        </p>
      </div>

      {/* Nota explícita de cumplimiento ético y regulatorio */}
      <div className="bg-slate-100 dark:bg-slate-800/70 rounded-xl px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
        Regla metodológica activa: <strong className="font-semibold text-[#0B1F3A] dark:text-white">no se solicita ni utiliza sexo ni edad</strong>{" "}
        del solicitante para predecir el ciclo económico ni determinar las cuotas del cronograma.
      </div>

      {esJuridicaFormal ? (
        <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                Persona jurídica 100% formal
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Las finanzas corporativas se evalúan de forma independiente; no se incorporan
                cargas familiares ni deudas personales en el flujo del negocio.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={capacidad.usaEstadosFinancierosAuditados}
                onChange={(e) =>
                  onChange({
                    ...capacidad,
                    usaEstadosFinancierosAuditados: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-teal-700 dark:accent-teal-400"
              />
              Estados financieros auditados
            </label>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="deudas-negocio"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>

        <div>
          <label
            htmlFor="patrimonio-declarado"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>

        {!esJuridicaFormal && (
          <>
            <div>
              <label
                htmlFor="otras-fuentes"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
            </div>

            <div>
              <label
                htmlFor="deudas-personales"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
            </div>

            <div>
              <label
                htmlFor="carga-familiar"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
              />
            </div>
          </>
        )}

        <div className={esJuridicaFormal ? "md:col-span-2" : ""}>
          <label
            htmlFor="obligaciones-desc"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>
      </div>
    </div>
  );
}
