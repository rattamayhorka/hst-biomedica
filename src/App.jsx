import { useState, useEffect } from 'react';
import Kanban from './components/Kanban';
import Equipos from './components/Equipos';
import Gases from './components/Gases';
import Proyectos from './components/Proyectos';
import Compras from './components/Compras';
import Reuniones from './components/Reuniones';
import PendientesCasa from './components/PendientesCasa';
import ReunionesCasa from './components/ReunionesCasa';
import RegistroRapido from './components/RegistroRapido';
import GestionProyectos from './components/GestionProyectos';
import GastosCasa from './components/GastosCasa';

import { Lock, LogOut } from 'lucide-react'; //iconos de seguridad

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

// INTERCEPTOR DE RUTA NATIVA (Colócalo antes del chequeo de autenticación)
  if (window.location.pathname === '/registro') {
    return <RegistroRapido />;
  }

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
    <div className="bg-[#0f172a] text-[#f8fafc] flex h-screen overflow-hidden font-sans">
      
      {/* MENÚ LATERAL */}
      <div className="w-64 bg-[#1e293b] shadow-2xl border-r border-[#334155] flex-shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-6 font-black text-[#38bdf8] border-b border-[#334155] italic uppercase tracking-tighter text-xl">
            Control Panel
          </div>



          <nav className="mt-4 space-y-1 px-2">

            {/* SEPARADOR / GRUPO: PERSONAL CASA #475569*/}
            <div className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest px-3 mb-1 mt-6">
              Trabajo
            </div>
            

            {/* GRUPO: HOSPITAL */}
            <button 
              onClick={() => setSeccionActiva('kanban')} 
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'kanban' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setSeccionActiva('equipos')} 
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'equipos' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              UP/DOWN Equipo Medico 
            </button>
            <button 
              onClick={() => setSeccionActiva('gases')} 
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'gases' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Control de Gases
            </button>
            <button 
              onClick={() => setSeccionActiva('proyectos')} 
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'proyectos' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Compromisos
            </button>
            <button 
              onClick={() => setSeccionActiva('compras')} 
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'compras' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Compras
            </button>
  
            <button 
              onClick={() => setSeccionActiva('reuniones')} 
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'reuniones' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Future LOG
            </button>

            {/* SEPARADOR / GRUPO: PERSONAL CASA #475569*/}
            <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest px-3 mb-1 mt-6">
              Familia
            </div>

            {/* Kanban Casa */}
            <button  
              onClick={() => setSeccionActiva('casa_pendientes')}  
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'casa_pendientes' 
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                  : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Kanban Casa
            </button>

            {/* Eventos Casa */}
            <button  
              onClick={() => setSeccionActiva('casa_reuniones')}  
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'casa_reuniones' 
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                  : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Future LOG
            </button>


            <button  
              onClick={() => setSeccionActiva('casa_gastos')}  
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'casa_gastos' 
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' 
                  : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              Finanzas 
            </button>









            {/* INYECTA ESTE NUEVO BOTÓN AQUÍ */}
            <button  
              onClick={() => setSeccionActiva('proyectos_grafo')}  
              className={`w-full flex items-center p-3 rounded-xl font-bold uppercase text-[11px] transition-all tracking-wider cursor-pointer ${
                seccionActiva === 'proyectos_grafo' ? 'bg-[#0c4a6e] text-[#38bdf8]' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-[#f8fafc]'
              }`}
            >
              🗺️ Mapa de Proyectos
            </button>
          </nav>
        </div>



        {/* Zona inferior del menú: Botón de Salida Segura */}
        <div className="p-4 border-t border-[#334155] flex flex-col gap-2">


          {/* LINK MADRE A GOOGLE SHEETS */}
          <a 
            href="https://docs.google.com/spreadsheets/d/1zAkCvBUPxxGFY_-a6M92hhqzJXNM6TPGCVVuL-Pu19Q" 
            target="_blank" 
            rel="noopener noreferrer"
            class="w-full bg-zinc-900/60 hover:bg-zinc-800/80 text-slate-400 hover:text-violet-400 font-black px-4 py-2.5 rounded-xl border border-zinc-800/80 transition-all text-[10px] uppercase tracking-widest flex items-center justify-between shadow-md group cursor-pointer"
          >
            <span>Base de Datos</span>
            <span class="text-zinc-600 group-hover:text-violet-500 transition-colors text-xs">↗</span>
          </a>

          {/* TU BOTÓN DE SALIR EXISTENTE */}
          <button 
            onClick={cerrarSesion}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-[10px] font-black uppercase text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl hover:bg-rose-950/50 hover:text-rose-300 transition-all cursor-pointer tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" /> salir
          </button>
          <div className="text-center text-[9px] font-bold text-[#94a3b8] tracking-widest mt-1">
            rattamayhorka v3.2.0
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE TRABAJO */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0f172a]">
        <div id="contenedor-principal">
          {/* Módulos Hospital */}
          {seccionActiva === 'kanban' && <Kanban />}
          {seccionActiva === 'equipos' && <Equipos />}
          {seccionActiva === 'gases' && <Gases />}
          {seccionActiva === 'proyectos' && <Proyectos />}
          {seccionActiva === 'compras' && <Compras />}
          {seccionActiva === 'reuniones' && <Reuniones />}
          {seccionActiva === 'proyectos_grafo' && <GestionProyectos />}

          {/* Módulos Casa */}
          {seccionActiva === 'casa_pendientes' && <PendientesCasa />}
          {seccionActiva === 'casa_reuniones' && <ReunionesCasa />}
          {seccionActiva === 'casa_gastos' && <GastosCasa />}
          
        </div>
      </main>
    </div>
  );
}