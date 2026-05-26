import { useEffect, useState } from 'react';
import { database } from '../api';
import { Plus, Calendar, Clock, CheckCircle2, X } from 'lucide-react';

export default function Kanban() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para controlar los Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

  // Estados para los campos de los formularios
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [editTareaTexto, setEditTareaTexto] = useState('');
  const [editStatus, setEditStatus] = useState('Por Hacer');
  const [guardando, setGuardando] = useState(false);

  const cargarTareas = async () => {
    setCargando(true);
    const data = await database.obtenerSeccion('pendientes');
    setTareas(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  // LÓGICA DEL ARRASTRE
  const manejarDragStart = (e, tareaTexto) => {
    e.dataTransfer.setData('texto-tarea', tareaTexto);
  };

  const manejarDrop = async (e, nuevoStatus) => {
    e.preventDefault();
    const tareaTexto = e.dataTransfer.getData('texto-tarea');
    if (!tareaTexto) return;

    setTareas(prev => prev.map(t => 
      t.Tarea === tareaTexto ? { ...t, Status: nuevoStatus } : t
    ));

    await database.guardarDatos('statusKanban', { tareaTexto, nuevoStatus });
  };

  // GUARDAR NUEVA TAREA
  const ejecutarGuardarTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTareaTexto.trim()) return;

    setGuardando(true);
    const hoy = new Date();
    const fechaFormateada = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    const datos = {
      tarea: nuevaTareaTexto.trim(),
      status: "Por Hacer",
      fecha: fechaFormateada
    };

    // Actualización optimista local
    setTareas(prev => [...prev, { Tarea: datos.tarea, Status: datos.status, Fecha: datos.fecha }]);
    setNuevaTareaTexto('');
    setMostrarModalNuevo(false);
    setGuardando(false);

    // Guardado real en Sheets
    await database.guardarDatos('guardarTarea', { datos });
  };

  // GUARDAR MODIFICACIÓN DE TAREA (AL HACER CLIC)
  const ejecutarModificarTarea = async (e) => {
    e.preventDefault();
    if (!editTareaTexto.trim() || !tareaSeleccionada) return;

    setGuardando(true);

    // Modificamos localmente el estado
    setTareas(prev => prev.map(t => 
      t.Tarea === tareaSeleccionada.Tarea 
        ? { ...t, Tarea: editTareaTexto.trim(), Status: editStatus } 
        : t
    ));

    const tareaOriginal = tareaSeleccionada.Tarea;
    const nuevaTarea = editTareaTexto.trim();
    const nuevoStatus = editStatus;

    setMostrarModalEditar(false);
    setTareaSeleccionada(null);
    setGuardando(false);

    // Modificamos en Sheets
    await database.guardarDatos('modificarTarea', { tareaOriginal, nuevaTarea, nuevoStatus });
  };

  // FUNCIÓN PARA ARCHIVAR TAREA (QUITAR DEL TABLERO PERO DEJAR EN SPREADSHEET)
  const ejecutarArchivarTarea = async () => {
    if (!tareaSeleccionada) return;

    setGuardando(true);
    const tareaTexto = tareaSeleccionada.Tarea;
    const nuevoStatus = "Terminado"; // Estatus de archivo

    // 1. Lo removemos de la pantalla inmediatamente
    setTareas(prev => prev.filter(t => t.Tarea !== tareaTexto));
    
    setMostrarModalEditar(false);
    setTareaSeleccionada(null);
    setGuardando(false);

    // 2. Mandamos la actualización a la columna Status en Sheets
    await database.guardarDatos('statusKanban', { tareaTexto, nuevoStatus });
  };

  const abrirModalEdicion = (task) => {
    setTareaSeleccionada(task);
    setEditTareaTexto(task.Tarea);
    setEditStatus(task.Status || 'Por Hacer');
    setMostrarModalEditar(true);
  };

  const filtrarPorColumna = (status) => {
    return tareas.filter(t => (t.Status || "").toLowerCase().trim() === status.toLowerCase());
  };

  if (cargando) {
    return <p class="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left">Sincronizando tablero con Google Sheets...</p>;
  }

  return (
    <div class="space-y-6 text-left relative">
      
      <div class="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 class="text-2xl font-black text-violet-400 tracking-tighter uppercase italic">Tablero Kanban</h2>
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Pendientes de la Jornada | Santo Tomás</p>
        </div>
        <button 
          onClick={() => setMostrarModalNuevo(true)}
          class="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg shadow-violet-950/20 transition-all cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5 mr-1" /> Nueva Tarea
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => manejarDrop(e, 'Por Hacer')} class="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-2xl min-h-[450px]">
          <h3 class="text-xs font-black uppercase text-slate-400 mb-4 flex items-center tracking-wider italic"><Clock class="w-3.5 h-3.5 mr-2 text-slate-500" /> Por Hacer</h3>
          <div class="space-y-3">
            {filtrarPorColumna('Por Hacer').map((task, i) => (
              <Tarjeta key={i} task={task} onDragStart={manejarDragStart} onClick={() => abrirModalEdicion(task)} borderClass="border-l-zinc-700" />
            ))}
          </div>
        </div>

        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => manejarDrop(e, 'En Proceso')} class="bg-blue-950/10 border border-blue-950/40 p-4 rounded-2xl min-h-[450px]">
          <h3 class="text-xs font-black uppercase text-blue-400 mb-4 flex items-center tracking-wider italic"><Activity class="w-3.5 h-3.5 mr-2 text-blue-500" /> En Proceso</h3>
          <div class="space-y-3">
            {filtrarPorColumna('En Proceso').map((task, i) => (
              <Tarjeta key={i} task={task} onDragStart={manejarDragStart} onClick={() => abrirModalEdicion(task)} borderClass="border-l-blue-500" />
            ))}
          </div>
        </div>

        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => manejarDrop(e, 'Hecho')} class="bg-emerald-950/10 border border-emerald-950/30 p-4 rounded-2xl min-h-[450px]">
          <h3 class="text-xs font-black uppercase text-emerald-400 mb-4 flex items-center tracking-wider italic"><CheckCircle2 class="w-3.5 h-3.5 mr-2 text-emerald-500" /> Hecho</h3>
          <div class="space-y-3">
            {filtrarPorColumna('Hecho').map((task, i) => (
              <Tarjeta key={i} task={task} onDragStart={manejarDragStart} onClick={() => abrirModalEdicion(task)} borderClass="border-l-emerald-500" />
            ))}
          </div>
        </div>

      </div>

      {mostrarModalNuevo && (
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-left">
            <div class="bg-zinc-800 p-4 text-slate-200 font-black uppercase text-[10px] tracking-widest flex justify-between items-center border-b border-zinc-700/50">
              <span>Nueva Tarea</span>
              <button onClick={() => setMostrarModalNuevo(false)} class="text-slate-400 hover:text-slate-200 cursor-pointer"><X class="w-4 h-4" /></button>
            </div>
            <form onSubmit={ejecutarGuardarTarea} class="p-6">
              <label class="block text-[9px] font-black uppercase text-slate-500 mb-2">Descripción</label>
              <input 
                type="text" 
                required
                value={nuevaTareaTexto}
                onChange={(e) => setNuevaTareaTexto(e.target.value)}
                placeholder="Ej. Revisar desfibrilador de urgencias" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-bold uppercase outline-none text-slate-200 focus:border-violet-600 mb-6"
              />
              <button 
                type="submit" 
                disabled={guardando}
                class="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg text-[10px] font-black uppercase shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {guardando ? 'Guardando...' : 'Agregar Tarea'}
              </button>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEditar && (
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-left border-t-4 border-t-violet-600">
            <form onSubmit={ejecutarModificarTarea} class="p-6">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-black text-slate-200 uppercase tracking-tighter italic">Editar Tarea</h4>
                <button type="button" onClick={() => setMostrarModalEditar(false)} class="text-slate-500 hover:text-slate-300 cursor-pointer"><X class="w-4 h-4" /></button>
              </div>
              
              <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Descripción de la Tarea</label>
              <input 
                type="text" 
                required
                value={editTareaTexto}
                onChange={(e) => setEditTareaTexto(e.target.value)}
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-bold uppercase outline-none text-slate-200 focus:border-violet-600 mb-4"
              />
              
              <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Estatus actual</label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-bold uppercase outline-none text-slate-300 focus:border-violet-600 mb-6"
              >
                <option value="Por Hacer">Por Hacer</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Hecho">Hecho</option>
              </select>

              <div class="flex flex-col gap-2">
                <button 
                  type="submit" 
                  disabled={guardando}
                  class="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg text-[10px] font-black uppercase shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>

                <div class="flex gap-2 mt-1">
                  <button 
                    type="button"
                    disabled={guardando}
                    onClick={ejecutarArchivarTarea}
                    class="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-emerald-400 py-2.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 class="w-3 h-3 text-emerald-400" /> Archivar
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setMostrarModalEditar(false)} 
                    class="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function Tarjeta({ task, onDragStart, onClick, borderClass }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.Tarea)}
      onClick={onClick}
      class={`bg-zinc-900 border border-zinc-800 border-l-4 ${borderClass} p-3 rounded-xl shadow-md cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-all group`}
    >
      <p class="text-[11px] font-bold text-slate-200 uppercase leading-snug tracking-tight pointer-events-none">
        {task.Tarea || 'SIN DESCRIPCIÓN'}
      </p>
      <div class="flex items-center text-slate-500 font-bold italic text-[8px] mt-3 tracking-widest uppercase pointer-events-none">
        <Calendar class="w-2.5 h-2.5 mr-1 text-zinc-600" />
        {task.Fecha || '---'}
      </div>
    </div>
  );
}

function Activity(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}