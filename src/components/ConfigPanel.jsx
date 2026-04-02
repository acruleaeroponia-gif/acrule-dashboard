import { useState } from 'react'
import { saveConfig } from '../utils/config'
import { formatARS } from '../utils/calculations'

export default function ConfigPanel({ config, onClose, onSave }) {
  const [local, setLocal] = useState(() => ({
    ...config,
    costosPorModelo: { ...config.costosPorModelo },
    budgetPct: { ...(config.budgetPct || {}) },
  }))
  const [newModelo, setNewModelo] = useState('')
  const [newCosto, setNewCosto] = useState('')
  const [saved, setSaved] = useState(false)

  function handlePctChange(field, val) {
    const n = parseFloat(val)
    setLocal(prev => ({ ...prev, [field]: isNaN(n) ? prev[field] : n / 100 }))
  }

  function handleBudgetPct(catId, val) {
    const n = parseFloat(val.replace(',', '.'))
    setLocal(prev => ({
      ...prev,
      budgetPct: { ...prev.budgetPct, [catId]: isNaN(n) ? (prev.budgetPct?.[catId] ?? 0) : n },
    }))
  }

  const BUDGET_CATS = [
    { id: 'inversores',  label: '🌿 Costo materia prima' },
    { id: 'envios',      label: '📦 Envíos' },
    { id: 'comisiones',  label: '🏪 Comisiones ML/Web' },
    { id: 'sueldos',     label: '👷 Sueldos' },
    { id: 'anuncios',    label: '📣 Anuncios Meta+Google' },
    { id: 'impuestos',   label: '📋 Impuestos' },
    { id: 'otrosGastos', label: '🔧 Otros gastos' },
  ]

  function handleSueldos(val) {
    const n = parseFloat(val.replace(/\./g, '').replace(/,/g, '.'))
    setLocal(prev => ({ ...prev, sueldosMensuales: isNaN(n) ? prev.sueldosMensuales : n }))
  }

  function handleCostoModelo(modelo, val) {
    const n = parseFloat(val.replace(/\./g, '').replace(/,/g, '.'))
    setLocal(prev => ({ ...prev, costosPorModelo: { ...prev.costosPorModelo, [modelo]: isNaN(n) ? prev.costosPorModelo[modelo] : n } }))
  }

  function handleAddModelo() {
    if (!newModelo.trim()) return
    const n = parseFloat(newCosto.replace(/\./g, '').replace(/,/g, '.'))
    setLocal(prev => ({ ...prev, costosPorModelo: { ...prev.costosPorModelo, [newModelo.trim()]: isNaN(n) ? 0 : n } }))
    setNewModelo(''); setNewCosto('')
  }

  function handleDeleteModelo(modelo) {
    setLocal(prev => { const c = { ...prev.costosPorModelo }; delete c[modelo]; return { ...prev, costosPorModelo: c } })
  }

  function handleSave() {
    saveConfig(local); onSave(local); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border-l border-slate-700 w-full max-w-md h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-white font-bold text-lg">⚙️ Configuración</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-6">
          <section>
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide mb-1">🎯 Límites de presupuesto (% sobre cobrado)</h3>
            <p className="text-slate-500 text-xs mb-3">Cada categoría no debería superar este % de lo cobrado en el período.</p>
            <div className="flex flex-col gap-2.5">
              {BUDGET_CATS.map(cat => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm flex-1">{cat.label}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.1" min="0" max="100" defaultValue={local.budgetPct?.[cat.id] ?? 0}
                      onChange={e => handleBudgetPct(cat.id, e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm w-20 focus:outline-none focus:border-blue-500 text-right" />
                    <span className="text-slate-500 text-xs">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700 flex justify-between text-xs">
              <span className="text-slate-500">Suma total presupuestada:</span>
              <span className={(Object.values(local.budgetPct || {}).reduce((a,b) => a+(parseFloat(b)||0), 0)) > 100 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                {Object.values(local.budgetPct || {}).reduce((a,b) => a+(parseFloat(b)||0), 0).toFixed(1)}%
              </span>
            </div>
          </section>
          <section>
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide mb-3">Porcentajes de cálculo por venta</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1"><span className="text-slate-400 text-xs">Envíos (%)</span>
                <input type="number" step="0.1" defaultValue={(local.enviosPct * 100).toFixed(1)} onChange={e => handlePctChange('enviosPct', e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></label>
              <label className="flex flex-col gap-1"><span className="text-slate-400 text-xs">Impuestos (%)</span>
                <input type="number" step="0.1" defaultValue={(local.impuestosPct * 100).toFixed(1)} onChange={e => handlePctChange('impuestosPct', e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" /></label>
            </div>
          </section>
          <section>
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide mb-3">Sueldos mensuales</h3>
            <label className="flex flex-col gap-1">
              <span className="text-slate-400 text-xs">Monto mensual (÷30 = {formatARS(local.sueldosMensuales / 30)}/día)</span>
              <input type="text" defaultValue={local.sueldosMensuales.toLocaleString('es-AR')} onChange={e => handleSueldos(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </label>
          </section>
          <section>
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide mb-3">Costos por modelo (inversor)</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(local.costosPorModelo).map(([modelo, costo]) => (
                <div key={modelo} className="flex items-center gap-2">
                  <span className="text-slate-300 text-sm flex-1 truncate">{modelo}</span>
                  <input type="text" defaultValue={costo.toLocaleString('es-AR')} onChange={e => handleCostoModelo(modelo, e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm w-32 focus:outline-none focus:border-blue-500 text-right" />
                  <button onClick={() => handleDeleteModelo(modelo)} className="text-red-500 hover:text-red-400 text-lg leading-none flex-shrink-0" title="Eliminar">×</button>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-slate-400 text-xs mb-2">Agregar modelo</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Nombre del modelo" value={newModelo} onChange={e => setNewModelo(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm flex-1 focus:outline-none focus:border-blue-500" />
                <input type="text" placeholder="Costo" value={newCosto} onChange={e => setNewCosto(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm w-28 focus:outline-none focus:border-blue-500" />
                <button onClick={handleAddModelo} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">+</button>
              </div>
            </div>
          </section>
          <button onClick={handleSave} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {saved ? '✅ Guardado' : 'Guardar cambios'}
          </button>
          <p className="text-slate-600 text-xs text-center -mt-2">Los cambios se aplican de inmediato y se guardan en este navegador.</p>
        </div>
      </div>
    </div>
  )
}
