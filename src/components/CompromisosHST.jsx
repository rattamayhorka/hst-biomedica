import { useEffect, useState } from 'react';
import { database } from '../api';
import { AlertTriangle, Calendar, CheckCircle2, User, Filter, X, ExternalLink, Clock } from 'lucide-react';

// --- NUEVO COMPONENTE: LÍNEA DE TIEMPO VISUAL ESTILO GIT BRANCHES ---
function GanttDashboard({ acuerdos, parseFecha, hoy, alHacerClickItem }) {
  // 1. Filtrar solo tareas activas (pendientes/vencidas) y ordenarlas cronológicamente
  const tareasActivas = acuerdos
    .filter(item => {
      const statusUpper = (item.Status || "").trim().toUpperCase();
      return statusUpper !== 'HECHO' && statusUpper !== 'TERMINADO';
    })
    .map(item => ({
      ...item,
      fechaFinObj: parseFecha(item['Fecha compromiso'])
    }))
    .sort((a, b) => a.fechaFinObj - b.fechaFinObj);

  if (tareasActivas.length === 0) return null;

  // 2. Definir el punto de inicio absoluto del timeline (Hoy o la primera vencida)
  let fechaBase = new Date(hoy);
  if (tareasActivas[0].fechaFinObj < fechaBase) {
    fechaBase = new Date(tareasActivas[0].fechaFinObj);
    fechaBase.setDate(fechaBase.getDate() - 2); // Pequeño colchón inicial
  }

  // 3. Calcular la duración individual de cada tramo en la línea de tiempo única
  const bloquesTimeline = tareasActivas.map((item, idx) => {
    const fechaInicioObj = idx === 0 ? new Date(fechaBase) : new Date(tareasActivas[idx - 1].fechaFinObj);
    
    // Evitar empalmes de 0 días
    if (fechaInicioObj >= item.fechaFinObj) {
      fechaInicioObj.setTime(item.fechaFinObj.getTime() - (1 * 24 * 60 * 60 * 1000));
    }

    const duracionDias = Math.ceil((item.fechaFinObj.getTime() - fechaInicioObj.getTime()) / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.ceil((item.fechaFinObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...item,
      fechaInicioObj,
      duracionDias,
      diasRestantes
    };
  });

  // Calcular el total de días de toda la autopista de tiempo
  const totalDiasLinea = bloquesTimeline.reduce((acc, b) => acc + b.duracionDias, 0);

  return (
    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900/80 mb-6 shadow-inner text-left">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider italic">
          Timeline
        </h3>
      </div>

      {/* Contenedor de Desplazamiento Horizontal */}
      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {/* Forzamos un ancho mínimo amplio para que se aprecien las proporciones de los días */}
        <div className="min-w-[1100px] flex items-start relative py-4 px-2">
          
          {bloquesTimeline.map((item, idx) => {
            const esVencido = item.diasRestantes < 0;
            const textoLimpio = (item.Acciones || "").replace(/\[(.*?)\]/, "").trim();
            
            // Proporción del bloque respecto a la duración total del tiempo
            const anchoPorcentaje = (item.duracionDias / totalDiasLinea) * 100;

            // Determinar colores basados en tu paleta de Comités y Urgencia
            let colorBloque = "bg-blue-600/20 border-blue-500/45 text-blue-400 hover:bg-blue-600/30";
            let colorTextoComite = "text-blue-500";
            
            const origen = (item.Tema || "").trim().toUpperCase();
            if (esVencido) {
              colorBloque = "bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30 animate-pulse";
              colorTextoComite = "text-rose-500";
            } else if (origen.includes("TECNOVIGILANCIA")) {
              colorBloque = "bg-cyan-600/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-600/30";
              colorTextoComite = "text-cyan-500";
            } else if (origen.includes("BIOMÉDICA") || origen.includes("BIOMEDICA")) {
              colorBloque = "bg-purple-600/20 border-purple-500/40 text-purple-400 hover:bg-purple-600/30";
              colorTextoComite = "text-purple-500";
            } else if (origen.includes("COMPRA")) {
              colorBloque = "bg-amber-600/20 border-amber-500/40 text-amber-400 hover:bg-amber-600/30";
              colorTextoComite = "text-amber-500";
            }

            return (
              <div 
                key={idx}
                className="flex flex-col flex-1"
                style={{ width: `${Math.max(anchoPorcentaje, 16)}%`, minWidth: '180px' }}
              >
                {/* 1. PARTE SUPERIOR: Fechas de Corte y Días Restantes */}
                <div className="mb-3 px-2 flex flex-col items-center text-center">
                  <span className="text-[9px] font-black text-zinc-350 tracking-tighter uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                    {item['Fecha compromiso']}
                  </span>
                  <span className={`text-[8px] font-bold mt-1 uppercase tracking-tight ${esVencido ? 'text-rose-400' : 'text-zinc-500'}`}>
                    {esVencido ? `Vencido hace ${Math.abs(item.diasRestantes)}d` : `Faltan ${item.diasRestantes}d`}
                  </span>
                </div>

                {/* 2. PARTE CENTRAL: La Barra Continua estilo Chevron */}
                <div 
                  onClick={() => alHacerClickItem(item)}
                  className={`relative h-10 border flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm mx-0.5 rounded-xl text-center group ${colorBloque}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest pointer-events-none truncate px-2">
                    {item.duracionDias} {item.duracionDias === 1 ? 'Día' : 'Días'}
                  </span>
                  
                  {/* Pequeño indicador de flujo en medio */}
                  {idx < bloquesTimeline.length - 1 && (
                    <div className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 text-zinc-700 font-bold text-xs z-20 pointer-events-none group-hover:text-zinc-500 transition-colors">
                      ➔
                    </div>
                  )}
                </div>

                {/* 3. PARTE INFERIOR: Detalles e identificación del acuerdo */}
                <div className="mt-3 px-3 text-center flex flex-col items-center">
                  <span className={`text-[8px] font-extrabold uppercase tracking-widest mb-1 ${colorTextoComite}`}>
                    {item.Tema ? item.Tema.replace('COMITE DE ', '').substring(0, 12) : 'ACUERDO'}
                  </span>
                  <p 
                    onClick={() => alHacerClickItem(item)}
                    className="text-[10px] font-black uppercase text-zinc-300 leading-snug tracking-tight line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors"
                    title={textoLimpio}
                  >
                    {textoLimpio}
                  </p>
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
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
    return <p className="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left">Actualizando...</p>;
  }

  const totalCriticosGeneral = acuerdos.filter(item => {
    const fVal = parseFecha(item['Fecha compromiso']);
    const statusUpper = (item.Status || "").trim().toUpperCase();
    return fVal <= hoy && statusUpper !== 'HECHO' && statusUpper !== 'TERMINADO';
  }).length;

  return (
    <div className="space-y-6 text-left relative">
      
      {/* Encabezado */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-blue-400 tracking-tighter uppercase italic">Seguimiento de Minutas</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Dashboard de Acuerdos / Compromisos</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase italic tracking-tighter text-white ${totalCriticosGeneral > 0 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`}>
          {totalCriticosGeneral} Pendientes Vencidos
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/40 items-center">
        <span className="text-[9px] font-black uppercase text-zinc-500 px-2 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filtrar:
        </span>
        <button
          onClick={() => setFiltroActivo('Todos')}
          className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filtroActivo === 'Todos' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-slate-200 border border-zinc-800'}`}
        >
          Todos
        </button>
        {comitesDisponibles.map((comite) => (
          <button
            key={comite}
            onClick={() => setFiltroActivo(comite)}
            className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filtroActivo === comite ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-slate-200 border border-zinc-800'}`}
          >
            {comite.replace('COMITE DE ', '').replace('DEPARTAMENTO DE ', '').replace('UNIDAD DE ', '')}
          </button>
        ))}
      </div>

      {/* INYECCIÓN DE LA NUEVA LÍNEA DE TIEMPO VISUAL */}
      <GanttDashboard
        acuerdos={acuerdosFiltrados} 
        parseFecha={parseFecha} 
        hoy={hoy} 
        alHacerClickItem={abrirEdicion} 
      />

      {/* Bloques del Dashboard (Tus tarjetas originales quedan abajo intactas) */}
      <div className="space-y-8">
        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-rose-950/30">
          <h3 className="text-xs font-black uppercase text-rose-500 mb-4 flex items-center tracking-wider italic"><AlertTriangle class="w-4 h-4 mr-2" /> Acciones Críticas (Vencidas)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obtenerCriticos().length > 0 ? obtenerCriticos().map((item, i) => <TarjetaAcuerdo key={i} item={item} esVencido={true} onClick={() => abrirEdicion(item)} />) : <p class="text-xs font-bold text-zinc-600 uppercase italic col-span-full p-2">Sin acuerdos vencidos en esta sección.</p>}
          </div>
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800">
          <h3 className="text-xs font-black uppercase text-blue-400 mb-4 flex items-center tracking-wider italic"><Calendar class="w-4 h-4 mr-2" /> Próximos Compromisos (En Curso)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obtenerProximos().length > 0 ? obtenerProximos().map((item, i) => <TarjetaAcuerdo key={i} item={item} esVencido={false} onClick={() => abrirEdicion(item)} />) : <p class="text-xs font-bold text-zinc-600 uppercase italic col-span-full p-2">No hay compromisos futuros programados.</p>}
          </div>
        </div>

        <div className="bg-zinc-900/20 p-5 rounded-2xl border border-dashed border-zinc-800">
          <h3 className="text-xs font-black uppercase text-zinc-600 mb-4 flex items-center tracking-wider italic"><CheckCircle2 class="w-4 h-4 mr-2" /> Historial de Acuerdos Concluidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obtenerHistorial().length > 0 ? obtenerHistorial().map((item, i) => <TarjetaAcuerdo key={i} item={item} esHecho={true} onClick={() => abrirEdicion(item)} />) : <p class="text-xs font-bold text-zinc-700 uppercase italic col-span-full p-2">Sin registros archivados.</p>}
          </div>
        </div>
      </div>

      {/* MODAL INTERACTIVO DE EDICIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-left border-t-4 border-t-blue-500">
            <form onSubmit={ejecutarActualizarEstatus} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black text-slate-200 uppercase tracking-tighter italic">Editar Compromiso</h4>
                <button type="button" onClick={() => setMostrarModal(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="mb-4">
                <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-1">Texto del Acuerdo / Añadir Nota Obsidian entre [ ]</label>
                <textarea 
                  value={textoAcuerdoEditado}
                  onChange={(e) => setTextoAcuerdoEditado(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-slate-300 uppercase leading-snug outline-none focus:border-blue-600 resize-none font-sans"
                  placeholder="Escribe el compromiso aquí... [nombre_nota_obsidian]"
                />
              </div>

              <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Estatus en Minuta</label>
              <select 
                value={nuevoStatus}
                onChange={(e) => setNuevoStatus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-bold uppercase outline-none text-slate-200 focus:border-blue-600 mb-6"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="HECHO">HECHO (Mover a Historial)</option>
                <option value="TERMINADO">TERMINADO (Archivar y Ocultar)</option>
              </select>

              <div className="flex gap-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-300 cursor-pointer">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={guardando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-[10px] font-black uppercase shadow-lg disabled:opacity-50 cursor-pointer"
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

// Subcomponente original TarjetaAcuerdo (Corregido class a className por consistencia en React)
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