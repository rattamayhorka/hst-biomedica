import { useEffect, useState } from 'react';
import { database } from '../api';
import { X, Plus, CreditCard, ChevronDown, ChevronRight, AlertTriangle, ShieldCheck, Flame, Wallet, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Finanzas({ refreshTrigger }) {
  const [transacciones, setTransacciones] = useState([]);
  const [presupuestosBase, setPresupuestosBase] = useState([]);
  const [mapaRubrosAMacro, setMapaRubrosAMacro] = useState({}); 
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalRegistro, setModalRegistro] = useState(false);
  
  // 💸 CONTROL DE SALDOS Y MÉTODOS
  const [modalSaldos, setModalSaldos] = useState(false);
  const [saldosCuentas, setSaldosCuentas] = useState({}); 
  const [listaMetodos, setListaMetodos] = useState([]);  

  // 📅 SELECCIÓN DE PERIODO DINÁMICO
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(obtenerQuincenaActualId());

  const [macrosAbiertas, setMacrosAbiertas] = useState({ "Facturas / Vivienda": true, "Deudas / Tarjetas": true });
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 9;

  const [form, setForm] = useState({
    importe: "",
    descripcion: "",
    metodo_pago: "", 
    rubro: "",
    tipo: "GASTO" // GASTO o INGRESO (Para Opción A)
  });

  // =========================================================================
  //  📅 MOTOR DE FECHAS Y QUINCENAS AUTOMÁTICO (PERPETUO)
  // =========================================================================
  function obtenerQuincenaActualId() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const quincena = hoy.getDate() <= 15 ? 'Q1' : 'Q2';
    return `${año}-${mes}-${quincena}`;
  }

  function parsearFechaAQuincenaId(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.includes('-') ? fechaStr.split('-') : fechaStr.split('/');
    let año, mes, dia;
    if (partes[0].length === 4) { 
      [año, mes, dia] = partes.map(Number);
    } else { 
      [dia, mes, año] = partes.map(Number);
    }
    const qId = dia <= 15 ? 'Q1' : 'Q2';
    return `${año}-${String(mes).padStart(2, '0')}-${qId}`;
  }

  function calcularProgresoTiempoQuincena() {
    const hoy = new Date();
    const dia = hoy.getDate();
    if (dia <= 15) {
      return { actual: dia, total: 15, pct: (dia / 15) * 100 };
    } else {
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
      const diasEnSegundaQ = ultimoDia - 15;
      const diaActualSegundaQ = dia - 15;
      return { actual: diaActualSegundaQ, total: diasEnSegundaQ, pct: (diaActualSegundaQ / diasEnSegundaQ) * 100 };
    }
  }

  function generarOpcionesDeQuincenas() {
    const opciones = [];
    const hoy = new Date();
    const mesesEtiquetas = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    for (let i = -2; i <= 1; i++) {
      const fechaIterada = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      const año = fechaIterada.getFullYear();
      const mesNum = String(fechaIterada.getMonth() + 1).padStart(2, '0');
      const mesNombre = mesesEtiquetas[fechaIterada.getMonth()];

      opciones.push({ id: `${año}-${mesNum}-Q1`, texto: `${mesNombre} ${año} - 1ra Quincena (1 al 15)` });
      opciones.push({ id: `${año}-${mesNum}-Q2`, texto: `${mesNombre} ${año} - 2da Quincena (16 al fin)` });
    }
    return opciones.reverse();
  }

  const progresoQuincena = calcularProgresoTiempoQuincena();

  // =========================================================================
  //  📡 INGESTIÓN DE DATA
  // =========================================================================
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataTransacciones, dataPresupuestos, dataMapeo] = await Promise.all([
        database.obtenerSeccion('transacciones'),
        database.obtenerSeccion('presupuestos_macro'), 
        database.obtenerSeccion('mapeo_rubros')
      ]);

      if (Array.isArray(dataTransacciones)) setTransacciones(dataTransacciones);
      
      if (Array.isArray(dataPresupuestos)) {
        setPresupuestosBase(dataPresupuestos);
        const mapaSaldosDetectados = {};
        const metodosDetectados = [];

        dataPresupuestos.forEach(fila => {
          if (fila.Metodos_Pago && fila.Metodos_Pago.trim() !== "") {
            const nombreMetodo = fila.Metodos_Pago.trim();
            const saldoMetodo = parseFloat(fila.Saldo_Actual?.toString().replace(/[$,\s]/g, '')) || 0;
            mapaSaldosDetectados[nombreMetodo] = saldoMetodo;
            metodosDetectados.push(nombreMetodo);
          }
        });

        setSaldosCuentas(mapaSaldosDetectados);
        if (metodosDetectados.length > 0) {
          setListaMetodos(metodosDetectados);
          const primerMetodoConSaldo = metodosDetectados.find(m => (mapaSaldosDetectados[m] || 0) > 0) || metodosDetectados[0];
          setForm(prev => ({ ...prev, metodo_pago: primerMetodoConSaldo }));
        }
      }
      
      if (Array.isArray(dataMapeo) && dataMapeo.length > 0) {
        const mapaConstruido = dataMapeo.reduce((acc, curr) => {
          if (curr.Sub_Rubro && curr.Categoria_Macro) {
            acc[curr.Sub_Rubro.trim()] = curr.Categoria_Macro.trim();
          }
          return acc;
        }, {});
        
        setMapaRubrosAMacro(mapaConstruido);
        const rubrosDisponibles = Object.keys(mapaConstruido);
        if (rubrosDisponibles.length > 0) {
          setForm(prev => ({ ...prev, rubro: prev.rubro || rubrosDisponibles[0] }));
        }
      }
    } catch (error) {
      console.error("Error al sincronizar con Búnker Sheets:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [refreshTrigger]);

  const toggleMacro = (macro) => {
    setMacrosAbiertas(prev => ({ ...prev, [macro]: !prev[macro] }));
  };

  // =========================================================================
  //  💾 PROCESADORES DE ESCRITURA (POST) - Opción A Integrada
  // =========================================================================
  const ejecutarGuardar = async (e) => {
    e.preventDefault();
    if (!form.importe || !form.descripcion.trim()) return alert("Completa los campos requeridos");

    setGuardando(true);
    const finalImporte = form.tipo === 'INGRESO' ? Math.abs(parseFloat(form.importe)) : Math.abs(parseFloat(form.importe));

    const payload = {
      fecha: new Date().toLocaleDateString('es-MX'),
      importe: finalImporte,
      descripcion: form.descripcion.toUpperCase().trim(),
      metodo_pago: form.metodo_pago,
      rubro: form.rubro
    };

    // Optimistic Update en UI local
    setTransacciones(prev => [payload, ...prev]);
    setModalRegistro(false);
    setPaginaActual(1);
    
    // 1. Guardamos la transacción en la pestaña
    await database.guardarDatos('guardarTransaccion', payload);
    
    // 2. Modificamos el saldo actual en caliente según la Opción A (Ingreso suma / Gasto resta)
    const saldoAnterior = saldosCuentas[form.metodo_pago] || 0;
    const nuevoSaldo = form.tipo === 'INGRESO' ? saldoAnterior + finalImporte : saldoAnterior - finalImporte;
    
    await database.guardarDatos('actualizarSaldos', { [form.metodo_pago]: nuevoSaldo });

    setForm(prev => ({ ...prev, importe: "", descripcion: "", tipo: "GASTO" }));
    setGuardando(false);
    cargarDatos();
  };

  const ejecutarActualizarSaldos = async (e) => {
    e.preventDefault();
    setGuardando(true);
    await database.guardarDatos('actualizarSaldos', saldosCuentas);
    setModalSaldos(false);
    setGuardando(false);
    cargarDatos();
  };

  const listaRubros = Object.keys(mapaRubrosAMacro);

  if (cargando) {
    return <p className="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left p-4">Actualizando...</p>;
  }

  // =========================================================================
  //  🧠 MOTOR DE PROCESAMIENTO QUINCENAL DINÁMICO & PACING
  // =========================================================================
  const transaccionesQuincenaActiva = transacciones.filter(t => {
    return parsearFechaAQuincenaId(t.Fecha || t.fecha) === periodoSeleccionado;
  });

  let gastoGlobal = 0;
  let presupuestoGlobalEstatico = 0;
  let totalDeudaMitigada = 0;
  let compromisosCriticosAsignados = 0;
  let compromisosCriticosGastados = 0;

  const gastosPorMetodo = {};
  const macroEstructura = {};
  const macrosObligatorias = ["Facturas / Vivienda", "Servicios / Internet", "Educacion"];

  // Inicializar Estructura Macro desde presupuestos base
  presupuestosBase.forEach(p => {
    const lim = parseFloat(p.Asignacion_Quincenal?.toString().replace(/[$,\s]/g, '')) || 0;
    const macroNombre = p.Categoria_Macro;
    
    if (macroNombre && !macroNombre.includes("Saldo_Actual")) {
      macroEstructura[macroNombre] = { asignado: lim, gastado: 0, rubros: {} };
      presupuestoGlobalEstatico += lim;
      if (macrosObligatorias.includes(macroNombre)) compromisosCriticosAsignados += lim;
    }
  });

  // Procesar transacciones pertenecientes UNICAMENTE a este periodo
  transaccionesQuincenaActiva.forEach(t => {
    const importeCrudo = t.Importe || t.importe || "0";
    const imp = parseFloat(importeCrudo.toString().replace(/[$,\s\-]/g, '')) || 0;
    
    const rubroActual = t.Rubro || t.rubro || "Extras";
    const macroAsignada = mapaRubrosAMacro[rubroActual] || "Extras";

    // Si el rubro está marcado como SUELDO o viene de un ingreso no impacta al Semáforo de Gastos Macro
    if (rubroActual.toUpperCase() === "SUELDO") return;

    gastoGlobal += imp;
    const metodoActual = t['Metodo de pago'] || t.metodo_pago || "Efectivo";
    gastosPorMetodo[metodoActual] = (gastosPorMetodo[metodoActual] || 0) + imp;

    if (!macroEstructura[macroAsignada]) {
      macroEstructura[macroAsignada] = { asignado: 0, gastado: 0, rubros: {} };
    }

    macroEstructura[macroAsignada].gastado += imp;
    macroEstructura[macroAsignada].rubros[rubroActual] = (macroEstructura[macroAsignada].rubros[rubroActual] || 0) + imp;

    if (macroAsignada === "Deudas / Tarjetas") totalDeudaMitigada += imp;
    if (macrosObligatorias.includes(macroAsignada)) compromisosCriticosGastados += imp;
  });

  // Calcular Efectivo Físico Disponible Real en vivo (Columnas C y D de la hoja)
  const efectivoFisicoTotal = Object.values(saldosCuentas).reduce((acc, curr) => acc + curr, 0);

  const bolsaCompromisosPendientes = compromisosCriticosAsignados - compromisosCriticosGastados;
  const deudasAsignadas = macroEstructura["Deudas / Tarjetas"] ? macroEstructura["Deudas / Tarjetas"].asignado : 0;
  const bolsaDisponibleFlujoLibre = (presupuestoGlobalEstatico - deudasAsignadas) - (gastoGlobal - totalDeudaMitigada);

  // Paginador enfocado al set activo
  const totalPaginas = Math.ceil(transaccionesQuincenaActiva.length / itemsPorPagina) || 1;
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const transaccionesPaginadas = transaccionesQuincenaActiva.slice(indicePrimerItem, indiceUltimoItem);

  return (
    <div className="space-y-6 text-left p-2 bg-zinc-950 text-zinc-200 font-sans min-h-screen">
      
      {/* HEADER CONTROLES Y CONTROL SELECTOR DINÁMICO */}
      <div className="border-b border-zinc-900 pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-50 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400 stroke-[2.5]" /> Búnker Financiero
          </h2>
          <div className="mt-2 flex items-center gap-2 bg-zinc-900/80 p-1.5 border border-zinc-800 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-500 pl-2">Corte:</span>
            <select 
              value={periodoSeleccionado}
              onChange={(e) => { setPeriodoSeleccionado(e.target.value); setPaginaActual(1); }}
              className="bg-zinc-950 border border-zinc-800 text-xs font-bold text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {generarOpcionesDeQuincenas().map(opcion => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.texto} {opcion.id === obtenerQuincenaActualId() ? "• (En Curso)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setModalSaldos(true)} 
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 mr-1.5 text-zinc-500" /> Ajustar Canales Fijos
          </button>
          <button 
            onClick={() => setModalRegistro(true)} 
            className="bg-emerald-400 hover:bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* RITMO PROPORCIONAL DE PACING DE LA QUINCENA */}
      {periodoSeleccionado === obtenerQuincenaActualId() && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-2">
            <span className="text-zinc-400">Progreso Temporal del Periodo</span>
            <span className="text-emerald-400">Día {progresoQuincena.actual} de {progresoQuincena.total} ({Math.round(progresoQuincena.pct)}%)</span>
          </div>
          <div className="w-full bg-zinc-950 border border-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all" style={{ width: `${progresoQuincena.pct}%` }}></div>
          </div>
        </div>
      )}

      {/* CUADRO DE MANDOS DE LIQUIDEZ QUINCENAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Cuentas Críticas en el Periodo</span>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-200 tabular-nums">${bolsaCompromisosPendientes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            <p className="text-[8px] text-zinc-500 mt-1 uppercase font-bold tracking-tight">Presupuesto comprometido por liquidar</p>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-emerald-400 animate-pulse" /> Caja de Seguridad Libre (Flujo)
          </span>
          <div className="mt-2">
            <div className={`text-xl font-black tabular-nums ${bolsaDisponibleFlujoLibre < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              ${bolsaDisponibleFlujoLibre.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[8px] text-zinc-500 mt-1 uppercase font-bold tracking-tight">Fondos netos ideales de supervivencia</p>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-emerald-400">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Total en Bancos/Efectivo</span>
          <div className="mt-2">
            <div className="text-xl font-black text-emerald-400 tabular-nums">${efectivoFisicoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            <p className="text-[8px] text-zinc-500 mt-1 uppercase font-bold tracking-tight">Suma acumulada real en saldos</p>
          </div>
        </div>
      </div>

      {/* CUENTAS VIGENTES */}
      <div>
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Saldos de Canales de Pago</h3>
        <div className="flex flex-wrap gap-2">
          {listaMetodos
            .filter(metodo => (saldosCuentas[metodo] || 0) > 0)
            .map(metodo => {
              const saldoActual = saldosCuentas[metodo] || 0;
              const gastadoQuincena = gastosPorMetodo[metodo] || 0;
            return (
              <div key={metodo} className="flex items-center bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-1.5 shadow-sm">
                <CreditCard className="w-3 h-3 text-emerald-400 mr-2" />
                <span className="text-[9px] font-black uppercase text-zinc-400 mr-2 tracking-tight">{metodo}:</span>
                <span className="text-xs font-black text-slate-100 tabular-nums">
                  ${saldoActual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  <span className="text-[8px] text-zinc-600 font-black ml-1.5 uppercase tracking-wider">(Gastado Periodo: ${gastadoQuincena.toFixed(2)})</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE CONTROL: MACROS & BITÁCORA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* SEMÁFORO DE PACING (COMPORTAMIENTO DE GASTO PROPORCIONAL) */}
        <div className="xl:col-span-1 space-y-4">
          <h3 className="text-sm font-black text-slate-50 uppercase italic tracking-tighter">Métricas de Ritmo Quincenal</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-h-[600px] overflow-y-auto space-y-3 custom-scrollbar">
            {Object.keys(macroEstructura)
              .filter(macro => macroEstructura[macro].gastado > 0 || macroEstructura[macro].asignado > 0)
              .map(macro => {
                const item = macroEstructura[macro];
                const disponible = item.asignado - item.gastado;
                const porcentajeBarra = item.asignado > 0 ? (item.gastado / item.asignado) * 100 : 0;
                const estaAbierto = !!macrosAbiertas[macro];

                const sobregirado = disponible < 0;
                
                // Análisis Semáforo de Ritmo (Pacing) en tiempo real
                const gastoIdealProporcional = (item.asignado / 100) * progresoQuincena.pct;
                const vaAdelantadoAlDia = item.gastado > gastoIdealProporcional && (item.gastado - gastoIdealProporcional) > 40;

                let colorBarra = "bg-emerald-400";
                let statusBadgeText = "Estable";
                let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

                if (sobregirado) {
                  colorBarra = "bg-red-500";
                  statusBadgeText = "Sobregiro";
                  badgeStyle = "bg-red-500/20 text-red-400 border-red-500/30";
                } else if (vaAdelantadoAlDia && periodoSeleccionado === obtenerQuincenaActualId()) {
                  colorBarra = "bg-orange-400";
                  statusBadgeText = "Gasto Rápido";
                  badgeStyle = "bg-orange-500/20 text-orange-400 border-orange-500/30";
                } else if (porcentajeBarra > 85) {
                  colorBarra = "bg-amber-500";
                  statusBadgeText = "Límite Crítico";
                  badgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                }

                return (
                  <div key={macro} className={`rounded border overflow-hidden transition-all duration-200 bg-zinc-950 ${sobregirado ? 'border-red-900/60' : 'border-zinc-800'}`}>  
                    <div onClick={() => toggleMacro(macro)} className="p-3 flex justify-between items-start select-none cursor-pointer hover:bg-zinc-900/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {estaAbierto ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                          <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">{macro}</span>
                          <span className={`px-1.5 py-0.5 text-[7px] font-bold rounded-full border uppercase tracking-wider ${badgeStyle}`}>
                            {statusBadgeText}
                          </span>
                        </div>
                        <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider pl-5">Tope Q: ${item.asignado.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-50 tabular-nums">${item.gastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                        <div className={`text-[9px] uppercase tracking-tighter ${sobregirado ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                          {sobregirado ? `Exceso: ` : `Disp: `}${Math.abs(disponible).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-3">
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800/40">
                        <div className={`${colorBarra} h-full transition-all duration-500`} style={{ width: `${Math.min(porcentajeBarra, 100)}%` }}></div>
                      </div>
                    </div>

                    {estaAbierto && Object.keys(item.rubros).length > 0 && (
                      <div className="bg-zinc-900/40 border-t border-zinc-900 px-3 py-2 space-y-2 text-[9px] uppercase font-bold text-zinc-400">
                        {Object.keys(item.rubros).map(sub => (
                          <div key={sub} className="flex justify-between items-center pl-4 border-l border-zinc-800 py-0.5">
                            <span>{sub}</span>
                            <span className="text-slate-300 tabular-nums">${item.rubros[sub].toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* HISTORIAL FILTRADO POR LA QUINCENA EN CURSO */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-50 uppercase italic tracking-tighter">Huella de Transacciones de este Periodo</h3>
          <div className="bg-zinc-900 shadow-2xl rounded-xl overflow-hidden border border-zinc-800">
            <div className="overflow-x-auto">
              
              <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-wider">
                <span className="text-zinc-500 italic">Mostrando {transaccionesQuincenaActiva.length > 0 ? indicePrimerItem + 1 : 0}-{Math.min(indiceUltimoItem, transaccionesQuincenaActiva.length)} de {transaccionesQuincenaActiva.length} de esta quincena</span>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400">Pág. <span className="text-slate-100 tabular-nums">{paginaActual}</span> de <span className="text-slate-100 tabular-nums">{totalPaginas}</span></span>
                  <div className="flex gap-1">
                    <button type="button" disabled={paginaActual === 1} onClick={() => setPaginaActual(prev => prev - 1)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 border border-zinc-800 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer">&lt; Ant</button>
                    <button type="button" disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(prev => prev + 1)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 border border-zinc-800 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer">Sig &gt;</button>
                  </div>
                </div>
              </div>

              <table className="w-full">
                <thead className="bg-zinc-950 text-zinc-400 text-[9px] uppercase tracking-widest font-black border-b border-zinc-800">
                  <tr>
                    <th className="p-4 text-left">Detalle / Fecha</th>
                    <th className="p-4 text-left">Categoría Macro</th>
                    <th className="p-4 text-left">Sub-Rubro</th>
                    <th className="p-4 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-left">
                  {transaccionesPaginadas.length > 0 ? transaccionesPaginadas.map((t, idx) => {
                    const rubro = t.Rubro || t.rubro || "Extras";
                    const macro = mapaRubrosAMacro[rubro] || "Extras";
                    const importeCrudo = t.Importe || t.importe || "0";
                    const importeLimpio = parseFloat(importeCrudo.toString().replace(/[$,\s\-]/g, '')) || 0;
                    
                    const esDeuda = macro === "Deudas / Tarjetas";
                    const esSueldo = rubro.toUpperCase() === "SUELDO";

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4">
                          <div className="text-xs font-black text-slate-100 uppercase tracking-tight leading-tight">{t.Descripción || t.descripcion}</div>
                          <div className="text-[8px] font-bold text-zinc-600 font-mono mt-0.5">{t.Fecha || t.fecha}</div>
                        </td>
                        <td className="p-4 text-transform: uppercase text-[10px] font-black text-zinc-300 tracking-tight">{esSueldo ? "INGRESOS" : macro}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-950 border border-zinc-800 italic ${esSueldo ? 'text-emerald-400 border-emerald-500/30' : esDeuda ? 'text-blue-400' : 'text-emerald-400'}`}>{rubro}</span>
                        </td>
                        <td className={`p-4 text-right text-xs font-black tabular-nums ${esSueldo ? 'text-emerald-400' : esDeuda ? 'text-blue-400' : 'text-red-400'}`}>
                          {esSueldo ? '+$' : esDeuda ? '-$' : '-$'}{importeLimpio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-zinc-600 font-bold uppercase text-xs">Cero registros vinculados en esta quincena</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE REGISTRO FORMULARIO ADAPTADO CON TIPO (OPCIÓN A) */}
      {modalRegistro && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left border border-zinc-800 border-t-4 border-t-emerald-400">
            <div className="bg-zinc-950 p-4 text-slate-50 font-black uppercase text-[10px] tracking-widest flex justify-between border-b border-zinc-800">
              Inyectar Registro Financiero
              <button onClick={() => setModalRegistro(false)} className="cursor-pointer text-zinc-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={ejecutarGuardar} className="p-6 space-y-4">
              {/* INTERRUPTOR OPCION A: GASTO VS INGRESO */}
              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1.5">Naturaleza del Flujo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipo: 'GASTO', rubro: listaRubros[0] || "" }))}
                    className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${form.tipo === 'GASTO' ? 'bg-red-500/10 text-red-400 border-red-500' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}
                  >
                    🔴 Gasto Corriente
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipo: 'INGRESO', rubro: 'SUELDO', descripcion: 'NÓMINA QUINCENAL' }))}
                    className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${form.tipo === 'INGRESO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' : 'bg-zinc-950 text-zinc-500 border-zinc-800'}`}
                  >
                    🟢 Ingreso / Nómina
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Concepto / Descripción</label>
                <input type="text" required placeholder="Ej. SUPER DE LA SEMANA" value={form.descripcion} onChange={(e) => setForm(prev => ({...prev, descripcion: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-slate-50 uppercase outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Importe ($)</label>
                <input type="number" step="0.01" required placeholder="0.00" value={form.importe} onChange={(e) => setForm(prev => ({...prev, importe: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-slate-50 uppercase outline-none focus:border-emerald-400 tabular-nums" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Sub-Rubro</label>
                  {form.tipo === 'INGRESO' ? (
                    <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-black text-emerald-400 uppercase outline-none focus:border-emerald-400">
                      <option value="SUELDO">SUELDO</option>
                    </select>
                  ) : (
                    <select value={form.rubro} onChange={(e) => setForm(prev => ({...prev, rubro: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-bold text-slate-50 uppercase outline-none focus:border-emerald-400 cursor-pointer">
                      {listaRubros.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Canal de Destino/Origen</label>
                  <select value={form.metodo_pago} onChange={(e) => setForm(prev => ({...prev, metodo_pago: e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-bold text-slate-50 uppercase outline-none focus:border-emerald-400 cursor-pointer">
                    {listaMetodos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={guardando} className="w-full bg-emerald-400 hover:bg-emerald-500 text-zinc-950 py-3 rounded-lg text-[10px] font-black uppercase shadow-lg cursor-pointer disabled:opacity-50 transition-all mt-2">
                {guardando ? 'Sincronizando con Google Sheets...' : 'Ejecutar Transacción'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTAR SALDOS DINÁMICOS */}
      {modalSaldos && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-left border border-zinc-800 border-t-4 border-t-zinc-400">
            <div className="bg-zinc-950 p-4 text-slate-50 font-black uppercase text-[10px] tracking-widest flex justify-between border-b border-zinc-800">
              Corte y Liquidación de Saldos
              <button onClick={() => setModalSaldos(false)} className="cursor-pointer text-zinc-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={ejecutarActualizarSaldos} className="p-6 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Modifica los fondos corrientes de tu columna C de la hoja:</p>
              
              <div className="space-y-3">
                {Object.keys(saldosCuentas).map(metodo => (
                  <div key={metodo} className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg border border-zinc-900">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-tight">{metodo}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={saldosCuentas[metodo]} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSaldosCuentas(prev => ({ ...prev, [metodo]: val }));
                      }} 
                      className="w-28 bg-zinc-900 border border-zinc-800 rounded p-1 text-right text-xs font-bold text-slate-50 outline-none focus:border-zinc-500 tabular-nums" 
                    />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={guardando} className="w-full bg-zinc-200 hover:bg-zinc-100 text-zinc-950 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-lg cursor-pointer disabled:opacity-50 transition-all mt-4">
                {guardando ? 'Sincronizando Columnas C y D...' : 'Inyectar Cambios a Sheets'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}