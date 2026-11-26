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

export type MetodoPredictivoId =
  | "Descomposición Híbrida + Holt Amortiguado"
  | "Regresión Temporal Regularizada + Estacionalidad Actividad/Zona"
  | "Referencia Estacional (Actividad × Zona) Escalada";

export interface ProyeccionPeriodo {
  periodo: number;
  mesCalendarioIndice: number; // 0..11
  etiquetaPeriodo: string;
  fechaVencimiento: string;
  diasPeriodo: number;
  ventasEsperadas: number;
  ventasRangoInferior: number; // Escenario Conservador (cuantil ~P10, z=1.2816)
  ventasRangoSuperior: number; // Escenario Favorable (cuantil ~P90, z=1.2816)
  costosEsperados: number;
  gastosOperativosYTributarios: number;
  utilidadNetaOperativa: number;
  otrosIngresosNetos: number;
  obligacionesYCarga: number;
  utilidadNetaDisponible: number; // Escenario Base
  utilidadConservadora: number; // Escenario Conservador neto
  utilidadFavorable: number; // Escenario Favorable neto
  indiceEstacional: number;
  indiceActividadAplicado: number;
  clasificacionCapacidad: "Alta" | "Media" | "Baja";
}

export interface TrazabilidadPredictiva {
  metodoSeleccionado: MetodoPredictivoId;
  justificacionMetodo: string;
  pesoHistorialIndividual: number; // 0..0.75
  pesoReferenciaSectorActividadZona: number;
  sigmaResidualPct: number;
  factorIncertidumbreBase: number;
  diferenciaActividadVsSectorPct: number;
  procedenciaDatos: string;
  supuestosAplicados: string[];
  avisoNoGarantia: string;
}

export interface ResultadoPredictivo {
  proyecciones: ProyeccionPeriodo[];
  tendencia: "Creciente" | "Estable" | "Decreciente";
  pendienteMensualPct: number;
  volatilidadPct: number;
  nivelConfianza: number; // 0..100 (índice compuesto de completitud documental y estabilidad)
  mesesDisponiblesCount: number;
  usoReferenciaSintetica: boolean;
  mesesMayorCapacidad: string[];
  mesesMenorCapacidad: string[];
  utilidadNetaPromedio: number;
  utilidadConservadoraPromedio: number;
  utilidadFavorablePromedio: number;
  ventasTotalesProyectadas: number;
  factoresExplicativos: string[];
  advertenciasDatos: string[];
  trazabilidad: TrazabilidadPredictiva;
}

export type EstadoCumplimiento = "Cumple" | "Riesgo" | "Incumple";

export interface TrazabilidadCuota {
  motivoImporte: string;
  ingresosProyectados: number;
  costosYObligacionesDescontadas: number;
  utilidadNetaEstimada: number;
  capacidadMaximaPermitida: number;
  restriccionVerificada: string;
  sensibilidadCaida20Pct: {
    utilidadEstresada20: number;
    capacidadMaximaEstresada20: number;
    nuevoRatioSiCae20Pct: number | null;
    estadoSiCae20Pct: EstadoCumplimiento;
  };
}

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
  trazabilidad: TrazabilidadCuota;
}

export interface DesgloseFuncionObjetivo {
  formulaTexto: string;
  valorTotalObjetivo: number;
  penalizacionIncumplimientos: number;
  variabilidadCuotasCV: number;
  variabilidadRatioCV: number;
  concentracionMaxAmortPct: number;
  costoFinancieroSobreMonto: number;
  desviacionSostenible: number;
  iteracionesOptimizador: number;
}

export interface ReglaValidacionIndependiente {
  codigo: string;
  nombre: string;
  aprobada: boolean;
  detalle: string;
}

export interface ResultadoValidacionIndependiente {
  valido: boolean;
  errores: string[];
  maxDesviacionCentavos: number;
  saldoFinalVerificado: number;
  totalCapitalVerificado: number;
  reglasVerificadas: ReglaValidacionIndependiente[];
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
  variabilidadCuotasCV: number; // Coeficiente de variación (%)
  periodosCumplen: number;
  periodosRiesgo: number;
  periodosIncumplen: number;
  ratioMaximoObservado: number;
  ratioPromedio: number;
  optimizadorDetalle?: DesgloseFuncionObjetivo;
  validacionIndependiente: ResultadoValidacionIndependiente;
}

export interface ComparacionCronogramas {
  tradicional: CronogramaCalculado;
  adaptado: CronogramaCalculado;
  diferenciaCostoTotal: number; // adaptado.costoTotalCredito - tradicional.costoTotalCredito
  diferenciaIntereses: number;
  diferenciaIncumplimientos: number; // tradicional.periodosIncumplen - adaptado.periodosIncumplen
  adaptadoEsMasCaro: boolean;
  mejorOpcion: "Adaptado" | "Tradicional" | "Equivalente" | "Ninguno";
  motivoSeleccion: string;
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

export type ModoEvaluacionShock = "preventivo" | "sobrevenido";

export interface ParametrosFenomeno {
  fenomeno: TipoFenomenoExterno;
  intensidad: IntensidadFenomeno;
  mesInicioPeriodo?: number; // 1-indexed period start (default 1)
  duracionMeses?: number; // 1..12 (default 4)
  magnitudAdicionalPct?: number; // -20..+30 fine tuning (default 0)
  modoEvaluacion?: ModoEvaluacionShock; // default "preventivo"
}

export interface EvaluacionCronogramaSobrevenido {
  incumplimientosFijoOriginal: number;
  incumplimientosAdaptadoOriginal: number;
  periodosCriticosFijoOriginal: string[];
  periodosCriticosAdaptadoOriginal: string[];
  resumen: string;
}

export interface ResultadoSimulacionExterna {
  esEscenarioHipotetico: true;
  parametros: Required<ParametrosFenomeno>;
  factorGeograficoAplicado: number;
  sensibilidadSectorialAplicada: number;
  impactoVentasPct: number;
  impactoCostosPct: number;
  impactoUtilidadPct: number;
  mesesCriticos: string[];
  predictivoEstresado: ResultadoPredictivo;
  comparacionEstresada: ComparacionCronogramas;
  cuotasQueIncumplenFijo: number;
  cuotasQueIncumplenAdaptado: number;
  sobrevenido: EvaluacionCronogramaSobrevenido;
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
  trazabilidadCalculos?: string;
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

export interface BacktestSegmentoMetrics {
  segmento: SegmentoSintetico;
  evaluaciones: number;
  maeNegova: number;
  wapeNegovaPct: number;
  rmseNegova: number;
  sesgoPct: number;
  cobertura80Pct: number;
  wapeIngenuoPct: number;
  wapeEstacionalPuroPct: number;
  esPeorRendimiento: boolean;
}

export interface BacktestTemporalResumen {
  horizonteMeses: number;
  origenesEvaluados: number[];
  totalObservacionesOutOfSample: number;
  maeGlobal: number;
  wapeGlobalPct: number;
  rmseGlobal: number;
  sesgoGlobalPct: number;
  coberturaIntervalo80Pct: number;
  wapeBaselineIngenuoPct: number;
  wapeBaselineEstacionalPct: number;
  peorSegmento: SegmentoSintetico;
  notaMetodologicaBacktest: string;
  porSegmento: BacktestSegmentoMetrics[];
}

export interface ExperimentoGrupoMetrics {
  clave: string;
  perfiles: number;
  viabilidadTradicionalPct: number;
  viabilidadAdaptadoPct: number;
  cumplimientoCapacidadAdaptadoPct: number;
  validacionMatematicaPct: number;
  incumplimientosTradicional: number;
  incumplimientosAdaptado: number;
  variabilidadCVAdaptadoPct: number;
  deltaCostoPromedio: number;
  adaptadoMasBaratoPct: number;
  tradicionalMejorOIgualPct: number;
  noViablesAdaptadoCount: number;
}

export interface SensibilidadParametroRow {
  escenario: string;
  factorCapacidad: number;
  caidaIngresosPct: number;
  viabilidadTradicionalPct: number;
  viabilidadAdaptadoPct: number;
  incumplimientosTradicional: number;
  incumplimientosAdaptado: number;
}

export interface ExperimentoReproducibleResumen {
  version: string;
  fechaEjecucionIso: string;
  semilla: number;
  totalPerfilesEvaluados: number;
  tiempoTotalExperimentoMs: number;
  tiempoAnalisisPredictivoMs: number;
  tiempoOptimizacionMs: number;
  porcentajeCronogramasMatematicamenteValidos: number;
  porcentajeCumplimientoCapacidadAdaptado: number;
  distribucionDeltaCosto: {
    min: number;
    p25: number;
    medianaP50: number;
    p75: number;
    max: number;
  };
  casosFallidosAdaptado: {
    totalNoViables: number;
    porSaldoPendiente: number;
    porDeficitInteresesSeguros: number;
    porReglaProducto: number;
  };
  porSegmento: ExperimentoGrupoMetrics[];
  porActividadTop: ExperimentoGrupoMetrics[];
  porEstacionalidad: ExperimentoGrupoMetrics[];
  porVolatilidad: ExperimentoGrupoMetrics[];
  analisisSensibilidad: SensibilidadParametroRow[];
  limitacionesExperimento: string[];
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
  casosNoViablesAdaptadoHoldout: number;
  maePredictivo: number;
  wapePredictivoPct: number;
  reduccionRatioPromedioPct: number;
  notaMetodologica: string;
  backtestTemporal: BacktestTemporalResumen;
  experimentoCompleto: ExperimentoReproducibleResumen;
}

export interface CasoGuardado {
  id: string;
  fechaGuardado: string;
  estadoComite: EstadoComite;
  input: AnalisisInput;
}
