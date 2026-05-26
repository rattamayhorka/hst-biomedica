import { useEffect, useState } from 'react';
import { database } from '../api';
import { ShieldAlert, Truck, Gauge, User, Clock, CheckCircle2 } from 'lucide-react';

export default function Gases() {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarGases = async () => {
    try {
      setCargando(true);
      const data = await database.obtenerSeccion('gases');
      
      // CORRECCIÓN CLAVE: Si data ya es un objeto directo, lo asignamos. 
      // Si viene dentro de un arreglo, tomamos la última posición.
      if (data && !Array.isArray(data)) {
        setReporte(data);
      } else if (data && data.length > 0) {
        setReporte(data[data.length - 1]);
      }
    } catch (err) {
      console.error("Fallo al procesar datos de gases:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGases();
  }, []);

  if (cargando) {
    return <p className="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left p-4">Descargando lecturas de la Central de Gases...</p>;
  }

  if (!reporte) {
    return <p className="text-xs font-bold text-zinc-600 uppercase italic text-left p-4">Sin reportes de gases registrados en la base de datos.</p>;
  }

  // Diccionario ajustado con acentos exactos para empatar con tu Sheets
  const mapaNiveles = { 'VACÍO': 0, 'VACIO': 0, '25%': 25, '50%': 50, '75%': 75, 'LLENO': 100 };
  
  const nivelIzquierdo = mapaNiveles[(reporte['Nivel de oxígeno en tanques Dewar [Dewar Izquierdo]'] || 'VACÍO').trim().toUpperCase()] || 0;
  const nivelDerecho = mapaNiveles[(reporte['Nivel de oxígeno en tanques Dewar [Dewar Derecho]'] || 'VACÍO').trim().toUpperCase()] || 0;
  const nivelExtra = mapaNiveles[(reporte['Nivel de oxígeno en tanques Dewar [Dewar Extra]'] || 'VACÍO').trim().toUpperCase()] || 0;
  const nivelTotalSuministro = nivelIzquierdo + nivelDerecho + nivelExtra;

  const tanqueActivoTexto = (reporte['Tanque Dewar activo (dirección a la que apunta la palanca):'] || "").toUpperCase();
  const presionActiva = reporte['Presión en dewar activo (PSI)'] || '0';

  const obtenerColorBarra = (nivel, esActivo) => {
    if (esActivo) {
      if (nivel === 0) return 'bg-rose-600 shadow-rose-600/40';
      if (nivel <= 50) return 'bg-amber-500 shadow-amber-500/40';
      return 'bg-emerald-500 shadow-emerald-500/40';
    }
    return nivel > 50 ? 'bg-emerald-600/20' : 'bg-zinc-800/40';
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Encabezado del Módulo */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-emerald-400 tracking-tighter uppercase italic">Central de Gases Medicinales</h2>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-600" /> REVISIÓN: {reporte['Marca temporal']} ({reporte['horario de revisión?'] || ''})</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3 text-zinc-600" /> REVISÓ: {reporte['Ingeniero que realiza:']}</span>
          </div>
        </div>
      </div>

      {/* Grid General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MONITOREO DE CILINDROS DEWAR */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center tracking-wider italic">
            <Gauge className="w-4 h-4 mr-2 text-emerald-500" /> Monitoreo de Tanques Dewar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 pb-6">
            {['Dewar Izquierdo', 'Dewar Derecho', 'Dewar Extra'].map((d) => {
              const nombreCorto = d.split(' ')[1].toUpperCase(); // IZQUIERDO, DERECHO, EXTRA
              const nivelTextoOriginal = reporte[`Nivel de oxígeno en tanques Dewar [${d}]`] || 'Vacío';
              const nivelNum = mapaNiveles[nivelTextoOriginal.trim().toUpperCase()] || 0;
              const esActivo = tanqueActivoTexto.includes(nombreCorto);

              const colorBarra = obtenerColorBarra(nivelNum, esActivo);
              const bordeContenedor = esActivo ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20 scale-105 bg-zinc-900' : 'border-zinc-800 bg-zinc-950/40';

              return (
                <div key={d} className="flex flex-col items-center">
                  <div className={`relative h-60 w-24 rounded-full border-2 ${bordeContenedor} overflow-hidden flex flex-col-reverse p-1 transition-all duration-500 shadow-inner`}>
                    <div className={`w-full rounded-full transition-all duration-1000 shadow-lg ${colorBarra}`} style={{ height: `${nivelNum || 5}%` }}></div>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 z-10 pointer-events-none">
                      <span className="text-[10px] font-black text-slate-100 tracking-tighter bg-zinc-950/80 px-2 py-0.5 rounded-md border border-zinc-800/60 shadow-sm">{nivelTextoOriginal}</span>
                      {esActivo && (
                        <div className="mt-4 pt-2 border-t border-slate-200/10 text-slate-100 bg-zinc-950/80 px-2 py-1 rounded-md border border-zinc-800/60 shadow-sm">
                          <span className="text-base font-black tracking-tight">{presionActiva}</span>
                          <span className="text-[7px] font-black block tracking-widest text-emerald-400">PSI</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span className={`text-[10px] uppercase mt-4 tracking-wider ${esActivo ? 'text-emerald-400 font-black' : 'text-slate-500 font-bold'}`}>{d}</span>
                  {esActivo ? (
                    <div className="text-[8px] font-black text-emerald-400 border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 rounded-md mt-1 animate-pulse">● ACTIVO</div>
                  ) : (
                    <div className="text-[8px] font-bold text-zinc-600 uppercase mt-1">Reserva</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DE BANCADAS Y ALERTAS DE VACÍOS */}
        <div className="space-y-6">
          
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4 flex className-center tracking-wider italic">
              <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" /> Alerta de Vacíos
            </h3>
            
            <div className="space-y-2">
              {/* Alerta inteligente de Dewars */}
              {nivelTotalSuministro <= 150 && (
                <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-tight italic">Solicitar Carga Dewar ({nivelTotalSuministro / 3}%)</span>
                  <Truck className="w-3.5 h-3.5 animate-bounce" />
                </div>
              )}
              
              <TarjetaAlertaVacio titulo="Tanques Tipo E" valor={reporte['Número de tanques tipo E vacíos']} claseColor="bg-amber-500/10 border-amber-500/20 text-amber-400" />
              <TarjetaAlertaVacio titulo="Todo-en-uno" valor={reporte['Número de tanques todo-en-uno vacíos']} claseColor="bg-rose-500/10 border-rose-500/20 text-rose-400" />
              <TarjetaAlertaVacio titulo="CO2 Vacíos" valor={reporte['Tanques de CO2 [Vacío]']} claseColor="bg-zinc-800/80 border-zinc-700/40 text-slate-400" />
              <TarjetaAlertaVacio titulo="Nitrógeno Vacíos" valor={reporte['Tanques de Nitrógeno [Vacío]']} claseColor="bg-zinc-800/80 border-zinc-700/40 text-slate-400" />
            </div>
          </div>

          {/* RESPALDO (MANIFOLD) */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl text-center">
            <h3 className="text-xs font-black uppercase text-emerald-400 mb-4 tracking-wider italic">Respaldo (Manifold)</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-1">Secc. Izquierda</p>
                <p className="text-lg font-black text-slate-200">{reporte['Presión en sección izquierda de respaldo (PSI)'] || '0'} <small className="text-[9px] text-zinc-500 font-bold font-mono">PSI</small></p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-1">Secc. Derecha</p>
                <p className="text-lg font-black text-slate-200">{reporte['Presión en sección derecha de respaldo (PSI)'] || '0'} <small className="text-[9px] text-zinc-500 font-bold font-mono">PSI</small></p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-800/60 bg-zinc-950/30 p-3 rounded-xl border border-zinc-800/50">
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-wider mb-1">Presión de Salida de Respaldo</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tight">
                {reporte['Presión de salida de respaldo (PSI)'] || '0'} <small className="text-xs italic text-slate-500 font-bold font-mono">PSI</small>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TarjetaAlertaVacio({ titulo, valor, claseColor }) {
  const v = parseInt(valor) || 0;
  if (v <= 0) return null;
  return (
    <div className={`flex justify-between items-center p-3 rounded-xl border shadow-sm ${claseColor}`}>
      <span className="text-[10px] font-black uppercase tracking-tight">{titulo}</span>
      <span className="text-base font-black font-mono leading-none">{v}</span>
    </div>
  );
}