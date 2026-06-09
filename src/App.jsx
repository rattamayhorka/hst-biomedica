import { useState, useEffect } from 'react';
import Kanban from './components/Kanban';
import Equipos from './components/Equipos';
import Gases from './components/Gases';
import Proyectos from './components/Proyectos';
import Compras from './components/Compras';
import Reuniones from './components/Reuniones';
import PendientesCasa from './components/PendientesCasa';
import ReunionesCasa from './components/ReunionesCasa';

import { Lock, LogOut } from 'lucide-react'; // Iconos de seguridad

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState('kanban');
  const [autenticado, setAutenticado] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorAuth, setErrorAuth] = useState(false);

  // CLAVE INSTITUCIONAL DE ACCESO (Cámbiala por la que tú quieras)
  const CLAVE_ACCESO_ST = "admin123ray";

  // Al arrancar, revisamos si ya se había loggeado antes en esta máquina
  useEffect(() => {
    const sesionValida = localStorage.getItem('sesion_biomedica_st');
    if (sesionValida === 'activa') {
      setAutenticado(true);
    }
  }, []);

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

  // --- VISTA 1: PANTALLA DE BLOQUEO DE SEGURIDAD ---
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
              <p className="text-[10px] font-black text-rose-400 uppercase italic text-center tracking-tight animate-shake">
                Clave incorrecta. Intenta de nuevo.
              </p>
            )}

            <button 
              type="submit" 
              className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all cursor-pointer mt-2"
            >
              Desbloquear Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA 2: APLICACIÓN COMPLETA DESBLOQUEADA ---
  return (
    <div className="bg-[#0f172a] text-[#f8fafc] flex flex-col md:flex-row h-screen overflow-hidden font-sans">
      
      {/* MENÚ LATERAL UNIFICADO */}
      <div className="w-full md:w-64 bg-[#1e293b] shadow-2xl border-b md:border-b-0 md:border-r border-[#334155] flex-shrink-0 flex flex-row md:flex-col justify-between items-center md:items-stretch p-4 md:p-0">
        
        <div className="flex md:flex-col items-center md:items-stretch justify-between w-full md:w-auto overflow-hidden">
          <div className="p-2 md:p-6 font-black text-[#38bdf8] italic uppercase tracking-tighter text-base md:text-xl border-b-0 md:border-b border-[#334155]">
            Santo Tomás
          </div>
          
          {/* Navegación con Scroll Horizontal en móvil, bloque vertical en PC */}
          <nav className="mt-0 md:mt-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible no-scrollbar px-2 max-w-[70%] md:max-w-none text-left"> 
            
            {/* SECCIÓN TRABAJO / HOSPITAL */}
            <div className="hidden md:block text-[9px] font-black text-[#475569] uppercase tracking-widest px-3 mb-1 mt-2">
              Hospital Operations
            </div>
            <button onClick={() => setSeccionActiva('kanban')} className={`flex-shrink-0 px-3 py-2 md:p-2.5 rounded-xl font-bold uppercase text-[10px] ${seccionActiva === 'kanban' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8]'}`}>Kanban</button>
            <button onClick={() => setSeccionActiva('equipos')} className={`flex-shrink-0 px-3 py-2 md:p-2.5 rounded-xl font-bold uppercase text-[10px] ${seccionActiva === 'equipos' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8]'}`}>Equipos</button>
            <button onClick={() => setSeccionActiva('gases')} className={`flex-shrink-0 px-3 py-2 md:p-2.5 rounded-xl font-bold uppercase text-[10px] ${seccionActiva === 'gases' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8]'}`}>Gases</button>
            <button onClick={() => setSeccionActiva('reuniones')} className={`flex-shrink-0 px-3 py-2 md:p-2.5 rounded-xl font-bold uppercase text-[10px] ${seccionActiva === 'reuniones' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8]'}`}>Juntas Hospital</button>

            {/* SECCIÓN PERSONAL / CASA */}
            <div className="hidden md:block text-[9px] font-black text-[#475569] uppercase tracking-widest px-3 mb-1 mt-6">
              Personal & Home
            </div>
            <button onClick={() => setSeccionActiva('casa_pendientes')} className={`flex-shrink-0 px-3 py-2 md:p-2.5 rounded-xl font-bold uppercase text-[10px] ${seccionActiva === 'casa_pendientes' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 'text-[#94a3b8]'}`}>🏠 Tareas Casa</button>
            <button onClick={() => setSeccionActiva('casa_reuniones')} className={`flex-shrink-0 px-3 py-2 md:p-2.5 rounded-xl font-bold uppercase text-[10px] ${seccionActiva === 'casa_reuniones' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 'text-[#94a3b8]'}`}>📅 Citas Casa</button>
          
          </nav>
        </div>

        {/* Zona inferior del menú */}
        <div className="hidden md:flex p-4 border-t border-[#334155] flex-col gap-2">
          <div className="text-center text-[9px] font-bold text-[#94a3b8] tracking-widest">BIOMÉDICA v2.0</div>
        </div>
      </div>

      {/* CONTENEDOR DE TRABAJO DINÁMICO */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0f172a]">
        <div id="contenedor-principal">
          {/* Vistas del Hospital */}
          {seccionActiva === 'kanban' && <Kanban />}
          {seccionActiva === 'equipos' && <Equipos />}
          {seccionActiva === 'gases' && <Gases />}
          {seccionActiva === 'reuniones' && <Reuniones />}
          
          {/* Vistas de la Casa */}
          {seccionActiva === 'casa_pendientes' && <PendientesCasa />}
          {seccionActiva === 'casa_reuniones' && <ReunionesCasa />}
        </div>
      </main>

    </div>
  );
}