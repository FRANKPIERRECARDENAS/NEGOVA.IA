import {
  ACTIVIDADES_POR_SECTOR,
  CONDICIONES_FORMALIDAD,
  SECTORES_ECONOMICOS,
  ZONAS_GEOGRAFICAS,
} from "../../engines/catalogs";
import { DatosNegocio, SectorEconomico, TipoOperacion } from "../../types/negova";

interface Step1NegocioProps {
  negocio: DatosNegocio;
  onChange: (updated: DatosNegocio) => void;
  errors: Record<string, string>;
}

const TIPOS_OPERACION: Array<{
  tipo: TipoOperacion;
  detalle: string;
}> = [
  { tipo: "Comercial", detalle: "Compra y venta de mercadería con rotación de inventario" },
  { tipo: "Productiva", detalle: "Cultivo, transformación, confección o manufactura" },
  { tipo: "Servicios", detalle: "Prestación técnica, transporte, gastronomía u oficios" },
];

const INPUT_CLASS =
  "w-full h-11 px-3.5 text-sm bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-hairline)] rounded-lg focus:outline-none focus:border-[var(--accent-teal)] transition-colors";

export function Step1Negocio({ negocio, onChange, errors }: Step1NegocioProps) {
  const zonaActual =
    ZONAS_GEOGRAFICAS.find((z) => z.departamento === negocio.departamento) ??
    ZONAS_GEOGRAFICAS[0];
  const actividadesDisponibles = ACTIVIDADES_POR_SECTOR[negocio.sector] ?? [];

  const handleSectorChange = (sector: SectorEconomico) => {
    const nuevasActividades = ACTIVIDADES_POR_SECTOR[sector] ?? [];
    onChange({
      ...negocio,
      sector,
      actividadEspecifica: nuevasActividades[0] ?? negocio.actividadEspecifica,
    });
  };

  const handleDepartamentoChange = (departamento: string) => {
    const z = ZONAS_GEOGRAFICAS.find((item) => item.departamento === departamento);
    onChange({
      ...negocio,
      departamento,
      provincia: z?.provincias[0] ?? "",
    });
  };

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-[var(--border-hairline)]">
        <p className="text-xs font-mono text-[var(--accent-teal)]">Etapa 01 · Identificación</p>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-1">
          1. Datos del negocio
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
          Identifica la actividad económica, ubicación geográfica y condición de formalidad para
          calibrar la estacionalidad sectorial y regional.
        </p>
      </div>

      {/* Nombre comercial y modelo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="nombre-comercial"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Nombre comercial o referencia del negocio
          </label>
          <input
            id="nombre-comercial"
            type="text"
            value={negocio.nombreComercial}
            onChange={(e) => onChange({ ...negocio, nombreComercial: e.target.value })}
            placeholder="Ej. Bodega y Abarrotes San Martín"
            className={INPUT_CLASS}
          />
          {errors.nombreComercial && (
            <p className="text-xs text-[var(--accent-risk)] mt-1.5">{errors.nombreComercial}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="modelo-negocio"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Modelo de negocio
          </label>
          <input
            id="modelo-negocio"
            type="text"
            value={negocio.modeloNegocio}
            onChange={(e) => onChange({ ...negocio, modeloNegocio: e.target.value })}
            placeholder="Ej. Venta minorista directa y pedidos por campaña"
            className={INPUT_CLASS}
          />
          {errors.modeloNegocio && (
            <p className="text-xs text-[var(--accent-risk)] mt-1.5">{errors.modeloNegocio}</p>
          )}
        </div>
      </div>

      {/* Sector y actividad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="sector-economico"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Sector económico
          </label>
          <select
            id="sector-economico"
            value={negocio.sector}
            onChange={(e) => handleSectorChange(e.target.value as SectorEconomico)}
            className={INPUT_CLASS}
          >
            {SECTORES_ECONOMICOS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="actividad-especifica"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Actividad económica específica
          </label>
          <select
            id="actividad-especifica"
            value={
              actividadesDisponibles.includes(negocio.actividadEspecifica)
                ? negocio.actividadEspecifica
                : "__custom__"
            }
            onChange={(e) => {
              if (e.target.value !== "__custom__") {
                onChange({ ...negocio, actividadEspecifica: e.target.value });
              }
            }}
            className={INPUT_CLASS}
          >
            {actividadesDisponibles.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
            <option value="__custom__">Otra actividad personalizada</option>
          </select>
          {!actividadesDisponibles.includes(negocio.actividadEspecifica) && (
            <input
              type="text"
              value={negocio.actividadEspecifica}
              onChange={(e) => onChange({ ...negocio, actividadEspecifica: e.target.value })}
              placeholder="Especifica la actividad económica"
              aria-label="Actividad económica personalizada"
              className={`${INPUT_CLASS} mt-2`}
            />
          )}
          {errors.actividadEspecifica && (
            <p className="text-xs text-[var(--accent-risk)] mt-1.5">{errors.actividadEspecifica}</p>
          )}
        </div>
      </div>

      {/* Tipo de operación */}
      <div className="pt-6 border-t border-[var(--border-hairline)]">
        <span className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
          Tipo de operación
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIPOS_OPERACION.map((item) => {
            const active = negocio.tipoOperacion === item.tipo;
            return (
              <button
                key={item.tipo}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...negocio, tipoOperacion: item.tipo })}
                className={`text-left p-4 rounded-lg border transition-colors duration-150 ${
                  active
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal-soft)] text-[var(--text-primary)]"
                    : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{item.tipo}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">{item.detalle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ubicación geográfica */}
      <div className="pt-6 border-t border-[var(--border-hairline)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="departamento"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Departamento
            </label>
            <select
              id="departamento"
              value={negocio.departamento}
              onChange={(e) => handleDepartamentoChange(e.target.value)}
              className={INPUT_CLASS}
            >
              {ZONAS_GEOGRAFICAS.map((z) => (
                <option key={z.departamento} value={z.departamento}>
                  {z.departamento}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="provincia"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Provincia
            </label>
            <select
              id="provincia"
              value={negocio.provincia}
              onChange={(e) => onChange({ ...negocio, provincia: e.target.value })}
              className={INPUT_CLASS}
            >
              {zonaActual.provincias.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="distrito-zona"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Distrito o zona geográfica
            </label>
            <input
              id="distrito-zona"
              type="text"
              value={negocio.distritoZona}
              onChange={(e) => onChange({ ...negocio, distritoZona: e.target.value })}
              placeholder="Ej. Víctor Larco / Zona comercial"
              className={INPUT_CLASS}
            />
            {errors.distritoZona && (
              <p className="text-xs text-[var(--accent-risk)] mt-1.5">{errors.distritoZona}</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-xs text-[var(--text-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong className="font-semibold text-[var(--text-primary)]">
              Factor geográfico ({zonaActual.departamento}):
            </strong>{" "}
            {zonaActual.descripcionEconomica}
          </span>
          <span className="font-mono tabular-nums text-[var(--accent-teal)] shrink-0">
            Exposición climática: {Math.round(zonaActual.factorRiesgoClimatico * 100)}%
          </span>
        </div>
      </div>

      {/* Condición de formalidad */}
      <div className="pt-6 border-t border-[var(--border-hairline)]">
        <span className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
          Condición de formalidad
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONDICIONES_FORMALIDAD.map((cond) => {
            const active = negocio.formalidad === cond;
            return (
              <button
                key={cond}
                type="button"
                onClick={() => onChange({ ...negocio, formalidad: cond })}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors duration-150 ${
                  active
                    ? "border-[var(--accent-teal)] bg-[var(--accent-teal-soft)] font-semibold text-[var(--text-primary)]"
                    : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]"
                }`}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
