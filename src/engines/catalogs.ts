import {
  CondicionFormalidad,
  ProductoFinancieroConfig,
  SectorEconomico,
} from "../types/negova";

export const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export const MESES_LARGOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const SECTORES_ECONOMICOS: SectorEconomico[] = [
  "Agrícola y pecuario",
  "Comercio minorista",
  "Comercio mayorista y distribución",
  "Gastronomía y turismo",
  "Manufactura y textil",
  "Servicios técnicos y transporte",
  "Construcción y ferretería",
];

export const ACTIVIDADES_POR_SECTOR: Record<SectorEconomico, string[]> = {
  "Agrícola y pecuario": [
    "Cultivo de arroz y maíz amarillo",
    "Producción de palta y espárragos",
    "Cultivo de café y cacao",
    "Crianza de ganado vacuno lechero",
    "Cultivo de papa y granos andinos",
  ],
  "Comercio minorista": [
    "Bodega y abarrotes de barrio",
    "Librería y útiles escolares",
    "Tienda de ropa y calzado de temporada",
    "Botica y productos de cuidado personal",
    "Venta de electrodomésticos y telefonía",
  ],
  "Comercio mayorista y distribución": [
    "Distribución de bebidas y abarrotes",
    "Comercialización mayorista de tubérculos y frutas",
    "Acopio y distribución de insumos agrícolas",
    "Distribución de productos de limpieza",
  ],
  "Gastronomía y turismo": [
    "Restaurante turístico y comida regional",
    "Cevichería y marisquería costera",
    "Hospedaje y operador turístico local",
    "Panadería, pastelería y cafetería",
  ],
  "Manufactura y textil": [
    "Confección de uniformes y ropa escolar",
    "Fabricación de calzado artesanal e industrial",
    "Carpintería metálica y estructuras",
    "Taller de muebles de madera",
  ],
  "Servicios técnicos y transporte": [
    "Transporte de carga ligera regional",
    "Taller mecánico automotriz",
    "Servicio de mensajería y reparto urbano",
    "Mantenimiento eléctrico e instalaciones",
  ],
  "Construcción y ferretería": [
    "Ferretería y materiales de construcción",
    "Contratista de acabados y pintura",
    "Venta de agregados y cemento",
  ],
};

export const CONDICIONES_FORMALIDAD: CondicionFormalidad[] = [
  "Persona natural sin RUC / informal",
  "Persona natural con negocio (NRUS / RER)",
  "Persona jurídica parcialmente formal",
  "Persona jurídica 100% formal (EE.FF. auditados)",
];

export interface ZonaCatalogo {
  departamento: string;
  provincias: string[];
  indiceRegional12Meses: number[]; // Factores multiplicativos regionales (promedio ~ 1.0)
  factorRiesgoClimatico: number; // 0..1
  descripcionEconomica: string;
}

export const ZONAS_GEOGRAFICAS: ZonaCatalogo[] = [
  {
    departamento: "La Libertad",
    provincias: ["Trujillo", "Ascope", "Pacasmayo", "Virú", "Sánchez Carrión"],
    indiceRegional12Meses: [1.04, 1.01, 0.96, 0.98, 1.0, 0.99, 1.05, 1.02, 0.97, 1.01, 0.99, 0.98],
    factorRiesgoClimatico: 0.72,
    descripcionEconomica:
      "Corredor agroindustrial costero y comercial del norte; exposición moderada-alta a lluvias de verano.",
  },
  {
    departamento: "Lambayeque",
    provincias: ["Chiclayo", "Lambayeque", "Ferreñafe"],
    indiceRegional12Meses: [1.03, 0.98, 0.94, 0.97, 1.01, 1.03, 1.04, 1.0, 0.98, 1.0, 1.0, 1.02],
    factorRiesgoClimatico: 0.78,
    descripcionEconomica:
      "Nodo comercial norteño y valle arrocero; alta sensibilidad a anomalías hídricas.",
  },
  {
    departamento: "Piura",
    provincias: ["Piura", "Sullana", "Talara", "Paita"],
    indiceRegional12Meses: [1.06, 0.97, 0.91, 0.93, 0.99, 1.02, 1.04, 1.01, 0.99, 1.01, 1.02, 1.05],
    factorRiesgoClimatico: 0.88,
    descripcionEconomica:
      "Economía agroexportadora, pesquera y comercial con elevada exposición al Fenómeno El Niño.",
  },
  {
    departamento: "Cajamarca",
    provincias: ["Cajamarca", "Jaén", "Chota", "Cutervo"],
    indiceRegional12Meses: [0.95, 0.94, 0.97, 1.01, 1.05, 1.06, 1.04, 1.01, 0.97, 0.98, 1.0, 1.02],
    factorRiesgoClimatico: 0.65,
    descripcionEconomica:
      "Dinámica ganadera, cafetalera y de servicios en sierra norte; pico en cosecha seca (mayo-julio).",
  },
  {
    departamento: "Áncash",
    provincias: ["Santa (Chimbote)", "Huaraz", "Casma"],
    indiceRegional12Meses: [1.01, 0.98, 0.96, 0.99, 1.01, 1.02, 1.05, 1.02, 0.98, 0.99, 0.99, 1.0],
    factorRiesgoClimatico: 0.68,
    descripcionEconomica:
      "Actividad pesquera, comercio costero y turismo de cordillera entre mayo y septiembre.",
  },
  {
    departamento: "San Martín",
    provincias: ["San Martín (Tarapoto)", "Moyobamba", "Rioja"],
    indiceRegional12Meses: [0.96, 0.95, 0.98, 1.02, 1.04, 1.05, 1.06, 1.03, 0.98, 0.96, 0.98, 0.99],
    factorRiesgoClimatico: 0.61,
    descripcionEconomica:
      "Producción amazónica de arroz, cacao y café con campañas concentradas entre abril y agosto.",
  },
  {
    departamento: "Lima",
    provincias: ["Lima Metropolitana", "Huaura", "Cañete", "Huaral"],
    indiceRegional12Meses: [0.97, 0.96, 1.03, 0.99, 1.01, 0.98, 1.04, 0.99, 0.98, 1.0, 1.01, 1.04],
    factorRiesgoClimatico: 0.35,
    descripcionEconomica:
      "Mercado urbano diversificado; repuntes por campaña escolar (marzo), Fiestas Patrias y fin de año.",
  },
  {
    departamento: "Arequipa",
    provincias: ["Arequipa", "Caylloma", "Camaná"],
    indiceRegional12Meses: [0.97, 0.96, 1.0, 0.99, 1.01, 1.02, 1.03, 1.06, 1.0, 0.99, 0.98, 0.99],
    factorRiesgoClimatico: 0.42,
    descripcionEconomica:
      "Comercio, servicios e industria del sur; impulso notable en agosto por aniversario y turismo.",
  },
];

// Curvas estacionales base por sector (promedio = 1.0)
export const INDICE_ESTACIONAL_SECTOR: Record<SectorEconomico, number[]> = {
  "Agrícola y pecuario": [0.78, 0.75, 0.82, 0.98, 1.24, 1.32, 1.26, 1.12, 0.96, 0.9, 0.93, 0.94],
  "Comercio minorista": [0.92, 0.95, 1.15, 0.92, 1.04, 0.94, 1.12, 0.96, 0.93, 0.97, 1.02, 1.08],
  "Comercio mayorista y distribución": [0.94, 0.96, 1.08, 0.96, 1.03, 0.98, 1.08, 1.01, 0.96, 0.98, 1.0, 1.02],
  "Gastronomía y turismo": [1.14, 1.12, 0.94, 0.9, 0.92, 0.95, 1.16, 1.08, 0.92, 0.94, 0.95, 0.98],
  "Manufactura y textil": [0.98, 1.18, 1.22, 0.94, 1.02, 0.96, 1.04, 0.92, 0.9, 0.92, 0.96, 0.96],
  "Servicios técnicos y transporte": [0.97, 0.96, 1.0, 0.99, 1.01, 1.01, 1.03, 1.02, 0.99, 1.0, 1.01, 1.01],
  "Construcción y ferretería": [0.9, 0.88, 0.95, 1.01, 1.05, 1.06, 1.08, 1.07, 1.04, 1.02, 0.99, 0.95],
};

// Curvas diferenciadas por actividad económica específica (evita asignar curvas idénticas dentro del mismo sector)
export const INDICE_ESTACIONAL_ACTIVIDAD: Record<string, number[]> = {
  "Librería y útiles escolares": [0.85, 1.26, 1.44, 1.02, 0.92, 0.84, 0.9, 0.92, 0.94, 0.94, 0.97, 1.0],
  "Bodega y abarrotes de barrio": [0.97, 0.96, 1.01, 0.98, 1.01, 0.99, 1.04, 1.0, 0.98, 1.0, 1.01, 1.05],
  "Botica y productos de cuidado personal": [0.99, 0.97, 1.0, 0.99, 1.01, 1.04, 1.05, 1.03, 0.99, 0.98, 0.97, 0.98],
  "Tienda de ropa y calzado de temporada": [0.88, 0.86, 1.05, 0.92, 1.12, 0.94, 1.18, 0.94, 0.88, 0.93, 1.06, 1.24],
  "Venta de electrodomésticos y telefonía": [0.88, 0.87, 0.96, 0.93, 1.12, 0.95, 1.18, 0.96, 0.92, 0.96, 1.05, 1.22],
  "Cultivo de arroz y maíz amarillo": [0.72, 0.68, 0.78, 1.02, 1.32, 1.38, 1.28, 1.08, 0.92, 0.9, 0.95, 0.97],
  "Cultivo de café y cacao": [0.76, 0.74, 0.8, 0.94, 1.14, 1.28, 1.34, 1.26, 1.12, 0.92, 0.86, 0.84],
  "Crianza de ganado vacuno lechero": [0.91, 0.9, 0.94, 1.0, 1.08, 1.12, 1.1, 1.04, 0.99, 0.97, 0.97, 0.98],
  "Producción de palta y espárragos": [0.82, 0.8, 0.88, 1.04, 1.22, 1.26, 1.18, 1.06, 0.98, 0.94, 0.92, 0.9],
  "Cevichería y marisquería costera": [1.26, 1.28, 1.12, 0.94, 0.86, 0.82, 0.98, 0.92, 0.88, 0.92, 0.98, 1.04],
  "Panadería, pastelería y cafetería": [0.95, 0.94, 0.98, 0.98, 1.04, 1.03, 1.06, 1.02, 0.98, 0.99, 1.0, 1.03],
  "Confección de uniformes y ropa escolar": [1.05, 1.34, 1.42, 1.0, 0.92, 0.88, 0.94, 0.88, 0.86, 0.88, 0.91, 0.92],
};

export function getEffectiveSectorActivityCurve(
  sector: SectorEconomico,
  actividadEspecifica: string
): { curve: number[]; usoCurvaActividad: boolean; diferenciaMaxPct: number } {
  const sectorCurve = INDICE_ESTACIONAL_SECTOR[sector];
  const actCurve = INDICE_ESTACIONAL_ACTIVIDAD[actividadEspecifica];
  if (!actCurve) {
    return { curve: sectorCurve, usoCurvaActividad: false, diferenciaMaxPct: 0 };
  }
  let maxDiff = 0;
  const blended = sectorCurve.map((s, idx) => {
    const a = actCurve[idx] ?? s;
    const val = Number((0.25 * s + 0.75 * a).toFixed(4));
    maxDiff = Math.max(maxDiff, Math.abs(val - s) * 100);
    return val;
  });
  return {
    curve: blended,
    usoCurvaActividad: true,
    diferenciaMaxPct: Number(maxDiff.toFixed(1)),
  };
}

// Productos ilustrativos configurables para el prototipo.
// Nota: 0.65 y 0.85 se presentan únicamente como ejemplos ilustrativos configurables en productos de prueba.
export const PRODUCTOS_ILUSTRATIVOS: ProductoFinancieroConfig[] = [
  {
    id: "prod-micro-capital-adaptativo",
    nombre: "Capital de Trabajo Adaptativo (Producto de prueba)",
    descripcion:
      "Financiamiento flexible para inventarios, campañas o insumos con cuotas ajustables al ciclo.",
    esHipotecario: false,
    factorMaximoCapacidadPago: 0.65,
    teaMinima: 0.14,
    teaMaximaBCRP: 0.68,
    plazoMinimoMeses: 6,
    plazoMaximoMeses: 24,
    permiteCuotasVariables: true,
    permitePeriodosVariables: true,
    desgravamenHabilitado: true,
    tasaAnualDesgravamen: 0.0085,
    seguroBienTipo: "Multirriesgo",
    tasaAnualSeguroBien: 0.012,
    valorBienAsegurado: 25000,
    restriccionesTexto:
      "Factor ilustrativo de prueba 0.65 (configurable < 1). Tope BCRP referencial 68.0% TEA.",
  },
  {
    id: "prod-agro-campana",
    nombre: "Crédito Campaña Productiva (Producto de prueba)",
    descripcion:
      "Diseñado para ciclos agrícolas y manufactureros con periodos irregulares y amortización en cosecha.",
    esHipotecario: false,
    factorMaximoCapacidadPago: 0.85,
    teaMinima: 0.12,
    teaMaximaBCRP: 0.68,
    plazoMinimoMeses: 6,
    plazoMaximoMeses: 36,
    permiteCuotasVariables: true,
    permitePeriodosVariables: true,
    desgravamenHabilitado: true,
    tasaAnualDesgravamen: 0.0085,
    seguroBienTipo: "Ninguno",
    tasaAnualSeguroBien: 0,
    valorBienAsegurado: 0,
    restriccionesTexto:
      "Factor ilustrativo de prueba 0.85 (configurable < 1). Permite periodos de 30, 45 o 60 días.",
  },
  {
    id: "prod-activo-fijo",
    nombre: "Activo Fijo y Equipamiento (Producto de prueba)",
    descripcion:
      "Adquisición de maquinaria o ampliación de local con cobertura multirriesgo opcional.",
    esHipotecario: false,
    factorMaximoCapacidadPago: 0.7,
    teaMinima: 0.13,
    teaMaximaBCRP: 0.68,
    plazoMinimoMeses: 12,
    plazoMaximoMeses: 48,
    permiteCuotasVariables: true,
    permitePeriodosVariables: false,
    desgravamenHabilitado: true,
    tasaAnualDesgravamen: 0.0085,
    seguroBienTipo: "Multirriesgo",
    tasaAnualSeguroBien: 0.011,
    valorBienAsegurado: 40000,
    restriccionesTexto:
      "Factor configurable 0.70. Multirriesgo y Vivienda son excluyentes.",
  },
  {
    id: "prod-hipotecario-negocio",
    nombre: "Hipotecario Local Comercial (Producto de prueba)",
    descripcion:
      "Financiamiento respaldado en inmueble comercial. Seguro de vivienda obligatorio.",
    esHipotecario: true,
    factorMaximoCapacidadPago: 0.6,
    teaMinima: 0.1,
    teaMaximaBCRP: 0.45,
    plazoMinimoMeses: 12,
    plazoMaximoMeses: 60,
    permiteCuotasVariables: true,
    permitePeriodosVariables: false,
    desgravamenHabilitado: true,
    tasaAnualDesgravamen: 0.0075,
    seguroBienTipo: "Vivienda",
    tasaAnualSeguroBien: 0.0045,
    valorBienAsegurado: 120000,
    restriccionesTexto:
      "Producto hipotecario: seguro de vivienda obligatorio. Factor configurable 0.60.",
  },
];
