import { useState } from 'react';
import { database } from '../api';
import { CheckCircle2, AlertCircle, ArrowLeft, Terminal, Send, Database } from 'lucide-react';

// =========================================================================
// 🎛️ PARSER LOCAL PARA PREVISUALIZAR EL TIPO DE BULLET MIENTRAS ESCRIBES
// =========================================================================
const parsearSintaxis = (texto) => {
  const t = texto.trim();
  if (t.startsWith('$')) return { tipo: 'FINANZAS', icono: '💸', color: 'text-emerald-400' };
  if (t.startsWith('-')) return { tipo: 'NOTA', icono: '📝', color: 'text-zinc-400' };
  if (t.startsWith('.')) return { tipo: 'TAREA', icono: '⚡', color: 'text-sky-400' };
  if (t.startsWith('#')) return { tipo: 'EVENTO', icono: '📅', color: 'text-fuchsia-400' };
  return { tipo: 'REGISTRO PLANO', icono: '›', color: 'text-amber-200/90' };
};

export default function RegistroRapido() {
  const [texto, setTexto] = useState('');
  
  // 🔴 ANTES: Se usaba este estado para el switch de entorno (Hospital / Casa)
  // const [destino, setDestino] = useState('hospital'); 

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const deteccion = parsearSintaxis(texto);

  const ejecutarGuardado = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;

    setGuardando(true);
    setMensaje(null);

    const hoy = new Date();
    const fechaFormateada = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    // =========================================================================
    // 🔴 REGISTRO ANTERIOR (ENVIABA CON SELECTOR DE ENTORNO TRABAJO/CASA)
    // =========================================================================
    /*
    const tipoColumna = destino === 'hospital' ? 'Trabajo' : 'Casa';
    const payload = {
      tarea: texto.trim().toUpperCase(),
      status: "Por Hacer",
      fecha: fechaFormateada,
      tipo: tipoColumna
    };
    */

    // =========================================================================
    // 🟢 NUEVO REGISTRO TERMINAL BULLET (SINTAXIS DIRECTA CON STATUS BULLET)
    // =========================================================================
    const payload = {
      tarea: texto.trim(), // Respetamos minusculas/mayusculas para sintaxis exacta
      status: "Bullet",
      fecha: fechaFormateada,
      tipo: "BulletJournal"
    };

    try {
      await database.guardarDatos('guardarTarea', { datos: payload });
      
      setMensaje({ 
        tipo: 'success', 
        texto: `LOG [${deteccion.tipo}] REGISTRADO EN BULLET` 
      });
      setTexto(''); 
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'ERR_NET_UNREACHABLE: No se pudo registrar' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* 📊 BARRA DE ESTADO SUPERIOR TIPO TERMINAL */}
        <div className="bg-zinc-900/60 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span className="font-black text-[10px] tracking-widest text-zinc-400 uppercase">RAPID_LOG://TERMINAL</span>
          </div>
          <div className="flex items-center gap-1.5 text-[8px] text-emerald-500 font-bold tracking-widest">
            <Database className="w-3 h-3" />
            ONLINE
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 💡 LEYENDA DE SINTAXIS RÁPIDA */}
          <div className="grid grid-cols-4 gap-1.5 text-[8px] font-bold text-center bg-zinc-900/30 p-2 rounded-xl border border-zinc-900/80">
            <div className="text-emerald-400 bg-emerald-950/20 py-1 rounded"><b className="text-emerald-300">$</b> Gasto</div>
            <div className="text-zinc-400 bg-zinc-900/40 py-1 rounded"><b className="text-zinc-200">-</b> Nota</div>
            <div className="text-sky-400 bg-sky-950/20 py-1 rounded"><b className="text-sky-300">.</b> Tarea</div>
            <div className="text-fuchsia-400 bg-fuchsia-950/20 py-1 rounded"><b className="text-fuchsia-300">#</b> Evento</div>
          </div>

          {/* 🔴 SECCIÓN OBSOLETA DEL SWITCH TRABAJO/CASA (COMENTADA) */}
          {/*
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
          */}

          <form onSubmit={ejecutarGuardado} className="space-y-4">
            {/* INPUT ESTILO PROMPT DE TERMINAL */}
            <div>
              <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-500 mb-1.5 px-1">
                <span>COMANDO / INPUT</span>
                {texto && (
                  <span className={`flex items-center gap-1 font-bold ${deteccion.color}`}>
                    <span>{deteccion.icono}</span> {deteccion.tipo}
                  </span>
                )}
              </div>
              
              <div className="bg-zinc-900/40 border border-zinc-800 focus-within:border-sky-500/50 rounded-xl p-3 flex items-start gap-2.5 transition-all">
                <span className="text-sky-400 font-bold select-none text-xs">bunker:~#</span>
                <textarea
                  rows={2}
                  autoFocus
                  required
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    if (mensaje) setMensaje(null);
                  }}
                  placeholder="Escribe... ($ gasto,monto / . tarea / - nota / # evento)"
                  className="w-full bg-transparent resize-none outline-none text-xs font-mono text-zinc-100 placeholder-zinc-700 leading-relaxed"
                />
              </div>
            </div>

            {/* BOTÓN SUBMIT DE TERMINAL */}
            <button 
              type="submit"
              disabled={guardando || !texto.trim()}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-30 disabled:hover:bg-sky-500 text-zinc-950 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 stroke-[3]" />
              {guardando ? 'EXECUTING...' : 'EJECUTAR LOG'}
            </button>
          </form>

          {/* NOTIFICACIÓN TIPO CONSOLA */}
          {mensaje && (
            <div className={`p-3 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider border ${
              mensaje.tipo === 'success' 
                ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' 
                : 'bg-rose-950/20 border-rose-900/50 text-rose-400'
            }`}>
              {mensaje.tipo === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {mensaje.texto}
            </div>
          )}

          {/* NAVEGACIÓN PANEL COMPLETO */}
          <div className="text-center pt-2 border-t border-zinc-900">
            <a href="/" className="text-[9px] text-zinc-600 hover:text-sky-400 uppercase tracking-widest transition-colors font-bold inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" /> Volver al Panel Principal
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}