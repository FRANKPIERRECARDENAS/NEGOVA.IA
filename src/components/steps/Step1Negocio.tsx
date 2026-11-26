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
      <div>
        <h2 className="text-xl font-bold text-[#0B1F3A] dark:text-white">1. Datos del negocio</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Identifica la actividad económica, ubicación geográfica y condición de formalidad para
          ajustar la estacionalidad sectorial y regional.
        </p>
      </div>

      {/* Nombre comercial y modelo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="nombre-comercial"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Nombre comercial o referencia del negocio
          </label>
          <input
            id="nombre-comercial"
            type="text"
            value={negocio.nombreComercial}
            onChange={(e) => onChange({ ...negocio, nombreComercial: e.target.value })}
            placeholder="Ej. Bodega y Abarrotes San Martín"
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
          {errors.nombreComercial && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.nombreComercial}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="modelo-negocio"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Modelo de negocio
          </label>
          <input
            id="modelo-negocio"
            type="text"
            value={negocio.modeloNegocio}
            onChange={(e) => onChange({ ...negocio, modeloNegocio: e.target.value })}
            placeholder="Ej. Venta minorista directa y pedidos por campaña"
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
          />
          {errors.modeloNegocio && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.modeloNegocio}</p>
          )}
        </div>
      </div>

      {/* Sector y actividad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="sector-economico"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Sector económico
          </label>
          <select
            id="sector-economico"
            value={negocio.sector}
            onChange={(e) => handleSectorChange(e.target.value as SectorEconomico)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
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
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
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
              className="w-full mt-2 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
            />
          )}
          {errors.actividadEspecifica && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.actividadEspecifica}</p>
          )}
        </div>
      </div>

      {/* Tipo de operación */}
      <div>
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  active
                    ? "border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/50 text-[#0B1F3A] dark:text-white"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200"
                }`}
              >
                <p className="text-sm font-semibold">{item.tipo}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.detalle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ubicación geográfica */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="departamento"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Departamento
            </label>
            <select
              id="departamento"
              value={negocio.departamento}
              onChange={(e) => handleDepartamentoChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
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
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Provincia
            </label>
            <select
              id="provincia"
              value={negocio.provincia}
              onChange={(e) => onChange({ ...negocio, provincia: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
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
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Distrito o zona geográfica
            </label>
            <input
              id="distrito-zona"
              type="text"
              value={negocio.distritoZona}
              onChange={(e) => onChange({ ...negocio, distritoZona: e.target.value })}
              placeholder="Ej. Víctor Larco / Zona comercial"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-teal-600 dark:focus:border-teal-400"
            />
            {errors.distritoZona && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.distritoZona}</p>
            )}
          </div>
        </div>

        <div className="bg-slate-100/80 dark:bg-slate-800/70 rounded-xl px-4 py-3 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong className="font-semibold text-[#0B1F3A] dark:text-white">Factor geográfico ({zonaActual.departamento}):</strong>{" "}
            {zonaActual.descripcionEconomica}
          </span>
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
            Exposición climática: {Math.round(zonaActual.factorRiesgoClimatico * 100)}%
          </span>
        </div>
      </div>

      {/* Condición de formalidad */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  active
                    ? "border-teal-700 dark:border-teal-500 bg-teal-50/60 dark:bg-teal-950/50 font-semibold text-[#0B1F3A] dark:text-white"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200"
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
