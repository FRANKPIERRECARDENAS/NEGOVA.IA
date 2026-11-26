import { PRODUCTOS_ILUSTRATIVOS } from "../../engines/catalogs";
import { SolicitudCredito, TipoSeguroOpcional } from "../../types/negova";

interface Step5CreditoProps {
  credito: SolicitudCredito;
  onChange: (updated: SolicitudCredito) => void;
  error?: string;
}

const INPUT_CLASS =
  "w-full h-11 px-3.5 text-sm font-mono tabular-nums bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)] transition-colors";

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
      return;
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
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)]">
        <p className="text-xs font-mono text-[var(--accent-teal)]">Etapa 05 · Condiciones del préstamo</p>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
          5. Crédito solicitado
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Define el producto de prueba, monto, plazo, TEA y parámetros configurables de capacidad
          de pago y seguros (base 360).
        </p>
      </div>

      {/* Selector de producto ilustrativo */}
      <div>
        <span className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
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
                className={`text-left p-4 rounded-lg border transition-colors duration-150 ${
                  active
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal-soft)]"
                    : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{prod.nombre}</p>
                  <span className="text-xs font-mono tabular-nums text-[var(--accent-teal)] shrink-0">
                    Factor {prod.factorMaximoCapacidadPago.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{prod.descripcion}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5">{prod.restriccionesTexto}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-2.5">
          Nota: Los factores 0.65 y 0.85 se incluyen únicamente como valores ilustrativos de
          productos de prueba y pueden configurarse libremente (siempre menor que 1). No son
          parámetros universales de Caja Trujillo.
        </p>
      </div>

      {error && (
        <div className="bg-[var(--accent-risk-soft)] border border-[var(--accent-risk)]/35 rounded-lg px-4 py-3 text-xs text-[var(--accent-risk)] font-medium">
          {error}
        </div>
      )}

      {/* Monto, plazo, TEA, frecuencia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6 border-t border-[var(--border-hairline)]">
        <div>
          <label
            htmlFor="monto-solicitado"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="plazo-meses"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="tea-porcentaje"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="frecuencia-dias"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
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
            className="w-full h-11 px-3.5 text-sm bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)] disabled:opacity-50"
          >
            <option value={30}>Mensual (días exactos o 30d)</option>
            <option value={45}>Cada 45 días (irregular)</option>
            <option value={60}>Bimestral (cada 60 días)</option>
          </select>
        </div>
      </div>

      {/* Parámetros configurables del producto y seguros */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg p-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="factor-capacidad"
                className="text-xs font-medium text-[var(--text-secondary)]"
              >
                Factor máximo de capacidad (Cuota / Utilidad ≤ Factor)
              </label>
              <span className="text-sm font-semibold font-mono tabular-nums text-[var(--accent-teal)]">
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
              className="w-full accent-[var(--accent-teal)]"
            />
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] mt-1">
              <span>0.30 (conservador)</span>
              <span>0.95 (máximo &lt; 1.00)</span>
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-center">
            <label className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={credito.permitirPeriodosIrregulares}
                onChange={(e) =>
                  onChange({
                    ...credito,
                    permitirPeriodosIrregulares: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[var(--accent-teal)]"
              />
              Usar días exactos del calendario por periodo (Base 360)
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
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
                className="w-4 h-4 accent-[var(--accent-teal)]"
              />
              El producto permite cuotas variables adaptadas al ciclo
            </label>
          </div>
        </div>

        {/* Seguros */}
        <div className="pt-5 border-t border-[var(--border-hairline)] grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
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
                className="w-4 h-4 accent-[var(--accent-teal)]"
              />
              Seguro de desgravamen (sobre saldo)
            </label>
            {cfg.desgravamenHabilitado && (
              <div>
                <label
                  htmlFor="tasa-desgravamen"
                  className="block text-[11px] text-[var(--text-muted)] mb-1"
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
                  className="w-full h-9 px-3 text-xs font-mono tabular-nums bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-md focus:outline-none focus:border-[var(--accent-teal)]"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="seguro-bien-tipo"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Seguro de bien (Multirriesgo / Vivienda excluyentes)
            </label>
            <select
              id="seguro-bien-tipo"
              value={cfg.seguroBienTipo}
              disabled={cfg.esHipotecario}
              onChange={(e) => updateSeguroBien(e.target.value as TipoSeguroOpcional)}
              className="w-full h-9 px-3 text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-md disabled:opacity-50 focus:outline-none focus:border-[var(--accent-teal)]"
            >
              <option value="Ninguno">Sin seguro de bien</option>
              <option value="Multirriesgo">Seguro Multirriesgo (opcional)</option>
              <option value="Vivienda">
                Seguro de Vivienda {cfg.esHipotecario ? "(obligatorio hipotecario)" : "(opcional)"}
              </option>
            </select>
          </div>

          {cfg.seguroBienTipo !== "Ninguno" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="valor-asegurado"
                  className="block text-[11px] text-[var(--text-muted)] mb-1"
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
                  className="w-full h-9 px-2.5 text-xs font-mono tabular-nums bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-md focus:outline-none focus:border-[var(--accent-teal)]"
                />
              </div>
              <div>
                <label
                  htmlFor="tasa-seguro-bien"
                  className="block text-[11px] text-[var(--text-muted)] mb-1"
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
                  className="w-full h-9 px-2.5 text-xs font-mono tabular-nums bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-md focus:outline-none focus:border-[var(--accent-teal)]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
