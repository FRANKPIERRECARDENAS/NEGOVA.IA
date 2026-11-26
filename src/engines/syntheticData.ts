import {
  AnalisisInput,
  CondicionFormalidad,
  PerfilSintetico,
  SectorEconomico,
  SegmentoSintetico,
  TipoOperacion,
} from "../types/negova";
import {
  ACTIVIDADES_POR_SECTOR,
  INDICE_ESTACIONAL_SECTOR,
  MESES_CORTOS,
  PRODUCTOS_ILUSTRATIVOS,
  ZONAS_GEOGRAFICAS,
} from "./catalogs";

// Generador pseudoaleatorio determinístico Mulberry32 con semilla fija
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

const SEGMENT_QUOTAS: Array<{ segmento: SegmentoSintetico; cantidad: number }> = [
  { segmento: "Agrícola y productivo", cantidad: 240 },
  { segmento: "Comercio estacional", cantidad: 260 },
  { segmento: "Comercio y servicios estables", cantidad: 220 },
  { segmento: "Negocios sensibles al clima", cantidad: 160 },
  { segmento: "Negocios variables o mixtos", cantidad: 120 },
];

const NOMBRES_COMERCIALES_BASE: Record<SegmentoSintetico, string[]> = {
  "Agrícola y productivo": [
    "Agroproductores Valle Norte",
    "Fundo San Isidro",
    "Cooperativa Cosecha Dorada",
    "Taller Textil Andino",
    "Granja Los Alisos",
    "Calzado El Artesano",
  ],
  "Comercio estacional": [
    "Librería y Bazar El Saber",
    "Modas Temporada Trujillo",
    "Distribuidora Campaña Escolar",
    "Comercial Fiestas del Norte",
    "Bazar Mercantil Central",
  ],
  "Comercio y servicios estables": [
    "Bodega Don Mateo",
    "Minimarket La Esquina",
    "Botica Salud Integral",
    "Taller Mecánico El Eje",
    "Distribuidora Abarrotes del Sur",
  ],
  "Negocios sensibles al clima": [
    "Cevichería Brisa Marina",
    "Parador Turístico Mirador",
    "Ferretería Obra Segura",
    "Cultivos Costeros del Valle",
    "Transporte Carga Norteña",
  ],
  "Negocios variables o mixtos": [
    "Multiservicios y Bodega El Sol",
    "Acopio y Transporte Mixto",
    "Panadería y Catering Express",
    "Contratista y Ferretería Unión",
    "Comercio y Servicios Integrados",
  ],
};

function getSectorAndOpForSegment(
  rng: () => number,
  segmento: SegmentoSintetico
): { sector: SectorEconomico; tipoOperacion: TipoOperacion } {
  switch (segmento) {
    case "Agrícola y productivo": {
      const sector = rng() < 0.7 ? "Agrícola y pecuario" : "Manufactura y textil";
      return { sector, tipoOperacion: "Productiva" };
    }
    case "Comercio estacional": {
      const sector = rng() < 0.72 ? "Comercio minorista" : "Manufactura y textil";
      return {
        sector,
        tipoOperacion: sector === "Manufactura y textil" ? "Productiva" : "Comercial",
      };
    }
    case "Comercio y servicios estables": {
      const r = rng();
      if (r < 0.48) return { sector: "Comercio minorista", tipoOperacion: "Comercial" };
      if (r < 0.78) return { sector: "Comercio mayorista y distribución", tipoOperacion: "Comercial" };
      return { sector: "Servicios técnicos y transporte", tipoOperacion: "Servicios" };
    }
    case "Negocios sensibles al clima": {
      const r = rng();
      if (r < 0.4) return { sector: "Gastronomía y turismo", tipoOperacion: "Servicios" };
      if (r < 0.72) return { sector: "Agrícola y pecuario", tipoOperacion: "Productiva" };
      return { sector: "Construcción y ferretería", tipoOperacion: "Comercial" };
    }
    case "Negocios variables o mixtos": {
      const r = rng();
      if (r < 0.35) return { sector: "Servicios técnicos y transporte", tipoOperacion: "Servicios" };
      if (r < 0.7) return { sector: "Construcción y ferretería", tipoOperacion: "Comercial" };
      return { sector: "Gastronomía y turismo", tipoOperacion: "Servicios" };
    }
  }
}

function getFormalidad(rng: () => number, escalaBase: number): CondicionFormalidad {
  if (escalaBase > 35000 && rng() < 0.38) {
    return "Persona jurídica 100% formal (EE.FF. auditados)";
  }
  if (escalaBase > 18000 && rng() < 0.55) {
    return "Persona jurídica parcialmente formal";
  }
  return rng() < 0.7 ? "Persona natural con negocio (NRUS / RER)" : "Persona natural sin RUC / informal";
}

function buildSyntheticProfiles(seed = 20260501): PerfilSintetico[] {
  const rng = createRng(seed);
  const profiles: PerfilSintetico[] = [];
  let globalIndex = 1;

  for (const quota of SEGMENT_QUOTAS) {
    for (let i = 0; i < quota.cantidad; i++) {
      const { sector, tipoOperacion } = getSectorAndOpForSegment(rng, quota.segmento);
      const actividad = pick(rng, ACTIVIDADES_POR_SECTOR[sector]);
      const zona = pick(rng, ZONAS_GEOGRAFICAS);
      const provincia = pick(rng, zona.provincias);
      const nombreBase = pick(rng, NOMBRES_COMERCIALES_BASE[quota.segmento]);
      const id = `SYN-${String(globalIndex).padStart(4, "0")}`;

      const baseMensual =
        quota.segmento === "Agrícola y productivo"
          ? randRange(rng, 11000, 38000)
          : quota.segmento === "Comercio estacional"
          ? randRange(rng, 14000, 44000)
          : quota.segmento === "Comercio y servicios estables"
          ? randRange(rng, 12000, 32000)
          : quota.segmento === "Negocios sensibles al clima"
          ? randRange(rng, 13000, 36000)
          : randRange(rng, 10000, 29000);

      const formalidad = getFormalidad(rng, baseMensual);
      const sectorCurve = INDICE_ESTACIONAL_SECTOR[sector];
      const zonaCurve = zona.indiceRegional12Meses;

      // Amplitud individual del ciclo (dos negocios iguales pueden tener distinta estacionalidad)
      const amplitudIndividual =
        quota.segmento === "Comercio y servicios estables"
          ? randRange(rng, 0.35, 0.65)
          : quota.segmento === "Agrícola y productivo"
          ? randRange(rng, 1.0, 1.45)
          : quota.segmento === "Comercio estacional"
          ? randRange(rng, 0.95, 1.35)
          : randRange(rng, 0.8, 1.25);

      const faseShift = Math.floor(rng() * 3) - 1; // -1, 0, +1 mes de desfase individual
      const trendMensual = randRange(rng, -0.003, 0.008);
      const ruidoAmplitud =
        quota.segmento === "Comercio y servicios estables"
          ? 0.04
          : quota.segmento === "Negocios variables o mixtos"
          ? 0.14
          : 0.08;

      // Algunas observaciones pueden faltar en casos específicos (realismo de datos parciales)
      const tieneHistorialParcial = i % 17 === 0 && i > 0;
      const mesesFaltantes = tieneHistorialParcial ? Math.floor(randRange(rng, 2, 5)) : 0;

      const ventasHistoricas: number[] = [];
      const ventasFuturasReales: number[] = [];

      for (let m = 0; m < 24; m++) {
        const calIdx = (m + faseShift + 12) % 12;
        const sectorVal = 1 + (sectorCurve[calIdx] - 1) * amplitudIndividual;
        const zonaVal = zonaCurve[calIdx];
        const trendFactor = Math.pow(1 + trendMensual, m - 11);
        const shock = 1 + (rng() * 2 - 1) * ruidoAmplitud;
        const val = Math.max(1800, Math.round(baseMensual * sectorVal * zonaVal * trendFactor * shock));
        if (m < 12) {
          ventasHistoricas.push(val);
        } else {
          ventasFuturasReales.push(val);
        }
      }

      const costoPct =
        sector === "Agrícola y pecuario"
          ? randRange(rng, 0.44, 0.56)
          : sector === "Comercio minorista" || sector === "Comercio mayorista y distribución"
          ? randRange(rng, 0.58, 0.68)
          : sector === "Servicios técnicos y transporte"
          ? randRange(rng, 0.28, 0.4)
          : randRange(rng, 0.45, 0.58);

      const gastosOp = Math.round(baseMensual * randRange(rng, 0.12, 0.19));
      const tasaTrib =
        formalidad === "Persona natural sin RUC / informal"
          ? 0
          : formalidad === "Persona natural con negocio (NRUS / RER)"
          ? 0.015
          : 0.032;

      const esJuridicaFormal =
        formalidad === "Persona jurídica 100% formal (EE.FF. auditados)";

      const otrasFuentes = esJuridicaFormal ? 0 : Math.round(randRange(rng, 0, 1400));
      const deudasNeg = Math.round(randRange(rng, 0, baseMensual * 0.08));
      const deudasPers = esJuridicaFormal ? 0 : Math.round(randRange(rng, 0, 650));
      const cargaFam = esJuridicaFormal ? 0 : Math.round(randRange(rng, 550, 1600));

      const prod =
        quota.segmento === "Agrícola y productivo"
          ? PRODUCTOS_ILUSTRATIVOS[1]
          : quota.segmento === "Negocios sensibles al clima"
          ? PRODUCTOS_ILUSTRATIVOS[0]
          : PRODUCTOS_ILUSTRATIVOS[i % 3];

      const utilidadRef = baseMensual * (1 - costoPct - tasaTrib) - gastosOp - deudasNeg - (esJuridicaFormal ? 0 : deudasPers + cargaFam) + otrasFuentes;
      const capacidadRef = Math.max(1500, utilidadRef * prod.factorMaximoCapacidadPago);
      const plazoMeses = pick(rng, [12, 12, 18, 24] as const);
      const montoSolicitado = Math.max(
        5000,
        Math.round((capacidadRef * plazoMeses * 0.62) / 500) * 500
      );
      const tea = Number(randRange(rng, 0.19, 0.34).toFixed(3));

      const estacionalidadNivel =
        quota.segmento === "Comercio y servicios estables"
          ? "Baja"
          : quota.segmento === "Agrícola y productivo"
          ? "Muy alta"
          : "Alta";

      const volatilidadNivel =
        quota.segmento === "Comercio y servicios estables"
          ? "Baja"
          : quota.segmento === "Negocios variables o mixtos"
          ? "Alta"
          : "Media";

      const exposicionExterna =
        zona.factorRiesgoClimatico > 0.7
          ? "Alta exposición a lluvias costeras / El Niño"
          : quota.segmento === "Agrícola y productivo"
          ? "Sensibilidad a sequías y retrasos de campaña"
          : "Sensibilidad moderada a costos de insumos y demanda";

      const input: AnalisisInput = {
        idCaso: id,
        esSintetico: true,
        origenPerfilId: id,
        negocio: {
          nombreComercial: `${nombreBase} (${id})`,
          sector,
          actividadEspecifica: actividad,
          modeloNegocio:
            tipoOperacion === "Productiva"
              ? "Producción por campaña con venta directa y acopio"
              : tipoOperacion === "Comercial"
              ? "Compra-venta con rotación de inventario local"
              : "Prestación de servicios continuos y por encargo",
          departamento: zona.departamento,
          provincia,
          distritoZona: `Zona Urbana / Periurbana ${provincia}`,
          tipoOperacion,
          formalidad,
        },
        ventas: ventasHistoricas.map((monto, idx) => ({
          mesIndice: idx,
          etiquetaMes: MESES_CORTOS[idx],
          monto: idx < mesesFaltantes ? null : monto,
        })),
        costos: {
          tipoEstructura: "Proporcional al ciclo",
          costoAdquisicionProduccionPct: Number((costoPct * 100).toFixed(1)),
          costoAdquisicionMensualFijo: Math.round(baseMensual * costoPct),
          gastosOperativosMensuales: gastosOp,
          gastosTributariosMensuales: Math.round(baseMensual * tasaTrib),
          tasaTributariaPct: Number((tasaTrib * 100).toFixed(1)),
          costosEstacionalesPorMes: sectorCurve.map((v) => Number((0.88 + v * 0.12).toFixed(2))),
        },
        capacidad: {
          otrasFuentesIngresoMensual: otrasFuentes,
          cuotasDeudasNegocioMensual: deudasNeg,
          cuotasDeudasPersonalesMensual: deudasPers,
          cargaFamiliarMensual: cargaFam,
          obligacionesVigentesDescripcion:
            deudasNeg + deudasPers > 0
              ? "Crédito vigente de proveedor / entidad microfinanciera"
              : "Sin cuotas vigentes reportadas",
          usaEstadosFinancierosAuditados: esJuridicaFormal,
          patrimonioNetoDeclarado: Math.round(baseMensual * randRange(rng, 2.5, 6.0)),
        },
        credito: {
          productoId: prod.id,
          productoConfig: { ...prod },
          montoSolicitado,
          plazoMeses,
          tea,
          frecuenciaPagoDias: 30,
          permitirPeriodosIrregulares: prod.permitePeriodosVariables,
          fechaDesembolso: "2026-12-01",
        },
      };

      profiles.push({
        id,
        etiquetaSintetica: "PERFIL SINTÉTICO REPRODUCIBLE",
        segmento: quota.segmento,
        tituloCaso: `${actividad} — ${provincia}`,
        resumenBreve: `${quota.segmento} · Ventas prom. S/ ${Math.round(baseMensual).toLocaleString("es-PE")}/mes`,
        estacionalidadNivel,
        volatilidadNivel,
        exposicionExterna,
        input,
        ventasFuturasRealesSinteticas: ventasFuturasReales,
      });

      globalIndex++;
    }
  }

  return profiles;
}

let cachedProfiles: PerfilSintetico[] | null = null;

export function getSyntheticProfiles(): PerfilSintetico[] {
  if (!cachedProfiles) {
    cachedProfiles = buildSyntheticProfiles(20260501);
  }
  return cachedProfiles;
}

export function getFeaturedDemoProfiles(): PerfilSintetico[] {
  const all = getSyntheticProfiles();
  // Selecciona 6 casos representativos de los 5 segmentos para acceso rápido
  const picks: PerfilSintetico[] = [];
  const wantedSegments: SegmentoSintetico[] = [
    "Agrícola y productivo",
    "Comercio estacional",
    "Comercio y servicios estables",
    "Negocios sensibles al clima",
    "Negocios variables o mixtos",
  ];
  for (const seg of wantedSegments) {
    const found = all.find((p) => p.segmento === seg && p.ventasFuturasRealesSinteticas.length === 12);
    if (found) picks.push(found);
  }
  // Un caso adicional con historial parcial para demostrar manejo de confianza reducida
  const partialCase = all.find((p) => p.input.ventas.some((v) => v.monto === null));
  if (partialCase) picks.push(partialCase);
  return picks;
}
