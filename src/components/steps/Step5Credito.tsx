import { PRODUCTOS_ILUSTRATIVOS } from "../../engines/catalogs";
import { SolicitudCredito, TipoSeguroOpcional } from "../../types/negova";

interface Step5CreditoProps {
  credito: SolicitudCredito;
  onChange: (updated: SolicitudCredito) => void;
  error?: string;
}

export function Step5Credito({ credito, onChange, error }: Step5CreditoProps) {
  const cfg = credito.productoConfig;

  const selectProduct = (prodId: string) => {
    const found =
      PRODUCTOS_ILUSTRATIVOS.find((p) => p.id === prodId) ?? PRODUCTOS_ILUSTRATIVOS[0];
    onChange({
      ...credito,
      productoId: found.id,
      productoConfig: { ...found },
      plazoMeses: Math.max(
        found.plazoMinimoMeses,
        Math.min(found.plazoMaximoMeses, credito.plazoMeses)
      ),
      tea: Math.min(found.teaMaximaBCRP, Math.max(found.teaMinima, credito.tea)),
    });
  };

  const updateSeguroBien = (tipo: TipoSeguroOpcional) => {
    if (cfg.esHipotecario && tipo !== "Vivienda") {
      return; // Vivienda es obligatorio para hipotecarios
    }
    onChange({
      ...credito,
      productoConfig: {
        ...cfg,
        seguroBienTipo: tipo,
        tasaAnualSeguroBien:
          tipo === "Ninguno"
            ? 0
            : cfg.tasaAnualSeguroBien > 0
            ? cfg.tasaAnualSeguroBien
            : tipo === "Vivienda"
            ? 0.0045
            : 0.012,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">5. Crédito solicitado</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Define el producto de prueba, monto, plazo, TEA y parámetros configurables de capacidad
          de pago y seguros (base 360).
        </p>
      </div>

      {/* Selector de producto ilustrativo */}
      <div>
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Producto financiero (parámetros configurables de demostración)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRODUCTOS_ILUSTRATIVOS.map((prod) => {
            const active = credito.productoId === prod.id;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => selectProduct(prod.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? "border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/50"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">{prod.nombre}</p>
                  <span className="text-xs font-mono tabular-nums text-teal-800 dark:text-teal-300 shrink-0">
                    Factor {prod.factorMaximoCapacidadPago.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{prod.descripcion}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">{prod.restriccionesTexto}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
          Nota: Los factores 0.65 y 0.85 se incluyen únicamente como valores ilustrativos de
          productos de prueba y pueden configurarse libremente (siempre menor que 1). No son
          parámetros universales de Caja Trujillo.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl px-4 py-3 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Monto, plazo, TEA, frecuencia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>
          <label
            htmlFor="monto-solicitado"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Monto solicitado (S/)
          </label>
          <input
            id="monto-solicitado"
            type="number"
            min={500}
            step={500}
            value={credito.montoSolicitado}
            onChange={(e) =>
              onChange({
                ...credito,
                montoSolicitado: Math.max(0, Number(e.target.value)),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>

        <div>
          <label
            htmlFor="plazo-meses"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Plazo ({cfg.plazoMinimoMeses}–{cfg.plazoMaximoMeses} meses)
          </label>
          <input
            id="plazo-meses"
            type="number"
            min={cfg.plazoMinimoMeses}
            max={cfg.plazoMaximoMeses}
            step={1}
            value={credito.plazoMeses}
            onChange={(e) =>
              onChange({
                ...credito,
                plazoMeses: Math.max(1, Math.round(Number(e.target.value))),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>

        <div>
          <label
            htmlFor="tea-porcentaje"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            TEA (%) · Tope BCRP {(cfg.teaMaximaBCRP * 100).toFixed(1)}%
          </label>
          <input
            id="tea-porcentaje"
            type="number"
            min={1}
            max={120}
            step={0.5}
            value={Number((credito.tea * 100).toFixed(2))}
            onChange={(e) =>
              onChange({
                ...credito,
                tea: Math.max(0.01, Number(e.target.value) / 100),
              })
            }
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
        </div>

        <div>
          <label
            htmlFor="frecuencia-dias"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Periodicidad base de cuotas
          </label>
          <select
            id="frecuencia-dias"
            value={credito.frecuenciaPagoDias}
            disabled={!cfg.permitePeriodosVariables}
            onChange={(e) =>
              onChange({
                ...credito,
                frecuenciaPagoDias: Number(e.target.value) as 30 | 45 | 60,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400 disabled:bg-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          >
            <option value={30}>Mensual (días exactos o 30d)</option>
            <option value={45}>Cada 45 días (irregular)</option>
            <option value={60}>Bimestral (cada 60 días)</option>
          </select>
        </div>
      </div>

      {/* Parámetros configurables del producto y seguros */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="factor-capacidad"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Factor máximo de capacidad de pago (Cuota / Utilidad ≤ Factor)
              </label>
              <span className="text-sm font-bold font-mono tabular-nums text-teal-800 dark:text-teal-300">
                {cfg.factorMaximoCapacidadPago.toFixed(2)}
              </span>
            </div>
            <input
              id="factor-capacidad"
              type="range"
              min={0.3}
              max={0.95}
              step={0.05}
              value={cfg.factorMaximoCapacidadPago}
              onChange={(e) =>
                onChange({
                  ...credito,
                  productoConfig: {
                    ...cfg,
                    factorMaximoCapacidadPago: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-teal-700 dark:accent-teal-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>0.30 (conservador)</span>
              <span>0.95 (máximo &lt; 1.00)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={credito.permitirPeriodosIrregulares}
                onChange={(e) =>
                  onChange({
                    ...credito,
                    permitirPeriodosIrregulares: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-teal-700 dark:accent-teal-400"
              />
              Usar días exactos del calendario por periodo (Base 360)
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.permiteCuotasVariables}
                onChange={(e) =>
                  onChange({
                    ...credito,
                    productoConfig: {
                      ...cfg,
                      permiteCuotasVariables: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-teal-700 dark:accent-teal-400"
              />
              El producto permite cuotas variables adaptadas al ciclo
            </label>
          </div>
        </div>

        {/* Seguros */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.desgravamenHabilitado}
                onChange={(e) =>
                  onChange({
                    ...credito,
                    productoConfig: {
                      ...cfg,
                      desgravamenHabilitado: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-teal-700 dark:accent-teal-400"
              />
              Seguro de desgravamen (sobre saldo)
            </label>
            {cfg.desgravamenHabilitado && (
              <div>
                <label
                  htmlFor="tasa-desgravamen"
                  className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
                >
                  Tasa anual simple (%)
                </label>
                <input
                  id="tasa-desgravamen"
                  type="number"
                  min={0}
                  max={10}
                  step={0.05}
                  value={Number((cfg.tasaAnualDesgravamen * 100).toFixed(2))}
                  onChange={(e) =>
                    onChange({
                      ...credito,
                      productoConfig: {
                        ...cfg,
                        tasaAnualDesgravamen: Math.max(0, Number(e.target.value) / 100),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="seguro-bien-tipo"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Seguro de bien (Multirriesgo / Vivienda excluyentes)
            </label>
            <select
              id="seguro-bien-tipo"
              value={cfg.seguroBienTipo}
              disabled={cfg.esHipotecario}
              onChange={(e) => updateSeguroBien(e.target.value as TipoSeguroOpcional)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg disabled:bg-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
            >
              <option value="Ninguno">Sin seguro de bien</option>
              <option value="Multirriesgo">Seguro Multirriesgo (opcional)</option>
              <option value="Vivienda">
                Seguro de Vivienda {cfg.esHipotecario ? "(obligatorio hipotecario)" : "(opcional)"}
              </option>
            </select>
          </div>

          {cfg.seguroBienTipo !== "Ninguno" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="valor-asegurado"
                  className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
                >
                  Valor asegurado (S/)
                </label>
                <input
                  id="valor-asegurado"
                  type="number"
                  min={0}
                  step={1000}
                  value={cfg.valorBienAsegurado}
                  onChange={(e) =>
                    onChange({
                      ...credito,
                      productoConfig: {
                        ...cfg,
                        valorBienAsegurado: Math.max(0, Number(e.target.value)),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="tasa-seguro-bien"
                  className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1"
                >
                  Tasa anual (%)
                </label>
                <input
                  id="tasa-seguro-bien"
                  type="number"
                  min={0}
                  max={10}
                  step={0.05}
                  value={Number((cfg.tasaAnualSeguroBien * 100).toFixed(2))}
                  onChange={(e) =>
                    onChange({
                      ...credito,
                      productoConfig: {
                        ...cfg,
                        tasaAnualSeguroBien: Math.max(0, Number(e.target.value) / 100),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
