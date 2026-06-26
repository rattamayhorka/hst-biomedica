import { useState, useEffect } from 'react';
import Kanban from './components/Kanban';
import Equipos from './components/Equipos';
import Gases from './components/Gases';
import Proyectos from './components/Proyectos';
import Compras from './components/Compras';
import Reuniones from './components/Reuniones';
import RegistroRapido from './components/RegistroRapido';
import GestionProyectos from './components/GestionProyectos';
import GastosCasa from './components/GastosCasa';
import ReunionesCasa from './components/ReunionesCasa';

// 🛠️ Agregamos los iconos necesarios para el menú compacto
import {
  Lock,
  LogOut,
  Columns3,
  Wrench,
  Activity,
  FileText,
  ShoppingCart,
  Calendar,
  Home,
  Map,
  DollarSign,
  Database
} from 'lucide-react';

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState('kanban');
  const [autenticado, setAutenticado] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorAuth, setErrorAuth] = useState(false);
  const [refreshKeys, setRefreshKeys] = useState({});

  const CLAVE_ACCESO_ST = "admin123ray";

  useEffect(() => {
    const sesionValida = localStorage.getItem('sesion_biomedica_st');
    if (sesionValida === 'activa') {
      setAutenticado(true);
    }
  }, []);

  if (window.location.pathname === '/registro') {
    return <RegistroRapido />;
  }

  const cambiarSeccion = (seccion) => {
    if (seccionActiva === seccion) {
      setRefreshKeys(prev => ({
        ...prev,
        [seccion]: (prev[seccion] || 0) + 1
      }));
    } else {
      setSeccionActiva(seccion);
    }
  };

  const manejarLogin = (e) => {
    e.preventDefault();
    if (passwordInput === CLAVE_ACCESO_ST) {
      localStorage.setItem('sesion_biomedica_st', 'activa');
      setAutenticado(true);
      setErrorAuth(false);
      setPasswordInput('');
    } else {
      setErrorAuth(true);
      setPasswordInput('');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('sesion_biomedica_st');
    setAutenticado(false);
  };

  if (!autenticado) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans text-[#f8fafc]">
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 border-t-4 border-t-[#38bdf8]">
          <div className="h-12 w-12 rounded-full bg-[#0c4a6e] border border-[#334155] flex items-center justify-center mx-auto mb-4 text-[#38bdf8]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#f8fafc] mb-1">Acceso Restringido</h2>
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-6">Control de Operaciones | Hospital Santo Tomás</p>
          <form onSubmit={manejarLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[9px] font-black uppercase text-[#94a3b8] mb-1.5 tracking-wider">Clave de Seguridad</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••••" 
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-sm text-center tracking-widest text-[#38bdf8] font-mono outline-none focus:border-[#38bdf8] transition-all"
              />
            </div>
            {errorAuth && (
              <p className="text-[10px] font-black text-rose-400 uppercase italic text-center tracking-tight">
                Clave incorrecta. Intenta de nuevo.
              </p>
            )}
            <button type="submit" className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all cursor-pointer mt-2">
              Desbloquear Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] text-[#f8fafc] flex h-dvh overflow-hidden font-sans">
      
      {/* MENÚ LATERAL RESPONSIVO CON SCROLL INTERNO PARA TABLETS */}
      <div className="w-16 xl:w-64 bg-[#1e293b] shadow-2xl border-r border-[#334155] flex-shrink-0 flex flex-col justify-between h-dvh overflow-hidden transition-all duration-200">
        
        {/* CONTENEDOR SUPERIOR CON SCROLL SOLO EN LOS BOTONES */}
        <div className="flex flex-col h-dvh overflow-hidden">
          {/* Título adaptable (Fijo arriba) */}
          <div className="hidden xl:block p-6 font-black text-[#38bdf8] border-b border-[#334155] italic uppercase tracking-tighter text-xl flex-shrink-0">
            Control Panel
          </div>

          {/* 🛠️ NAV CON SCROLL INTERNO: Si las secciones no caben en la tablet, hacen scroll aquí sin empujar el fondo */}
          <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2 min-h-0 custom-scrollbar">
            {/* Sección Trabajo */}
            <div className="hidden xl:block text-[11px] font-black text-[#38bdf8] uppercase tracking-widest px-3 mb-1 mt-2">
              Trabajo
            </div>

            <button 
              onClick={() => cambiarSeccion('kanban')} 
              title="Kanban Trabajo"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'kanban' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Columns3 className="w-4 h-4 flex-shrink-0 xl:hidden" /> 
              <span className="hidden xl:inline px-1">Kanban</span>
            </button>

            <button 
              onClick={() => cambiarSeccion('equipos')} 
              title="UP/DOWN Equipo Medico"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'equipos' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Wrench className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1 truncate">UP/DOWN Equipo Medico</span>
            </button>

            <button 
              onClick={() => cambiarSeccion('gases')} 
              title="Control de Gases"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'gases' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Activity className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Control de Gases</span>
            </button>

            <button 
              onClick={() => cambiarSeccion('proyectos')} 
              title="Compromisos"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'proyectos' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Compromisos</span>
            </button>

            <button 
              onClick={() => cambiarSeccion('compras')} 
              title="Compras"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'compras' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <ShoppingCart className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Compras</span>
            </button>
  
            <button 
              onClick={() => cambiarSeccion('reuniones')} 
              title="Future LOG Trabajo"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'reuniones' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Calendar className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Future LOG</span>
            </button>

            {/* Sección Familia */}
            <div className="hidden xl:block text-[11px] font-black text-amber-400 uppercase tracking-widest px-3 mb-1 mt-6">
              Familia
            </div>

            <button 
              onClick={() => cambiarSeccion('casa_pendientes')}  
              title="Kanban Casa"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'casa_pendientes' 
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                  : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Home className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Kanban Casa</span>
            </button>

            <button 
              onClick={() => cambiarSeccion('casa_reuniones')}  
              title="Future LOG Casa"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'casa_reuniones' 
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                  : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Calendar className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Future LOG</span>
            </button>

            <button 
              onClick={() => cambiarSeccion('casa_gastos')}  
              title="Finanzas"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'casa_gastos' 
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                  : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <DollarSign className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">Finanzas</span>
            </button>

            <button  
              onClick={() => cambiarSeccion('proyectos_grafo')}  
              title="Mapa de Proyectos"
              className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'proyectos_grafo' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              <Map className="w-4 h-4 flex-shrink-0 xl:hidden" />
              <span className="hidden xl:inline px-1">🗺️ Mapa Proyectos</span>
            </button>
          </nav>
        </div>

        {/* 🛠️ SECCIÓN INFERIOR BLOQUEADA FIJA: Nunca se va a desbordar */}
        <div className="p-2 xl:p-4 border-t border-[#334155] bg-[#1e293b] flex flex-col items-center xl:items-stretch gap-2 flex-shrink-0">
          
          <a 
            href="https://docs.google.com/spreadsheets/d/1zAkCvBUPxxGFY_-a6M92hhqzJXNM6TPGCVVuL-Pu19Q" 
            target="_blank" 
            rel="noopener noreferrer"
            title="Base de Datos Google Sheets"
            className="w-full bg-zinc-900/60 hover:bg-zinc-800/80 text-slate-400 hover:text-violet-400 font-black p-3 xl:px-4 xl:py-2.5 rounded-xl border border-zinc-800/80 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center xl:justify-between shadow-md"
          >
            <Database className="w-4 h-4 flex-shrink-0 xl:hidden" /> 
            <span className="hidden xl:inline">Base de Datos</span>
            <span className="hidden xl:inline text-zinc-600 text-xs">↗</span>
          </a>

          <button 
            onClick={cerrarSesion}
            title="Salir del sistema"
            className="w-full flex items-center justify-center gap-2 p-3 xl:p-2.5 text-[10px] font-black uppercase text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl hover:bg-rose-950/50 hover:text-rose-300 transition-all cursor-pointer tracking-wider"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 xl:hidden" /> 
            <span className="hidden xl:inline">salir</span>
          </button>
          
          <div className="hidden xl:block text-center text-[9px] font-bold text-[#94a3b8] tracking-widest mt-1">
            rattamayhorka v0.5.0
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE TRABAJO (Se expande automáticamente) */}
      <main className="flex-1 overflow-y-auto p-4 xl:p-8 bg-[#0f172a]">
        <div id="contenedor-principal">
          {seccionActiva === 'kanban' && <Kanban filtroTipo="Trabajo" refreshTrigger={refreshKeys['kanban']} />}
          {seccionActiva === 'casa_pendientes' && <Kanban filtroTipo="Casa" refreshTrigger={refreshKeys['casa_pendientes']} />}
          {seccionActiva === 'equipos' && <Equipos refreshTrigger={refreshKeys['equipos']} />}
          {seccionActiva === 'gases' && <Gases refreshTrigger={refreshKeys['gases']} />}
          {seccionActiva === 'proyectos' && <Proyectos refreshTrigger={refreshKeys['proyectos']} />}
          {seccionActiva === 'compras' && <Compras refreshTrigger={refreshKeys['compras']} />}
          {seccionActiva === 'reuniones' && <Reuniones refreshTrigger={refreshKeys['reuniones']} />}
          {seccionActiva === 'proyectos_grafo' && <GestionProyectos refreshTrigger={refreshKeys['proyectos_grafo']} />}
          {seccionActiva === 'casa_reuniones' && <ReunionesCasa refreshTrigger={refreshKeys['casa_reuniones']} />} {/* Nota: Aquí tenías mapeado ReunionesCasa pero mandabas GastosCasa, lo dejé igual por consistencia */}
          {seccionActiva === 'casa_gastos' && <GastosCasa refreshTrigger={refreshKeys['casa_gastos']} />}
        </div>
      </main>
    </div>
  );
}