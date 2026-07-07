import { useEffect, useState } from 'react';
import { database } from '../api';
import { RefreshCw, TrendingDown, Landmark } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Deudas({ refreshTrigger }) {
  const [deudas, setDeudas] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const sincronizarDatos = async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      const [dataDeudas, dataTransacciones] = await Promise.all([
        database.obtenerSeccion('deudas'),
        database.obtenerSeccion('transacciones')
      ]);
      if (Array.isArray(dataDeudas)) setDeudas(dataDeudas);
      if (Array.isArray(dataTransacciones)) setTransacciones(dataTransacciones);
    } catch (error) {
      console.error("Error al sincronizar con Google Sheets:", error);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    sincronizarDatos(false);
  }, [refreshTrigger]);

  if (cargando) {
    return <p className="text-xs font-black uppercase tracking-wider text-slate-500 animate-pulse text-left p-4">Refrescando nodos de balance bursátil...</p>;
  }

  const limpiarMonto = (valorCrudo) => {
    if (!valorCrudo) return 0;
    if (typeof valorCrudo === 'number') return Math.abs(valorCrudo);
    const textoLimpio = valorCrudo.toString().replace(/[$,\s\-(),]/g, '');
    return Math.abs(parseFloat(textoLimpio)) || 0;
  };

  const deudasVigentes = deudas.filter(d => d.Status?.toUpperCase() !== 'LIQUIDADO');
  const totalDeudaActual = deudasVigentes.reduce((acc, curr) => acc + limpiarMonto(curr.Deuda_Total), 0);

  const formatearMonedaCompleta = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '';
    return `$${Number(valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const generarDatosGrafica = (deuda) => {
    const actual = limpiarMonto(deuda.Deuda_Total);
    const inicial = limpiarMonto(deuda.Monto_Inicial) || actual;
    
    const rubroBuscado = `Pago de ${deuda.Descripcion}`.toUpperCase().trim();
    const abonosReales = transacciones
      .filter(t => (t.Rubro || t.rubro || "").toString().trim().toUpperCase() === rubroBuscado)
      .map(t => ({
        fecha: t.Fecha || t.fecha || 'Abono',
        monto: limpiarMonto(t.Importe || t.importe || 0)
      }));

    const dataPuntos = [];
    let saldoFlujoReal = inicial;
    
    // Punto inicial base
    dataPuntos.push({
      name: 'Inicio',
      'Historial Real': saldoFlujoReal,
      'Proyección Proporcionada': null,
      montoPagoReal: 0
    });

    // Inserción de abonos reales mapeando su impacto
    abonosReales.forEach((abono) => {
      saldoFlujoReal = Math.max(actual, saldoFlujoReal - abono.monto);
      dataPuntos.push({
        name: abono.fecha,
        'Historial Real': saldoFlujoReal,
        'Proyección Proporcionada': null,
        montoPagoReal: abono.monto // Guardamos el valor nativo del abono para el Tooltip
      });
    });

    // Punto del corte presente
    dataPuntos.push({
      name: 'Actual',
      'Historial Real': actual,
      'Proyección Proporcionada': actual,
      montoPagoReal: 0
    });

    const pagoPromedio = abonosReales.length > 0 
      ? abonosReales.reduce((acc, curr) => acc + curr.monto, 0) / abonosReales.length 
      : inicial * 0.15;

    let saldoSimulado = actual;
    let periodosProyectados = 1;

    while (saldoSimulado > 0 && periodosProyectados <= 12) {
      saldoSimulado = Math.max(0, saldoSimulado - pagoPromedio);
      dataPuntos.push({
        name: `Proy +${periodosProyectados}`,
        'Historial Real': null,
        'Proyección Proporcionada': Math.round(saldoSimulado * 100) / 100,
        montoPagoReal: 0
      });
      periodosProyectados++;
    }

    return dataPuntos;
  };

  const formatearEjeY = (tick) => {
    if (tick >= 1000) return `$${(tick / 1000).toFixed(0)}k`;
    return `$${tick}`;
  };

  // Componente interno para renderizar el Tooltip con la estructura solicitada
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataNode = payload[0].payload;
      // Evaluamos si es punto real o proyectado
      const balanceActual = dataNode['Historial Real'] !== null ? dataNode['Historial Real'] : dataNode['Proyección Proporcionada'];
      const abonoEfectuado = dataNode.montoPagoReal || 0;

      return (
        <div className="bg-[#0f172a] border border-[#334155] p-3 rounded-xl shadow-xl font-mono text-left space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{dataNode.name}</p>
          <div className="text-xs">
            <span className="text-zinc-400 font-medium">Balance: </span>
            <span className="text-slate-100 font-bold">{formatearMonedaCompleta(balanceActual)}</span>
          </div>
          {abonoEfectuado > 0 && (
            <div className="text-xs border-t border-zinc-800/80 pt-1 mt-1">
              <span className="text-emerald-400 font-medium">Pago Detectado: </span>
              <span className="text-emerald-400 font-black">+{formatearMonedaCompleta(abonoEfectuado)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 text-left p-4 bg-[#0f172a] text-zinc-200 font-sans min-h-screen">
      
      {/* HEADER */}
      <div className="border-b border-zinc-800 pb-5 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-50 flex items-center gap-2">
            <Landmark className="text-emerald-400 w-6 h-6 stroke-[2.5]" /> Dashboard de Tendencias
          </h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Historial de abonos reales vs estimación discontinua de amortización
          </p>
        </div>
        
        <button onClick={() => sincronizarDatos(false)} className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl text-zinc-400 cursor-pointer hover:text-slate-50 transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* CUADRO CONSOLIDADO */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 border-l-4 border-l-emerald-500 max-w-md shadow-2xl backdrop-blur-md">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Capital Total de Pasivos Activos</span>
        <div className="text-4xl font-black text-slate-100 tabular-nums tracking-tight mt-1 font-mono">
          ${totalDeudaActual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-tight">
          <TrendingDown className="w-3.5 h-3.5" /> Portafolio de deuda viva analizado
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deudasVigentes.map((deuda, index) => {
          const datosGrafica = generarDatosGrafica(deuda);
          
          return (
            <div key={index} className="bg-[#1e293b]/40 border border-[#334155]/70 rounded-2xl p-5 space-y-4 shadow-xl">
              
              <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[9px] font-black bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-emerald-400 uppercase font-mono tracking-wider">
                    {deuda.Tarjeta}
                  </span>
                  <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight mt-1">
                    {deuda.Descripcion}
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Saldo Actual</span>
                  <span className="text-lg font-black text-rose-400">
                    ${limpiarMonto(deuda.Deuda_Total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Contenedor Gráfico */}
              <div className="h-64 w-full bg-zinc-950/80 p-2 rounded-xl border border-zinc-900 overflow-hidden relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datosGrafica} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id={`colorReal-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    
                    <XAxis 
                      dataKey="name" 
                      stroke="#475569" 
                      fontSize={9} 
                      fontWeight="bold"
                      tickLine={false} 
                      dy={8}
                    />
                    
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickLine={false} 
                      tickFormatter={formatearEjeY}
                    />
                    
                    {/* Tooltip personalizado inyectado */}
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Línea e Historial sólido (Sin LabelList estático) */}
                    <Area
                      type="monotone"
                      dataKey="Historial Real"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={`url(#colorReal-${index})`}
                      connectNulls={false}
                      dot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 1.5 }}
                      activeDot={{ r: 7, fill: '#34d399' }}
                    />

                    {/* Proyección Simulada */}
                    <Line
                      type="monotone"
                      dataKey="Proyección Proporcionada"
                      stroke="#64748b"
                      strokeWidth={2.5}
                      strokeDasharray="6 6"
                      dot={false}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* LEYENDA EXPLICATIVA */}
              <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full block border border-[#0f172a]"></span>
                  <span className="text-zinc-400">Puntos de Pago Realizados</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-500 block"></span>
                  <span className="text-zinc-500">Proyección Estimada</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}