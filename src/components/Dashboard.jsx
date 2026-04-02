import { useMemo, useState } from 'react'
import { calcMetricas, formatARS } from '../utils/calculations'
import MetricCard from './MetricCard'
import AlertaBanner from './AlertaBanner'
import TablaVentas from './TablaVentas'
import EgresosBudget from './EgresosBudget'

/**
 * Dashboard principal — muestra métricas diarias y semanales.
 */
export default function Dashboard({ ventas, egresos, config, lastUpdated, stale, error, onOpenConfig }) {
  const [periodo, setPeriodo] = useState('dia')
  const [showBudget, setShowBudget] = useState(true)

  const metricas = useMemo(
    () => calcMetricas(ventas, egresos, config, periodo),
    [ventas, egresos, config, periodo]
  )

  const { cobradoTotal, pagoInversoresTotal, disponibleAds, adsGastados, ebitda,
    diferencia, burnFijos, transferenciaViernes, filasVentas, modelosDesconocidos } = metricas

  const ebitdaColor = ebitda >= 0 ? 'green' : 'red'
  const disponibleColor = disponibleAds > 0 ? 'white' : 'red'
  const diferColor = diferencia >= 0 ? 'green' : 'red'

  const lastUpdMsg = lastUpdated
    ? `Actualizado ${lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
    : 'Sin datos'

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
            Dashboard Acrule 🌱
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full pulse-dot ${stale ? 'bg-yellow-400' : 'bg-green-400'}`} />
            <span className="text-slate-400 text-xs">
              {stale ? `⚠ Datos cacheados — ${lastUpdMsg}` : lastUpdMsg}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button onClick={() => setPeriodo('dia')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodo === 'dia' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Hoy</button>
            <button onClick={() => setPeriodo('semana')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodo === 'semana' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Esta semana</button>
          </div>
          <button onClick={onOpenConfig} className="bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl p-2 transition-colors" title="Configuración">⚙️</button>
        </div>
      </div>
      {error && (<div className="mb-4 bg-slate-800 border border-yellow-600 rounded-xl p-3 text-yellow-300 text-sm">{error}</div>)}
      <div className="mb-6"><AlertaBanner diferencia={diferencia} modelosDesconocidos={modelosDesconocidos} /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <MetricCard label="Cobrado hoy" value={cobradoTotal} subtitle={`${metricas.cantidadVentas} venta${metricas.cantidadVentas !== 1 ? 's' : ''}`} />
        <MetricCard label="Pago a inversores" value={pagoInversoresTotal} color="white" subtitle="Costo de huertas" />
        <MetricCard label="Disponible para ads" value={disponibleAds} color={disponibleColor} subtitle={`Burn fijos: ${formatARS(burnFijos)}`} />
        <MetricCard label="Ads gastados" value={adsGastados} color={diferencia < 0 ? 'red' : 'white'} subtitle={diferencia >= 0 ? `Margen: ${formatARS(diferencia)}` : `Exceso: ${formatARS(Math.abs(diferencia))}`} />
        <MetricCard label="EBITDA del día" value={ebitda} color={ebitdaColor} subtitle={ebitda >= 0 ? '✅ Positivo' : '❌ Negativo'} className="col-span-2 sm:col-span-1" />
      </div>
      {periodo === 'semana' && (
        <div className="mb-6 bg-blue-900/30 border border-blue-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-blue-300 text-sm font-medium">💸 Transferir a inversores el viernes:</span>
          <span className="text-blue-100 font-bold text-xl">{formatARS(transferenciaViernes)}</span>
        </div>
      )}
      <button onClick={() => setShowBudget(b => !b)} className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-blue-600 rounded-2xl px-5 py-3.5 mb-3 transition-colors group">
        <div className="flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <div className="text-left">
            <div className="text-white text-sm font-semibold">Desglose por categoría vs presupuesto</div>
            <div className="text-slate-500 text-xs">% real vs límite configurado · datos en vivo de la planilla</div>
          </div>
        </div>
        <span className={`text-slate-400 text-sm transition-transform ${showBudget ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {showBudget && (<EgresosBudget ventas={ventas} egresos={egresos} config={config} periodo={periodo} />)}
      <TablaVentas filas={filasVentas} />
      <p className="text-center text-slate-600 text-xs mt-6">Refresco automático cada 5 minutos · Acrule Hidropónica 2026</p>
    </div>
  )
}
