export type SectorEconomico =
  | "Agrícola y pecuario"
  | "Comercio minorista"
  | "Comercio mayorista y distribución"
  | "Gastronomía y turismo"
  | "Manufactura y textil"
  | "Servicios técnicos y transporte"
  | "Construcción y ferretería";

export type TipoOperacion = "Comercial" | "Productiva" | "Servicios";

export type CondicionFormalidad =
  | "Persona natural sin RUC / informal"
  | "Persona natural con negocio (NRUS / RER)"
  | "Persona jurídica parcialmente formal"
  | "Persona jurídica 100% formal (EE.FF. auditados)";

export type SegmentoSintetico =
  | "Agrícola y productivo"
  | "Comercio estacional"
  | "Comercio y servicios estables"
  | "Negocios sensibles al clima"
  | "Negocios variables o mixtos";

export type TipoEstructuraCostos = "Fija mensual" | "Proporcional al ciclo";

export interface DatosNegocio {
  nombreComercial: string;
  sector: SectorEconomico;
  actividadEspecifica: string;
  modeloNegocio: string;
  departamento: string;
  provincia: string;
  distritoZona: string;
  tipoOperacion: TipoOperacion;
  formalidad: CondicionFormalidad;
}

export interface MesVenta {
  mesIndice: number; // 0 = Ene .. 11 = Dic
  etiquetaMes: string;
  monto: number | null; // null cuando no está disponible
}

export interface EstructuraCostos {
  tipoEstructura: TipoEstructuraCostos;
  costoAdquisicionProduccionPct: number; // % sobre ventas cuando es proporcional, o base
  costoAdquisicionMensualFijo: number; // S/ cuando se registra monto mensual
  gastosOperativosMensuales: number; // S/
  gastosTributariosMensuales: number; // S/ o % efectivo
  tasaTributariaPct: number; // % sobre ventas/utilidad según régimen
  costosEstacionalesPorMes: number[]; // factor multiplicativo o override de 12 meses
}

export interface CapacidadEconomica {
  otrasFuentesIngresoMensual: number;
  cuotasDeudasNegocioMensual: number;
  cuotasDeudasPersonalesMensual: number;
  cargaFamiliarMensual: number;
  obligacionesVigentesDescripcion: string;
  usaEstadosFinancierosAuditados: boolean;
  patrimonioNetoDeclarado: number;
}

export type TipoSeguroOpcional = "Ninguno" | "Multirriesgo" | "Vivienda";

export interface ProductoFinancieroConfig {
  id: string;
  nombre: string;
  descripcion: string;
  esHipotecario: boolean;
  factorMaximoCapacidadPago: number; // estrictamente < 1
  teaMinima: number;
  teaMaximaBCRP: number;
  plazoMinimoMeses: number;
  plazoMaximoMeses: number;
  permiteCuotasVariables: boolean;
  permitePeriodosVariables: boolean;
  desgravamenHabilitado: boolean;
  tasaAnualDesgravamen: number; // Base 360 interés simple sobre saldo
  seguroBienTipo: TipoSeguroOpcional;
  tasaAnualSeguroBien: number; // Base 360 interés simple sobre valor asegurado
  valorBienAsegurado: number;
  restriccionesTexto: string;
}

export interface SolicitudCredito {
  productoId: string;
  productoConfig: ProductoFinancieroConfig;
  montoSolicitado: number;
  plazoMeses: number;
  tea: number; // decimal ej: 0.24 = 24%
  frecuenciaPagoDias: 30 | 45 | 60;
  permitirPeriodosIrregulares: boolean;
  fechaDesembolso: string; // YYYY-MM-DD
}

export interface AnalisisInput {
  idCaso: string;
  esSintetico: boolean;
  origenPerfilId?: string;
  negocio: DatosNegocio;
  ventas: MesVenta[]; // 12 meses históricos más recientes
  costos: EstructuraCostos;
  capacidad: CapacidadEconomica;
  credito: SolicitudCredito;
}

export interface ProyeccionPeriodo {
  periodo: number;
  mesCalendarioIndice: number; // 0..11
  etiquetaPeriodo: string;
  fechaVencimiento: string;
  diasPeriodo: number;
  ventasEsperadas: number;
  ventasRangoInferior: number;
  ventasRangoSuperior: number;
  costosEsperados: number;
  gastosOperativosYTributarios: number;
  utilidadNetaOperativa: number;
  otrosIngresosNetos: number;
  obligacionesYCarga: number;
  utilidadNetaDisponible: number;
  indiceEstacional: number;
  clasificacionCapacidad: "Alta" | "Media" | "Baja";
}

export interface ResultadoPredictivo {
  proyecciones: ProyeccionPeriodo[];
  tendencia: "Creciente" | "Estable" | "Decreciente";
  pendienteMensualPct: number;
  volatilidadPct: number;
  nivelConfianza: number; // 0..100
  mesesDisponiblesCount: number;
  usoReferenciaSintetica: boolean;
  mesesMayorCapacidad: string[];
  mesesMenorCapacidad: string[];
  utilidadNetaPromedio: number;
  ventasTotalesProyectadas: number;
  factoresExplicativos: string[];
  advertenciasDatos: string[];
}

export type EstadoCumplimiento = "Cumple" | "Riesgo" | "Incumple";

export interface CuotaCronograma {
  numeroCuota: number;
  etiquetaPeriodo: string;
  fechaVencimiento: string;
  diasPeriodo: number;
  saldoInicial: number;
  tasaEfectivaPeriodo: number;
  amortizacionCapital: number;
  interesPeriodo: number;
  seguroDesgravamen: number;
  seguroBien: number;
  segurosTotales: number;
  cuotaTotal: number;
  saldoFinal: number;
  utilidadNetaPeriodo: number;
  capacidadMaximaPermitida: number;
  ratioCuotaUtilidad: number | null;
  estado: EstadoCumplimiento;
  seguroPendienteNoCapitalizado: number;
  interesPendienteNoCapitalizado: number;
}

export interface CronogramaCalculado {
  tipo: "Tradicional" | "Adaptado";
  viable: boolean;
  motivoNoViabilidad: string | null;
  cuotas: CuotaCronograma[];
  tea: number;
  ted: number;
  tcea: number | null;
  tceaNota: string | null;
  totalCapital: number;
  totalIntereses: number;
  totalSeguros: number;
  costoTotalCredito: number; // intereses + seguros
  totalPagado: number; // capital + intereses + seguros
  cuotaMinima: number;
  cuotaMaxima: number;
  cuotaPromedio: number;
  periodosCumplen: number;
  periodosRiesgo: number;
  periodosIncumplen: number;
  ratioMaximoObservado: number;
  ratioPromedio: number;
}

export interface ComparacionCronogramas {
  tradicional: CronogramaCalculado;
  adaptado: CronogramaCalculado;
  diferenciaCostoTotal: number; // adaptado.costoTotalCredito - tradicional.costoTotalCredito
  diferenciaIntereses: number;
  diferenciaIncumplimientos: number; // tradicional.periodosIncumplen - adaptado.periodosIncumplen
  adaptadoEsMasCaro: boolean;
  resumenValor: string;
}

export type TipoFenomenoExterno =
  | "Fenómeno El Niño"
  | "Inundaciones"
  | "Sequías"
  | "Retraso de campañas"
  | "Caída extraordinaria de ventas"
  | "Incremento de costos";

export type IntensidadFenomeno = "Moderado" | "Severo" | "Extremo";

export interface ParametrosFenomeno {
  fenomeno: TipoFenomenoExterno;
  intensidad: IntensidadFenomeno;
}

export interface ResultadoSimulacionExterna {
  esEscenarioHipotetico: true;
  parametros: ParametrosFenomeno;
  impactoVentasPct: number;
  impactoCostosPct: number;
  impactoUtilidadPct: number;
  mesesCriticos: string[];
  predictivoEstresado: ResultadoPredictivo;
  comparacionEstresada: ComparacionCronogramas;
  cuotasQueIncumplenFijo: number;
  cuotasQueIncumplenAdaptado: number;
}

export interface ExplicacionComite {
  fuente: "gemini" | "local";
  modelo?: string;
  explicacionEstacionalidad: string;
  justificacionCuotas: string;
  comparacionPlanes: string;
  resumenRiesgos: string;
  conclusionComite: string;
  explicacionSencilla: string;
}

export type EstadoComite =
  | "Generado por el Asesor de Negocios"
  | "Pendiente de validación del Asesor de Riesgos"
  | "Pendiente de decisión del Comité";

export interface PerfilSintetico {
  id: string;
  etiquetaSintetica: string;
  segmento: SegmentoSintetico;
  tituloCaso: string;
  resumenBreve: string;
  estacionalidadNivel: "Baja" | "Media" | "Alta" | "Muy alta";
  volatilidadNivel: "Baja" | "Media" | "Alta";
  exposicionExterna: string;
  input: AnalisisInput;
  // Ventas reales de los siguientes 12 meses reservadas para evaluación out-of-sample (Indicadores)
  ventasFuturasRealesSinteticas: number[];
}

export interface IndicadoresValidacion {
  totalPerfilesBase: number;
  distribucionSegmentos: Array<{ segmento: SegmentoSintetico; cantidad: number }>;
  perfilesPruebaHoldout: number;
  tiempoPromedioMs: number;
  porcentajeCronogramasAdaptadosViables: number;
  porcentajeCronogramasFijosViables: number;
  incumplimientosTradicional: number;
  incumplimientosAdaptado: number;
  maePredictivo: number;
  wapePredictivoPct: number;
  reduccionRatioPromedioPct: number;
  notaMetodologica: string;
}

export interface CasoGuardado {
  id: string;
  fechaGuardado: string;
  estadoComite: EstadoComite;
  input: AnalisisInput;
}
