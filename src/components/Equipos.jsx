import { useEffect, useState } from 'react';
import { database } from '../api';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Equipos() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDisponibilidad = async () => {
    setCargando(true);
    const data = await database.obtenerSeccion('equipos');
    setInventario(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarDisponibilidad();
  }, []);

  if (cargando) {
    return <p className="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left p-4">Descargando estatus de equipos...</p>;
  }

  const determinarSalaEnglobada = (item) => {
    const ub = (item.Ubicacion || item.Servicio || "").trim().toUpperCase();
    if (ub.includes("SALA") || ub.includes("QUIROFANO") || ub.includes("QUIRÓFANO") || ub.includes("TOCO")) {
      return (item.Ubicacion || item.Servicio || "").trim();
    }
    return null;
  };

  const equiposSalas = inventario.filter(item => determinarSalaEnglobada(item) !== null);
  const equiposSeparados = inventario.filter(item => determinarSalaEnglobada(item) === null);

  const salasAgrupadas = equiposSalas.reduce((acc, item) => {
    const salaNombre = determinarSalaEnglobada(item);
    if (!acc[salaNombre]) acc[salaNombre] = [];
    acc[salaNombre].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 text-left">
      
      {/* Encabezado */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-black text-blue-400 tracking-tighter uppercase italic">Disponibilidad de Equipos</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Monitoreo de Operatividad | Santo Tomás</p>
      </div>

      {/* SECCIÓN 1: EQUIPOS SEPARADOS PRIMERO (TARJETAS PEQUEÑAS) */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Unidades Individuales</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {equiposSeparados.map((item, i) => (
            <div 
              key={i} 
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between min-h-[85px]"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-200 tracking-tight leading-tight line-clamp-2">
                  {item.Equipo || item.Nombre}
                </p>
                <span className="text-[8px] font-medium text-zinc-500 block mt-0.5 truncate">
                  {item.Ubicacion || item.Servicio}
                </span>
              </div>
              {/* Esquina inferior limpia: Solo se muestra el estatus semafórico */}
              <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-end">
                <BadgeEstado estado={item.Status} esCompacto={true} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: SALAS ENGLOBADAS ABAJO (SALA 1, SALA 2, TOCO, ETC.) */}
      {Object.keys(salasAgrupadas).length > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-800/40">
          <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Salas Críticas Englobadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(salasAgrupadas).map(([nombreSala, maquinas]) => {
              const maquinasOperativas = maquinas.filter(m => (m.Status || "").trim().toUpperCase() === 'OPERATIVO').length;
              const totalMaquinas = maquinas.length;
              const todoOK = maquinasOperativas === totalMaquinas;

              return (
                <div key={nombreSala} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30">
                      {nombreSala}
                    </span>
                    <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${
                      todoOK ? 'text-emerald-400 bg-emerald-950/30' : 'text-rose-400 bg-rose-950/30 animate-pulse'
                    }`}>
                      {maquinasOperativas}/{totalMaquinas} OPERATIVOS
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {maquinas.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-950/60 p-2 rounded-lg border border-zinc-900 text-xs">
                        <span className="font-bold text-slate-300">{item.Equipo || item.Nombre}</span>
                        <BadgeEstado estado={item.Status} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function BadgeEstado({ estado, esCompacto = false }) {
  const est = (estado || "").trim().toUpperCase();
  const esOperativo = est === 'OPERATIVO';

  if (esCompacto) {
    return (
      <span className={`w-2 h-2 rounded-full ${esOperativo ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse'}`}></span>
    );
  }

  return (
    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
      esOperativo 
        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
        : 'bg-rose-950/40 text-rose-400 border-rose-900/40 animate-pulse'
    }`}>
      {esOperativo ? <CheckCircle2 className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
      {estado || 'FALTA DATA'}
    </span>
  );
}