import { useMemo } from 'react'
import { calcBudgetBreakdown, formatARS } from '../utils/calculations'

export default function EgresosBudget({ ventas, egresos, config, periodo }) {
  const { cobrado, categorias } = useMemo(
    () => calcBudgetBreakdown(ventas, egresos, config, periodo),
    [ventas, egresos, config, periodo]
  )

  if (!cobrado || categorias.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-slate-500 text-sm text-center">
        Sin ventas en el período — no se puede calcular el desglose por categoría.
      </div>
    )
  }

  const overCount = categorias.filter(c => c.varianza < -0.1).length

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-sm sm:text-base">Desglose de egresos</h2>
          <p className="text-slate-400 text-xs mt-0.5">% real vs límite presupuestado · sobre {formatARS(cobrado)} cobrado</p>
        </div>
        {overCount > 0 ? (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-900/40 border border-red-700 text-red-300">🚨 {overCount} sobre límite</span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-900/40 border border-green-700 text-green-300">✅ Todo dentro del límite</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {categorias.map(cat => (<EgresoCard key={cat.id} cat={cat} />))}
      </div>
      <BudgetTable categorias={categorias} />
    </div>
  )
}

function EgresoCard({ cat }) {
  const { icon, nombre, monto, realPct, budgetPct, varianza } = cat
  const isOver = varianza < -0.1
  const isWarn = !isOver && varianza <= 2
  const barPct = budgetPct > 0 ? Math.min((realPct / budgetPct) * 100, 100) : 0
  const barColor = isOver ? '#ef4444' : isWarn ? '#eab308' : '#22c55e'
  const borderClass = isOver ? 'border-red-700/50 bg-red-900/5' : isWarn ? 'border-yellow-600/40 bg-yellow-900/5' : 'border-slate-700'
  const valueColor = isOver ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-green-400'
  const varLabel = isOver ? `${varianza.toFixed(1)}% 🚨 exceso` : isWarn ? `+${varianza.toFixed(1)}% ⚠ cerca` : `+${varianza.toFixed(1)}% ✅ a favor`
  const varColor = isOver ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-green-400'
  return (
    <div className={`bg-slate-800 border rounded-2xl p-4 flex flex-col gap-2 ${borderClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-slate-300 text-xs font-semibold leading-tight">{nombre}</span>
      </div>
      <span className={`font-bold text-lg sm:text-xl leading-tight ${valueColor}`}>{formatARS(monto)}</span>
      <div>
        <div className="bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, background: barColor }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Límite {budgetPct}%</span>
          <span style={{ color: barColor }}>{realPct.toFixed(1)}%</span>
        </div>
      </div>
      <div className={`text-xs font-bold border-t border-slate-700 pt-2 ${varColor}`}>{varLabel}</div>
    </div>
  )
}

function BudgetTable({ categorias }) {
  const totalReal = categorias.reduce((s, c) => s + c.realPct, 0)
  const totalBudget = categorias.reduce((s, c) => s + c.budgetPct, 0)
  const totalVar = totalBudget - totalReal
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="hidden sm:grid grid-cols-[160px_1fr_80px_80px_90px] gap-2 px-4 py-2.5 border-b border-slate-700">
        {['Categoría','Ejecución','Real %','Límite %','Varianza'].map(h => (
          <div key={h} className="text-slate-500 text-xs font-semibold uppercase tracking-wide text-right first:text-left">{h}</div>
        ))}
      </div>
      {categorias.map((cat, i) => {
        const { icon, nombre, realPct, budgetPct, varianza } = cat
        const isOver = varianza < -0.1
        const isWarn = !isOver && varianza <= 2
        const barPct = budgetPct > 0 ? Math.min((realPct / budgetPct) * 100, 100) : 0
        const barColor = isOver ? '#ef4444' : isWarn ? '#eab308' : '#22c55e'
        const varColorClass = isOver ? 'bg-red-900/30 text-red-300' : isWarn ? 'bg-yellow-900/30 text-yellow-300' : 'bg-green-900/30 text-green-300'
        return (
          <div key={cat.id} className={`grid grid-cols-[1fr_80px_90px] sm:grid-cols-[160px_1fr_80px_80px_90px] gap-2 items-center px-4 py-3 transition-colors hover:bg-slate-700/30 ${i < categorias.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
            <div className="text-slate-300 text-xs sm:text-sm flex items-center gap-1.5"><span>{icon}</span> {nombre}</div>
            <div className="hidden sm:block"><div className="bg-slate-700 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${barPct}%`, background: barColor }} /></div></div>
            <div className="text-right text-xs font-semibold" style={{ color: barColor }}>{realPct.toFixed(1)}%</div>
            <div className="hidden sm:block text-right text-xs text-slate-500">{budgetPct}%</div>
            <div className={`text-center text-xs font-bold px-2 py-1 rounded-lg ${varColorClass}`}>{varianza >= 0 ? '+' : ''}{varianza.toFixed(1)}%</div>
          </div>
        )
      })}
      <div className="grid grid-cols-[1fr_80px_90px] sm:grid-cols-[160px_1fr_80px_80px_90px] gap-2 items-center px-4 py-3 border-t border-slate-600 bg-slate-700/30 font-bold">
        <div className="text-white text-xs sm:text-sm">📊 Total egresos</div>
        <div className="hidden sm:block"><div className="bg-slate-700 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min((totalReal/totalBudget)*100,100).toFixed(0)}%` }} /></div></div>
        <div className="text-right text-xs font-bold text-blue-300">{totalReal.toFixed(1)}%</div>
        <div className="hidden sm:block text-right text-xs text-slate-400">{totalBudget.toFixed(1)}%</div>
        <div className={`text-center text-xs font-bold px-2 py-1 rounded-lg ${totalVar >= 0 ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>{totalVar >= 0 ? '+' : ''}{totalVar.toFixed(1)}%</div>
      </div>
    </div>
  )
}
