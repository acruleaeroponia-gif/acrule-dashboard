import { formatARS } from '../utils/calculations'

/**
 * Banner rojo de alerta cuando ads gastados > disponible.
 */
export default function AlertaBanner({ diferencia, modelosDesconocidos }) {
  const hayAlertaAds = diferencia < 0
  const hayModelosDesc = modelosDesconocidos && modelosDesconocidos.length > 0

  if (!hayAlertaAds && !hayModelosDesc) return null

  return (
    <div className="flex flex-col gap-3">
      {hayAlertaAds && (
        <div className="bg-red-600 rounded-2xl p-4 sm:p-5 flex items-center gap-3 border border-red-500 shadow-lg shadow-red-900/40">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <p className="text-white font-semibold text-sm sm:text-base leading-snug">
            Te pasaste <strong>{formatARS(Math.abs(diferencia))}</strong> en ads hoy.
            Bajá el presupuesto en Meta/Google ahora.
          </p>
        </div>
      )}
      {hayModelosDesc && (
        <div className="bg-yellow-600/30 border border-yellow-500 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠</span>
          <p className="text-yellow-200 text-sm">
            <strong>Modelos desconocidos en la hoja Ventas</strong> — revisá la tabla de costos:{' '}
            <span className="font-mono">{modelosDesconocidos.join(', ')}</span>
          </p>
        </div>
      )}
    </div>
  )
}
