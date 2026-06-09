import { useState, useEffect } from 'react';
import { database } from '../api'; // Ajusta la ruta según tu proyecto
import { Plus, CheckCircle, Clock } from 'lucide-react';

export default function PendientesCasa() {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState('');

  const cargarDatos = async () => {
    const res = await database.obtenerSeccion('Pendientes_Casa');
    setTareas(res);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const manejarGuardar = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;

    const objetoTarea = {
      id: "CASA-" + Date.now(),
      tarea: nuevaTarea.toUpperCase(),
      seccion: "LOGÍSTICA",
      responsable: "CASA",
      status: "Por Hacer"
    };

    await database.guardarDatos("guardarTarea_Casa", { datos: objetoTarea });
    setNuevaTarea('');
    cargarDatos(); // Recarga la info limpia
  };

  return (
    <div className="font-mono text-[#cbd5e1] text-left">
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-black text-amber-400 uppercase italic">🏠 CONTROL DE HOGAR: PENDIENTES</h2>
      </div>

      {/* Formulario rápido */}
      <form onSubmit={manejarGuardar} className="mb-6 flex gap-2">
        <input 
          type="text" 
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          placeholder="NUEVO PENDIENTE (EJ: COMPRAR PINTURA)"
          className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-xs uppercase outline-none focus:border-amber-400 text-amber-400"
        />
        <button type="submit" className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 rounded-xl font-black text-xs uppercase cursor-pointer">
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Lista simple adaptada a móvil */}
      <div className="space-y-2">
        {tareas.length === 0 ? (
          <p className="text-xs text-slate-500 italic">[NO HAY LOGS REGISTRADOS]</p>
        ) : (
          tareas.map((t, idx) => (
            <div key={idx} className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold">{t[1] || t.tarea}</span>
              <span className="text-[9px] px-2 py-1 bg-amber-950/40 text-amber-400 border border-amber-900 rounded-md font-black uppercase">
                {t[4] || t.status || 'POR HACER'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}