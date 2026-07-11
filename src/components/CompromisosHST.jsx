import { useEffect, useState } from 'react';
import { database } from '../api';
import { AlertTriangle, Calendar, CheckCircle2, User, Filter, X, ExternalLink } from 'lucide-react';

export default function Proyectos() {
  const [acuerdos, setAcuerdos] = useState([]);
  const [acuerdosFiltrados, setAcuerdosFiltrados] = useState([]);
  const [comitesDisponibles, setComitesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  // Control de Modal de Edición
  const [mostrarModal, setMostrarModal] = useState(false);
  const [acuerdoSeleccionado, setAcuerdoSeleccionado] = useState(null);
  const [nuevoStatus, setNuevoStatus] = useState('PENDIENTE');
  const [textoAcuerdoEditado, setTextoAcuerdoEditado] = useState('');
  const [guardando, setGuardando] = useState(false);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cargarAcuerdos = async () => {
    setCargando(true);
    const data = await database.obtenerSeccion('proyectos');
    setAcuerdos(data);
    
    const temasUnicos = [...new Set(data
      .map(item => (item.Tema || "").trim())
      .filter(tema => tema !== "")
    )];
    setComitesDisponibles(temasUnicos);
    setCargando(false);
  };

  useEffect(() => {
    cargarAcuerdos();
  }, []);

  useEffect(() => {
    const datosVisibles = acuerdos.filter(item => (item.Status || "").trim().toUpperCase() !== 'TERMINADO');

    if (filtroActivo === 'Todos') {
      setAcuerdosFiltrados(datosVisibles);
    } else {
      setAcuerdosFiltrados(datosVisibles.filter(item => 
        (item.Tema || "").trim().toUpperCase() === filtroActivo.toUpperCase()
      ));
    }
  }, [acuerdos, filtroActivo]);

  const parseFecha = (str) => {
    if (!str || !str.includes('/')) return new Date(2099, 1, 1);
    const p = str.split('/');
    return new Date(p[2], p[1] - 1, p[0]);
  };

  const abrirEdicion = (item) => {
    setAcuerdoSeleccionado(item);
    setNuevoStatus(item.Status || 'PENDIENTE');
    setTextoAcuerdoEditado(item.Acciones || '');
    setMostrarModal(true);
  };

  const ejecutarActualizarEstatus = async (e) => {
    e.preventDefault();
    if (!acuerdoSeleccionado) return;

    setGuardando(true);
    const textoOriginalCelda = acuerdoSeleccionado.Acciones; 

    setAcuerdos(prev => prev.map(item => 
      item.Acciones === textoOriginalCelda 
        ? { ...item, Acciones: textoAcuerdoEditado, Status: nuevoStatus } 
        : item
    ));

    try {
      await database.guardarDatos('modificarProyecto', { 
        tareaOriginal: textoOriginalCelda, 
        nuevaTarea: textoAcuerdoEditado, 
        nuevoStatus: nuevoStatus
      });
    } catch (error) {
      console.error("Error al sincronizar con Sheets:", error);
    }

    setMostrarModal(false);
    setAcuerdoSeleccionado(null);
    setGuardando(false);
  };

  const obtenerCriticos = () => {
    return acuerdosFiltrados.filter(item => {
      const fVal = parseFecha(item['Fecha compromiso']);
      const statusUpper = (item.Status || "").trim().toUpperCase();
      return fVal <= hoy && statusUpper !== 'HECHO';
    });
  };

  const obtenerProximos = () => {
    return acuerdosFiltrados.filter(item => {
      const fVal = parseFecha(item['Fecha compromiso']);
      const statusUpper = (item.Status || "").trim().toUpperCase();
      return fVal > hoy && statusUpper !== 'HECHO';
    });
  };

  const obtenerHistorial = () => {
    return acuerdosFiltrados.filter(item => (item.Status || "").trim().toUpperCase() === 'HECHO');
  };

  if (cargando) {
    return <p class="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left">Actualizando...</p>;
  }

  const totalCriticosGeneral = acuerdos.filter(item => {
    const fVal = parseFecha(item['Fecha compromiso']);
    const statusUpper = (item.Status || "").trim().toUpperCase();
    return fVal <= hoy && statusUpper !== 'HECHO' && statusUpper !== 'TERMINADO';
  }).length;

  return (
    <div class="space-y-6 text-left relative">
      
      {/* Encabezado */}
      <div class="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 class="text-2xl font-black text-blue-400 tracking-tighter uppercase italic">Seguimiento de Minutas</h2>
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Dashboard de Acuerdos Ejecutivos | Santo Tomás</p>
        </div>
        <div class={`px-4 py-2 rounded-xl text-xs font-black uppercase italic tracking-tighter text-white ${totalCriticosGeneral > 0 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`}>
          {totalCriticosGeneral} Pendientes Vencidos
        </div>
      </div>

      {/* Filtros */}
      <div class="flex flex-wrap gap-2 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/40 items-center">
        <span class="text-[9px] font-black uppercase text-zinc-500 px-2 flex items-center gap-1">
          <Filter class="w-3 h-3" /> Filtrar:
        </span>
        <button
          onClick={() => setFiltroActivo('Todos')}
          class={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filtroActivo === 'Todos' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-slate-200 border border-zinc-800'}`}
        >
          Todos
        </button>
        {comitesDisponibles.map((comite) => (
          <button
            key={comite}
            onClick={() => setFiltroActivo(comite)}
            class={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filtroActivo === comite ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-slate-200 border border-zinc-800'}`}
          >
            {comite.replace('COMITE DE ', '').replace('DEPARTAMENTO DE ', '').replace('UNIDAD DE ', '')}
          </button>
        ))}
      </div>

      {/* Bloques del Dashboard */}
      <div class="space-y-8">
        <div class="bg-zinc-900/60 p-5 rounded-2xl border border-rose-950/30">
          <h3 class="text-xs font-black uppercase text-rose-500 mb-4 flex items-center tracking-wider italic"><AlertTriangle class="w-4 h-4 mr-2" /> Acciones Críticas (Vencidas)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obtenerCriticos().length > 0 ? obtenerCriticos().map((item, i) => <TarjetaAcuerdo key={i} item={item} esVencido={true} onClick={() => abrirEdicion(item)} />) : <p class="text-xs font-bold text-zinc-600 uppercase italic col-span-full p-2">Sin acuerdos vencidos en esta sección.</p>}
          </div>
        </div>

        <div class="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800">
          <h3 class="text-xs font-black uppercase text-blue-400 mb-4 flex items-center tracking-wider italic"><Calendar class="w-4 h-4 mr-2" /> Próximos Compromisos (En Curso)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obtenerProximos().length > 0 ? obtenerProximos().map((item, i) => <TarjetaAcuerdo key={i} item={item} esVencido={false} onClick={() => abrirEdicion(item)} />) : <p class="text-xs font-bold text-zinc-600 uppercase italic col-span-full p-2">No hay compromisos futuros programados.</p>}
          </div>
        </div>

        <div class="bg-zinc-900/20 p-5 rounded-2xl border border-dashed border-zinc-800">
          <h3 class="text-xs font-black uppercase text-zinc-600 mb-4 flex items-center tracking-wider italic"><CheckCircle2 class="w-4 h-4 mr-2" /> Historial de Acuerdos Concluidos</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obtenerHistorial().length > 0 ? obtenerHistorial().map((item, i) => <TarjetaAcuerdo key={i} item={item} esHecho={true} onClick={() => abrirEdicion(item)} />) : <p class="text-xs font-bold text-zinc-700 uppercase italic col-span-full p-2">Sin registros archivados.</p>}
          </div>
        </div>
      </div>

      {/* MODAL INTERACTIVO DE EDICIÓN */}
      {mostrarModal && (
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-left border-t-4 border-t-blue-500">
            <form onSubmit={ejecutarActualizarEstatus} class="p-6">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-black text-slate-200 uppercase tracking-tighter italic">Editar Compromiso</h4>
                <button type="button" onClick={() => setMostrarModal(false)} class="text-slate-500 hover:text-slate-300 cursor-pointer"><X class="w-4 h-4" /></button>
              </div>

              <div class="mb-4">
                <label class="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-1">Texto del Acuerdo / Añadir Nota Obsidian entre [ ]</label>
                <textarea 
                  value={textoAcuerdoEditado}
                  onChange={(e) => setTextoAcuerdoEditado(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-slate-300 uppercase leading-snug outline-none focus:border-blue-600 resize-none font-sans"
                  placeholder="Escribe el compromiso aquí... [nombre_nota_obsidian]"
                />
              </div>

              <label class="block text-[9px] font-black uppercase text-slate-500 mb-1">Estatus en Minuta</label>
              <select 
                value={nuevoStatus}
                onChange={(e) => setNuevoStatus(e.target.value)}
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-bold uppercase outline-none text-slate-200 focus:border-blue-600 mb-6"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="HECHO">HECHO (Mover a Historial)</option>
                <option value="TERMINADO">TERMINADO (Archivar y Ocultar)</option>
              </select>

              <div class="flex gap-2">
                <button type="button" onClick={() => setMostrarModal(false)} class="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-300 cursor-pointer">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={guardando}
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-[10px] font-black uppercase shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Sincronizando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function TarjetaAcuerdo({ item, esVencido, esHecho, onClick }) {
  let badgeColor = "bg-zinc-800 text-zinc-400 border-zinc-700";
  const origen = (item.Tema || "").trim().toUpperCase();
  if (origen.includes("TECNOVIGILANCIA")) badgeColor = "bg-blue-950/40 text-blue-400 border-blue-900/40";
  else if (origen.includes("BIOMÉDICA") || origen.includes("BIOMEDICA")) badgeColor = "bg-purple-950/40 text-purple-400 border-purple-900/40";
  else if (origen.includes("COMPRA")) badgeColor = "bg-amber-950/40 text-amber-400 border-amber-900/40";

  const NOMBRE_VAULT = "Obsidian"; 

  const textoOriginal = item.Acciones || "";
  const matchCorchetes = textoOriginal.match(/\[(.*?)\]/);
  const nombreArchivoObsidian = matchCorchetes ? matchCorchetes[1].trim() : null;
  const textoLimpioParaMostrar = textoOriginal.replace(/\[(.*?)\]/, "").trim();

  const urlObsidian = nombreArchivoObsidian 
    ? `obsidian://open?vault=${encodeURIComponent(NOMBRE_VAULT)}&file=${encodeURIComponent(nombreArchivoObsidian)}`
    : null;

  let estiloFondoTarjeta = "border-zinc-800/80";
  if (esHecho) {
    estiloFondoTarjeta = "opacity-30 saturate-50 border-zinc-800";
  } else if (esVencido) {
    estiloFondoTarjeta = "border-l-4 border-l-rose-500 border-rose-950/40 bg-rose-950/5";
  } else if (urlObsidian) {
    estiloFondoTarjeta = "border-blue-500/50 bg-[#0c4a6e]/10 hover:border-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.03)]";
  }

  const manejarClickObsidian = (e) => {
    e.stopPropagation(); 
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-zinc-900 border p-4 rounded-xl shadow-md flex flex-col justify-between group min-h-[140px] cursor-pointer hover:border-zinc-700 transition-all duration-300 ${estiloFondoTarjeta}`}
    >
      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${badgeColor}`}>{item.Tema}</span>
          
          <div className="flex items-center gap-1.5">
            {urlObsidian && (
              <a 
                href={urlObsidian} 
                onClick={manejarClickObsidian}
                title={`Abrir nota "${nombreArchivoObsidian}" en Obsidian`}
                className="flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-[#0c4a6e] text-blue-400 border-blue-900/40 hover:bg-[#0ea5e9] hover:text-white transition-all duration-200"
              >
                OBSIDIAN <ExternalLink className="w-2 h-2" />
              </a>
            )}

            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
              esHecho ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' : (esVencido ? 'bg-rose-950 text-rose-400 border-rose-900/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700')
            }`}>{item.Status}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-200 font-medium leading-snug uppercase tracking-tight line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
          {textoLimpioParaMostrar}
        </p>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-800/60 text-zinc-500 font-bold text-[9px]">
        <span className="italic text-slate-400 flex items-center gap-1">
          <User className="w-3 h-3 text-zinc-600" /> {item.Responsable || 'BIOMÉDICA'}
        </span>
        <span className={`flex items-center gap-1 font-black ${esVencido ? 'text-rose-400' : 'text-slate-300'}`}>
          <Calendar className="w-3 h-3 text-zinc-500" /> {item['Fecha compromiso']}
        </span>
      </div>
    </div>
  );
}