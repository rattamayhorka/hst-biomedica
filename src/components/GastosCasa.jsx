import { useEffect, useState } from 'react';
import { database } from '../api';
import { X, Plus, CreditCard, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

export default function Finanzas() {
  const [transacciones, setTransacciones] = useState([]);
  const [presupuestosBase, setPresupuestosBase] = useState([]); // Nueva pestaña de Sheets
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalRegistro, setModalRegistro] = useState(false);
  const [macrosAbiertas, setMacrosAbiertas] = useState({});
  
  const [form, setForm] = useState({
    importe: "",
    descripcion: "",
    metodo_pago: "Efectivo",
    rubro: "Despensa"
  });

  const mapaRubrosAMacro = {
    "CFE": "Facturas / Vivienda", "Mantenimiento": "Facturas / Vivienda", "Gas": "Facturas / Vivienda",
    "Internet": "Servicios / Internet", "Recargas": "Servicios / Internet", "Limpieza": "Servicios / Internet",
    "Mes IQI": "Educacion", "Mes UVM": "Educacion", "RVOE": "Educacion",
    "Despensa": "Consumibles / Alimentacion",
    "Preparada": "Restaurantes", "Restaurantes": "Restaurantes",
    "TransporteOP": "Transporte Fijo", "TransporteIQI": "Transporte Fijo", "TransporteOtros": "Transporte Extra",
    "Prevision": "Prevision y salud", "Domingos": "Prevision y salud", "Salud": "Prevision y salud", "Cabello": "Prevision y salud",
    "ChatGPT": "Membresias / Suscripciones", "ChatGPT (V)": "Membresias / Suscripciones", "Obsidian": "Membresias / Suscripciones",
    "Strava": "Membresias / Suscripciones", "YouTube": "Membresias / Suscripciones", "Nintendo": "Membresias / Suscripciones",
    "iCloud": "Membresias / Suscripciones", "Spotify": "Membresias / Suscripciones", "Google One (E)": "Membresias / Suscripciones",
    "Walmart": "Membresias / Suscripciones", "Uber One": "Membresias / Suscripciones", "Netflix": "Membresias / Suscripciones", "Paramount": "Membresias / Suscripciones",
    "Cerveza": "Ocio y Entretenimiento", "Entretenimiento": "Ocio y Entretenimiento", "Hobbies": "Ocio y Entretenimiento",
    "Pago de Prestamos": "Deudas / Tarjetas", "Pago de TDCV": "Deudas / Tarjetas", "Pago de TDCE": "Deudas / Tarjetas", "Pago de TDCNu": "Deudas / Tarjetas", "Pago de TDCSan": "Deudas / Tarjetas",
    "Ahorro": "Ahorro / Inversion", "Cetes": "Ahorro / Inversion",
    "Extras": "Extras"
  };

  const listaRubros = Object.keys(mapaRubrosAMacro);
  const listaMetodos = [
    "Debito BBVA (E)", "Debito BBVA (V)", "Debito Santander (V)", "Spin", "TDCSantander",
    "TDCLike U", "TDCNU", "TDCE", "Efectivale", "TDCV", "Si vale", "Efectivo"
  ];

  const cargarDatos = async () => {
    setCargando(true);
    // Descarga transacciones y presupuestos en paralelo
    const [dataTransacciones, dataPresupuestos] = await Promise.all([
      database.obtenerSeccion('transacciones'),
      database.obtenerSeccion('presupuestos_macro')
    ]);

    if (Array.isArray(dataTransacciones)) setTransacciones(dataTransacciones.reverse());
    if (Array.isArray(dataPresupuestos)) setPresupuestosBase(dataPresupuestos);
    
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleMacro = (macro) => {
    setMacrosAbiertas(prev => ({ ...prev, [macro]: !prev[macro] }));
  };

  const ejecutarGuardar = async (e) => {
    e.preventDefault();
    if (!form.importe || !form.descripcion.trim()) return alert("Completa los campos requeridos");

    setGuardando(true);
    const payload = {
      fecha: new Date().toLocaleDateString('es-MX'),
      importe: parseFloat(form.importe),
      descripcion: form.descripcion.toUpperCase(),
      metodo_pago: form.metodo_pago,
      rubro: form.rubro
    };

    setTransacciones(prev => [payload, ...prev]);
    await database.guardarDatos('guardarTransaccion', payload);
    
    setForm({ importe: "", descripcion: "", metodo_pago: "Efectivo", rubro: "Despensa" });
    setModalRegistro(false);
    setGuardando(false);
    cargarDatos();
  };

  if (cargando) {
    return <p className="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left p-4">Iniciando contabilidad base cero...</p>;
  }

  // --- MOTOR DE PROCESAMIENTO FINANCIERO CRUCIAL ---
  let gastoGlobal = 0;
  let presupuestoGlobalEstatico = 0;
  const gastosPorMetodo = {};
  const macroEstructura = {};

  // 1. Inicializar macros utilizando los límites reales configurados en Sheets
  presupuestosBase.forEach(p => {
    const lim = parseFloat(p.Asignacion_Quincenal.toString().replace(/[$,\s]/g, '')) || 0;
    macroEstructura[p.Categoria_Macro] = {
      asignado: lim,
      gastado: 0,
      rubros: {}
    };
    presupuestoGlobalEstatico += lim;
  });

  // Asegurar que si hay rubros huérfanos sin presupuesto base, existan en la estructura
  Object.values(mapaRubrosAMacro).forEach(macro => {
    if (!macroEstructura[macro]) {
      macroEstructura[macro] = { asignado: 0, gastado: 0, rubros: {} };
    }
  });

  // 2. Clasificar y acumular transacciones con limpieza anti-NaN
  transacciones.forEach(t => {
    const importeCrudo = t.Importe || t.importe || "0";
    const imp = parseFloat(importeCrudo.toString().replace(/[$,\s\-]/g, '')) || 0;

    gastoGlobal += imp;

    const metodoActual = t['Metodo de pago'] || t.metodo_pago || "Efectivo";
    gastosPorMetodo[metodoActual] = (gastosPorMetodo[metodoActual] || 0) + imp;

    const rubroActual = t.Rubro || t.rubro || "Extras";
    const macroAsignada = mapaRubrosAMacro[rubroActual] || "Extras";

    macroEstructura[macroAsignada].gastado += imp;
    macroEstructura[macroAsignada].rubros[rubroActual] = (macroEstructura[macroAsignada].rubros[rubroActual] || 0) + imp;
  });

  const bolsaDisponibleGlobal = presupuestoGlobalEstatico - gastoGlobal;

  return (
    <div className="space-y-6 text-left p-2">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-zinc-800 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-50">Búnker / Presupuesto Quincenal</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Estrategia activa basada en límites de Google Sheets</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
            Fondo Inicial: <span className="text-slate-200">${presupuestoGlobalEstatico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={`px-4 py-2 rounded-lg text-xs font-black uppercase border italic tracking-tighter ${bolsaDisponibleGlobal < 0 ? 'bg-red-950/40 border-red-900 text-red-400' : 'bg-emerald-950/40 border-emerald-900 text-emerald-400'}`}>
            Remanente Quincena: ${bolsaDisponibleGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <button 
            onClick={() => setModalRegistro(true)} 
            className="bg-sky-400 hover:bg-sky-500 text-slate-950 px-4 py-2 rounded-lg shadow-lg flex items-center text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Registrar Gasto
          </button>
        </div>
      </div>

      {/* METODOS DE PAGO */}
      <div>
        <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Fondos Ejercidos por Cuenta</h3>
        <div className="flex flex-wrap gap-2">
          {listaMetodos.map(metodo => {
            const totalMetodo = gastosPorMetodo[metodo] || 0;
            if (totalMetodo === 0) return null;
            return (
              <div key={metodo} className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 shadow-sm">
                <CreditCard className="w-3 h-3 text-sky-400 mr-2" />
                <span className="text-[9px] font-black uppercase text-zinc-400 mr-2 tracking-tight">{metodo}:</span>
                <span className="text-xs font-black text-slate-100 tabular-nums">${totalMetodo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
      {/* COLUMNA IZQUIERDA: CONTROL DE MACROS (SÓLO CON GASTOS REALES) */}
      <div className="xl:col-span-1 space-y-4">
        <h3 className="text-sm font-black text-slate-50 uppercase italic tracking-tighter">Salud del Presupuesto por Macro</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-h-[600px] overflow-y-auto space-y-3 custom-scrollbar">
          {Object.keys(macroEstructura)
            .filter(macro => macroEstructura[macro].gastado > 0) // 🔥 FILTRO ABSOLUTO: Si el gasto es 0, se destruye del render
            .map(macro => {
              const item = macroEstructura[macro];
              const disponible = item.asignado - item.gastado;
              
              // Cálculo de porcentaje de la barra contra su límite asignado
              const porcentajeBarra = item.asignado > 0 ? (item.gastado / item.asignado) * 100 : 100;
              const estaAbierto = !!macrosAbiertas[macro];

              // =========================================================
              // AJUSTE DE LÓGICA DE ALTO CONTRASTE Y SEMÁFORO REALISTA
              // =========================================================
              const sobregirado = disponible < 0;
              const justoEnElLimite = disponible === 0;

              // Definición táctica del color de la barra
              const colorBarra = sobregirado 
                ? "bg-red-500" 
                : justoEnElLimite 
                  ? "bg-sky-500" // 👈 Si está al límite (ej. 600 de 600), se pinta de un azul limpio de éxito
                  : porcentajeBarra > 85 
                    ? "bg-orange-500" 
                    : "bg-emerald-400";

              // Ajuste del texto de alerta de exceso
              const colorTextoDisponible = sobregirado 
                ? "text-red-400 font-black animate-pulse" 
                : justoEnElLimite
                  ? "text-sky-400 font-bold" // Texto azul limpio si estás en ceros exactos
                  : "text-zinc-400 font-bold";
              return (
                //<div key={macro} className={`rounded border overflow-hidden transition-all duration-200 bg-zinc-950/90 ${sobregirado ? 'border-red-900/60' : 'border-zinc-800'}`}>
                  <div key={macro} className={`rounded border overflow-hidden transition-all duration-200 bg-zinc-950/90 ${sobregirado ? 'border-red-900/60' : 'border-zinc-800'}`}>  
                  {/* Header Macro */}
                  <div 
                    onClick={() => toggleMacro(macro)}
                    className="p-3 flex justify-between items-start select-none cursor-pointer hover:bg-zinc-900/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {estaAbierto ? <ChevronDown className="w-3.5 h-3.5 text-sky-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">{macro}</span>
                        {sobregirado && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </div>
                      <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider pl-5">
                        Asignado: ${item.asignado.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-50 tabular-nums">${item.gastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                      <div className={`text-[9px] uppercase tracking-tighter ${colorTextoDisponible}`}>
                        {sobregirado ? `Exceso: ` : `Disp: `}${Math.abs(disponible).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="px-3 pb-3">
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800/40">
                      <div className={`${colorBarra} h-full transition-all duration-500`} style={{ width: `${Math.min(porcentajeBarra, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* Desglose Sub-rubros */}
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
        {/* COLUMNA DERECHA: TABLA HISTORIAL */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-50 uppercase italic tracking-tighter">Bitácora de Huella Financiera</h3>
          <div className="bg-zinc-900 shadow-2xl rounded-xl overflow-hidden border border-zinc-800">
            <div className="overflow-x-auto">
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
                  {transacciones.length > 0 ? transacciones.map((t, idx) => {
                    const rubro = t.Rubro || t.rubro || "Extras";
                    const macro = mapaRubrosAMacro[rubro] || "Extras";
                    const importeCrudo = t.Importe || t.importe || "0";
                    const importeLimpio = parseFloat(importeCrudo.toString().replace(/[$,\s\-]/g, '')) || 0;

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4">
                          <div className="text-xs font-black text-slate-100 uppercase tracking-tight leading-tight">{t.Descripción || t.descripcion}</div>
                          <div className="text-[8px] font-bold text-zinc-500 mt-0.5 tracking-widest">{t.Fecha || t.fecha}</div>
                        </td>
                        <td className="p-4 text-[10px] font-black text-zinc-300 uppercase tracking-tight">{macro}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-950 border border-zinc-800 text-sky-400 italic">
                            {rubro}
                          </span>
                        </td>
                        <td className="p-4 text-right text-xs font-black text-red-400 tabular-nums">
                          -${importeLimpio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-zinc-600 font-bold uppercase text-xs">Cero registros vinculados en Google Sheets</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE REGISTRO */}
      {modalRegistro && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left border border-zinc-800 border-t-8 border-t-sky-400">
            <div className="bg-zinc-950 p-4 text-slate-50 font-black uppercase text-[10px] tracking-widest flex justify-between border-b border-zinc-800">
              Inyectar Registro Financiero
              <button onClick={() => setModalRegistro(false)} className="cursor-pointer text-zinc-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={ejecutarGuardar} className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Descripción / Destino</label>
                <input 
                  type="text" required placeholder="Ej. LIQUIDACIÓN DE SERVICIO" value={form.descripcion}
                  onChange={(e) => setForm(prev => ({...prev, descripcion: e.target.value}))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-slate-50 uppercase outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Importe ($)</label>
                <input 
                  type="number" step="0.01" required placeholder="0.00" value={form.importe}
                  onChange={(e) => setForm(prev => ({...prev, importe: e.target.value}))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold text-slate-50 uppercase outline-none focus:border-sky-400 tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Sub-Rubro Especifico</label>
                  <select 
                    value={form.rubro}
                    onChange={(e) => setForm(prev => ({...prev, rubro: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-bold text-slate-50 uppercase outline-none focus:border-sky-400 cursor-pointer"
                  >
                    {listaRubros.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">Canal Financiero</label>
                  <select 
                    value={form.metodo_pago}
                    onChange={(e) => setForm(prev => ({...prev, metodo_pago: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-bold text-slate-50 uppercase outline-none focus:border-sky-400 cursor-pointer"
                  >
                    {listaMetodos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit" disabled={guardando}
                className="w-full bg-sky-400 hover:bg-sky-500 text-slate-950 py-3 rounded-lg text-[10px] font-black uppercase shadow-lg cursor-pointer disabled:opacity-50 transition-all pt-4"
              >
                {guardando ? 'Sincronizando con Google Sheets...' : 'Ejecutar Transacción'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}