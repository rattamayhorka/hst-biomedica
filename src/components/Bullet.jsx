import { useEffect, useState, useRef } from 'react';
import { database } from '../api'; // Usa tu API existente
import { Send, Terminal, Database, Loader2, Sparkles, Trash2, Edit2, X, Columns3 } from 'lucide-react';

// =========================================================================
// 🎛️ PARSER DE SINTAXIS BULLET JOURNAL (Rapid Logging)
// =========================================================================
const parsearLineaTerminal = (texto) => {
  const t = texto.trim();

  if (t.startsWith('$')) {
    const sinSimbolo = t.substring(1).trim();
    const partes = sinSimbolo.split(',');
    const concepto = partes[0] || 'Gasto sin concepto';
    const monto = partes[1] ? `$${partes[1].trim()}` : '$0.00';
    return {
      tipo: 'finanzas',
      icono: '💸',
      colorClase: 'text-emerald-400 font-mono font-bold',
      formateado: `[FINANZAS] > ${concepto} : ${monto}`
    };
  } else if (t.startsWith('-')) {
    const contenido = t.substring(1).trim();
    return {
      tipo: 'nota',
      icono: '📝',
      colorClase: 'text-zinc-400 italic',
      formateado: `[NOTA] >> ${contenido}`
    };
  } else if (t.startsWith('.')) {
    const contenido = t.substring(1).trim();
    return {
      tipo: 'tarea',
      icono: '⚡',
      colorClase: 'text-sky-400 font-semibold',
      formateado: `[PENDIENTE] . ${contenido}`
    };
  } else if (t.startsWith('#')) {
    const contenidoCompleto = t.substring(1).trim();
    let limpio = contenidoCompleto;
    let horaExtraida = "";

    if (contenidoCompleto.includes(';')) {
      const partes = contenidoCompleto.split(';');
      limpio = partes[0].trim();
      horaExtraida = partes[1].trim();
    }

    return {
      tipo: 'evento',
      icono: '📅',
      colorClase: 'text-fuchsia-400 font-bold',
      formateado: `[EVENTO] # ${limpio} ${horaExtraida ? `[Hora: ${horaExtraida}]` : ''}`
    };
  }

  return {
    tipo: 'plano',
    icono: '›',
    colorClase: 'text-amber-200/90',
    formateado: t
  };
};

export default function Bullet({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [nuevoComando, setNuevoComando] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  
  // ✏️ Estados para control de Edición In-Place
  const [modoEdicion, setModoEdicion] = useState(false);
  const [notaAEditar, setNotaAEditar] = useState(null);

  const bottomTerminalRef = useRef(null);
  const textareaRef = useRef(null);

  const cargarHistoricoTerminal = async () => {
    setCargando(true);
    try {
      const data = await database.obtenerSeccion('pendientes');
      
      const logsFiltrados = data.filter(item => {
        const statusLower = (item.Status || '').trim().toLowerCase();
        return statusLower === 'bullet';
      });

      const parseados = logsFiltrados.map((item, idx) => {
        const textoOriginal = item.Tarea || "";
        const fecha = item.Fecha || "---";
        const hora = item.Hora || "";
        
        let stringDeAnalisis = textoOriginal;
        if (hora) {
          stringDeAnalisis = `${textoOriginal}; ${hora}`;
        }

        const analisis = parsearLineaTerminal(stringDeAnalisis);

        return {
          id: idx,
          textoOriginal,
          fecha,
          ...analisis
        };
      });

      setLogs(parseados);
    } catch (e) {
      console.error("Error al sincronizar con la terminal:", e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistoricoTerminal();
  }, [refreshTrigger]);

  useEffect(() => {
    bottomTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 📐 Ajustar altura de la caja de texto dinámicamente al escribir
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [nuevoComando]);

  const enviarComandoTerminal = async () => {
    if (!nuevoComando.trim() || enviando) return;

    setEnviando(true);
    const comandoCrudo = nuevoComando.trim();
    const analisis = parsearLineaTerminal(comandoCrudo);

    const hoy = new Date();
    const fechaFormateada = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    try {
      if (modoEdicion && notaAEditar) {
        await database.guardarDatos('modificarTarea', {
          datos: {
            tareaOriginal: notaAEditar.textoOriginal,
            nuevaTarea: comandoCrudo,
            nuevoStatus: 'Bullet',
            nuevaFecha: fechaFormateada,
            nuevoTipo: 'BulletJournal'
          }
        });
        
        setLogs(prev => prev.map(item => 
          item.textoOriginal === notaAEditar.textoOriginal 
            ? { ...item, textoOriginal: comandoCrudo, ...analisis } 
            : item
        ));
        cancelarEdicion();
      } else {
        const nuevoLogOptimo = {
          id: Date.now(),
          textoOriginal: comandoCrudo,
          fecha: fechaFormateada,
          ...analisis
        };
        setLogs(prev => [...prev, nuevoLogOptimo]);

        await database.guardarDatos('guardarTarea', {
          datos: {
            tarea: comandoCrudo,
            status: 'Bullet', 
            fecha: fechaFormateada,
            tipo: 'BulletJournal'
          }
        });
      }
      setNuevoComando('');
    } catch (err) {
      console.error("Error al enviar comando:", err);
    } finally {
      setEnviando(false);
    }
  };

  // 📋 ENVIAR TAREA AL KANBAN (Cambia status 'Bullet' a 'Por Hacer')
  const enviarAKanban = async (item) => {
    // 1. Remoción visual optimista inmediata
    setLogs(prev => prev.filter(l => l.textoOriginal !== item.textoOriginal));

    try {
      // Usamos el endpoint existente en tu doPost
      await database.guardarDatos('statusKanban', {
        tareaTexto: item.textoOriginal,
        nuevoStatus: 'Por Hacer',
        nuevoTipo: 'Trabajo' // Tipo Trabajo por defecto para el kanban
      });
    } catch (err) {
      console.error("Error al transferir al Kanban:", err);
    }
  };

  const eliminarNota = async (item) => {
    if (!window.confirm("¿Seguro que deseas eliminar este log?")) return;
    
    setLogs(prev => prev.filter(l => l.textoOriginal !== item.textoOriginal));

    try {
      await database.guardarDatos('statusKanban', {
        tareaTexto: item.textoOriginal,
        nuevoStatus: 'Terminado'
      });
    } catch (err) {
      console.error("Error al archivar/eliminar:", err);
    }
  };

  const iniciarEdicion = (item) => {
    setModoEdicion(true);
    setNotaAEditar(item);
    setNuevoComando(item.textoOriginal);
    textareaRef.current?.focus();
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setNotaAEditar(null);
    setNuevoComando('');
  };

  const manejarTeclado = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      enviarComandoTerminal();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] w-full bg-zinc-950 font-mono text-xs text-zinc-300 rounded-2xl border border-zinc-900 overflow-hidden shadow-xl">
      
      {/* 📊 BARRA DE ESTADO SUPERIOR */}
      <div className="flex-shrink-0 bg-zinc-900/40 border-b border-zinc-900 select-none px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-black tracking-widest text-[9px] text-zinc-500">CORE://RAPID_LOG</span>
        </div>

        <div className="flex items-center gap-3 text-[9px] text-zinc-650">
          <span><b className="text-emerald-400">$</b> Finanzas</span>
          <span><b className="text-zinc-400">-</b> Nota</span>
          <span><b className="text-sky-400">.</b> Tarea</span>
          <span><b className="text-fuchsia-400">#</b> Evento</span>
          <span className="text-zinc-800">|</span>
          <span className="flex items-center gap-1 text-[8px] text-zinc-650">
            <Database className="w-2.5 h-2.5 text-emerald-600" />
            SYNCED
          </span>
        </div>
      </div>

      {/* 📺 SCREEN DE LOGS */}
      <div className="flex-1 overflow-y-auto bg-black/95 scrollbar-none px-4 py-4 space-y-2">
        {cargando ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            <span className="text-[9px] uppercase tracking-widest font-bold">Cargando bitácora activa...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-1 italic">
            <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
            <p>La consola de Rapid Logging está vacía.</p>
          </div>
        ) : (
          logs.map((item, idx) => {
            const mostrarSeparador = idx === 0 || logs[idx - 1].fecha !== item.fecha;

            return (
              <div key={idx} className="space-y-2">
                {mostrarSeparador && (
                  <div className="flex items-center gap-2 pt-3 pb-1 select-none">
                    <span className="text-amber-500/80 font-bold tracking-widest text-[9px]">
                      DATE://{item.fecha}
                    </span>
                    <div className="flex-1 border-b border-dashed border-zinc-900" />
                  </div>
                )}
                
                <div className="group flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 py-0.5 border-b border-zinc-900/10 hover:bg-zinc-900/20 px-3 rounded transition-all relative">
                  <div className="flex items-start gap-2.5 flex-1 pr-24">
                    <span className="text-zinc-700 select-none text-[9px] mt-0.5">{item.icono}</span>
                    <div className={`${item.colorClase} break-all whitespace-pre-wrap leading-relaxed`}>
                      {item.formateado}
                    </div>
                  </div>

                  {/* Controles del Hover */}
                  <div className="flex items-center gap-3 text-[8px] text-zinc-700 font-mono select-none flex-shrink-0 self-end sm:self-auto">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-all mr-1">
                      
                      {/* Botón dinámico para enviar al Kanban (solo se muestra si es tipo 'tarea') */}
                      {item.tipo === 'tarea' && (
                        <button 
                          onClick={() => enviarAKanban(item)}
                          className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900 rounded cursor-pointer flex items-center gap-1"
                          title="Mandar al Kanban como Por Hacer"
                        >
                          <Columns3 className="w-3 h-3" />
                          <span className="text-[7px] uppercase font-bold">A Kanban</span>
                        </button>
                      )}

                      <button 
                        onClick={() => iniciarEdicion(item)}
                        className="p-1 text-zinc-500 hover:text-sky-400 hover:bg-zinc-900 rounded cursor-pointer"
                        title="Editar nota en prompt"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => eliminarNota(item)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded cursor-pointer"
                        title="Eliminar de Sheets"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="uppercase">{item.tipo === 'evento' && item.hora ? `[${item.hora}]` : `[*]` }</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomTerminalRef} />
      </div>

      {/* 📥 CHAT INPUT BOTTOM */}
      <div className="flex-shrink-0 bg-zinc-950 border-t border-zinc-900/50 p-3">
        {modoEdicion && (
          <div className="flex items-center justify-between bg-yellow-950/20 border border-yellow-900/30 rounded-lg px-3 py-1 mb-2 text-[10px] text-yellow-400 font-mono">
            <span>✏️ Editando registro anterior. Los cambios reemplazarán la línea seleccionada.</span>
            <button onClick={cancelarEdicion} className="text-yellow-600 hover:text-yellow-400 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className={`flex-1 border rounded-lg p-2 transition-all flex items-start ${modoEdicion ? 'bg-yellow-950/5 border-yellow-900/50 focus-within:border-yellow-500/50' : 'bg-zinc-900/25 border-zinc-900 focus-within:border-zinc-850'}`}>
            <span className={`font-black select-none mr-2 mt-0.5 ${modoEdicion ? 'text-yellow-400' : 'text-sky-400'}`}>
              {modoEdicion ? 'edit:~#' : 'bunker:~#'}
            </span>
            
            <textarea
              ref={textareaRef}
              rows={1}
              value={nuevoComando}
              onChange={(e) => setNuevoComando(e.target.value)}
              onKeyDown={manejarTeclado}
              placeholder={modoEdicion ? "Modifica el comando y presiona Ctrl + Enter..." : "Escribe... ($ gasto,monto / . tarea / - nota / # evento) [Ctrl+Enter]"}
              className="flex-1 bg-transparent resize-none outline-none border-none text-zinc-100 placeholder-zinc-800 font-mono text-xs leading-relaxed min-h-[18px] max-h-[180px] mt-0.5"
              disabled={enviando}
              style={{ overflowY: 'auto' }}
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {modoEdicion && (
              <button
                onClick={cancelarEdicion}
                className="bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300 border border-zinc-800 p-2.5 rounded-lg h-9 w-9 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
            
            <button
              onClick={enviarComandoTerminal}
              disabled={!nuevoComando.trim() || enviando}
              className={`border p-2.5 rounded-lg transition-all h-9 w-9 flex items-center justify-center cursor-pointer ${modoEdicion ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-700 text-zinc-950' : 'bg-zinc-900 hover:bg-zinc-805 text-sky-400 border-zinc-800 hover:border-sky-500/20'}`}
              title={modoEdicion ? "Guardar cambios" : "Enviar (Ctrl + Enter)"}
            >
              {enviando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 stroke-[2]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}