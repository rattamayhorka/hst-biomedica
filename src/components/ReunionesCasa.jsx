import { useState, useEffect } from 'react';
import { database } from '../api';
import { Calendar, Trash2 } from 'lucide-react';

export default function ReunionesCasa() {
  const [juntas, setJuntas] = useState([]);

  const cargarDatos = async () => {
    const res = await database.obtenerSeccion('Reuniones_Casa');
    setJuntas(res);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const eliminarJunta = async (comite) => {
    if(confirm(`¿ELIMINAR EVENTO: ${comite}?`)) {
      await database.guardarDatos("eliminarReunion_Casa", { comite: comite });
      cargarDatos();
    }
  };

  return (
    <div className="font-mono text-[#cbd5e1] text-left">
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-black text-amber-400 uppercase italic">📅 LOGÍSTICA DE CASA: CITAS Y REUNIONES</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {juntas.length === 0 ? (
          <p className="text-xs text-slate-500 italic">[AGENDA DE CASA VACÍA]</p>
        ) : (
          juntas.map((j, idx) => (
            <div key={idx} className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl relative overflow-hidden">
              <div className="text-[10px] text-amber-400 font-black mb-1">{j[2]} - {j[3]} HRS</div>
              <h4 className="text-sm font-bold uppercase mb-2 text-slate-100">{j[1]}</h4>
              <p className="text-[11px] text-slate-400">📍 {j[4]}</p>
              
              <button 
                onClick={() => eliminarJunta(j[1])}
                className="absolute top-4 right-4 text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}