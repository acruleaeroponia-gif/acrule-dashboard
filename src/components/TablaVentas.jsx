import { formatARS } from '../utils/calculations'

/**
 * Tabla de ventas del período (día o semana).
 */
export default function TablaVentas({ filas }) {
  if (!filas || filas.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center text-slate-500 text-sm">
        No hay ventas registradas en este período.
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-slate-200 font-semibold text-sm">
          Ventas del período ({filas.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">Hora</th>
              <th className="text-left px-4 py-3">Modelo</th>
              <th className="text-right px-4 py-3">Precio</th>
              <th className="text-right px-4 py-3">Costo inv.</th>
              <th className="text-right px-4 py-3">Comisión</th>
              <th className="text-right px-4 py-3">Queda libre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filas.map((fila, i) => (
              <tr key={i} className="hover:bg-slate-700/40 transition-colors">
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{fila.hora || '—'}</td>
                <td className="px-4 py-3 text-slate-200">{fila.modelo}</td>
                <td className="px-4 py-3 text-right text-slate-200">{formatARS(fila.precio)}</td>
                <td className="px-4 py-3 text-right text-slate-400">{formatARS(fila.costoInversor)}</td>
                <td className="px-4 py-3 text-right text-slate-400">{formatARS(fila.comision)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${fila.quedaLibre >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatARS(fila.quedaLibre)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
