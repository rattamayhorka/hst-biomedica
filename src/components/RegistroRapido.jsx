import { useState } from 'react';
import { database } from '../api';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function RegistroRapido() {
  const [texto, setTexto] = useState('');
  const [destino, setDestino] = useState('hospital'); // 'hospital' o 'casa'
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const ejecutarGuardado = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;

    setGuardando(true);
    setMensaje(null);

    // Formateo de fecha automático en background (DD/MM/YYYY)
    const hoy = new Date();
    const fechaFormateada = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    const payload = {
      tarea: texto.trim().toUpperCase(),
      status: "Por Hacer",
      fecha: fechaFormateada
    };

    try {
      if (destino === 'hospital') {
        // Pega exacto a tu función original del hospital
        await database.guardarDatos('guardarTarea', { datos: payload });
      } else {
        // Pega a tu función nueva de la casa
        await database.guardarDatos('guardarTarea_Casa', { datos: payload });
      }
      
      setMensaje({ tipo: 'success', texto: 'Registrado correctamente en Sheets' });
      setTexto(''); // Limpia el input para el que sigue
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de red al intentar registrar' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-mono flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#1e293b] border border-[#334155] rounded-2xl p-6 shadow-2xl">
        
        {/* Encabezado */}
        <div className="text-center mb-6 border-b border-[#334155] pb-4">
          <h2 className="text-sm font-black text-[#38bdf8] tracking-widest uppercase">⚡ Rapid LOGGER</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Captura rápida</p>
        </div>

        <form onSubmit={ejecutarGuardado} className="space-y-5">
          {/* Switch de Destino */}
          <div>
            <label className="block text-[9px] font-black uppercase text-slate-500 mb-2">Entorno de Destino</label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button 
                type="button"
                onClick={() => { setDestino('hospital'); setMensaje(null); }}
                className={`py-2.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${destino === 'hospital' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-slate-500'}`}
              >
                🏥 Hospital
              </button>
              <button 
                type="button"
                onClick={() => { setDestino('casa'); setMensaje(null); }}
                className={`py-2.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${destino === 'casa' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/30' : 'text-slate-500'}`}
              >
                🏠 Mi Casa
              </button>
            </div>
          </div>

          {/* Campo de captura */}
          <div>
            <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Anota</label>
            <input 
              type="text"
              required
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={destino === 'hospital' ? 'Ej. PIDE OXIGENO' : 'Ej. COMPRAR TOPOCHICO'}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-bold uppercase outline-none text-slate-200 focus:border-violet-600"
            />
          </div>

          {/* Botón dinámico */}
          <button 
            type="submit"
            disabled={guardando}
            className={`w-full py-3 rounded-lg text-[10px] font-black uppercase shadow-lg tracking-widest disabled:opacity-50 cursor-pointer transition-colors ${
              destino === 'hospital' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            }`}
          >
            {guardando ? 'ENVIANDO...' : 'ENVIAR'}
          </button>
        </form>

        {/* Notificación de éxito/error */}
        {mensaje && (
          <div className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider border ${
            mensaje.tipo === 'success' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-rose-950/30 border-rose-900 text-rose-400'
          }`}>
            {mensaje.tipo === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {mensaje.texto}
          </div>
        )}

        {/* Botón para saltar al dashboard completo */}
        <div className="text-center mt-6 pt-2 border-t border-zinc-800/60">
          <a href="/" className="text-[9px] text-slate-600 hover:text-[#38bdf8] uppercase tracking-widest transition-colors font-bold inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Ver Panel Completo
          </a>
        </div>

      </div>
    </div>
  );
}