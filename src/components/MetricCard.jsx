import { formatARS } from '../utils/calculations'

/**
 * Tarjeta de métrica grande.
 * @param {string}  label
 * @param {number}  value
 * @param {'green'|'red'|'white'|'yellow'} color
 * @param {string}  subtitle   - texto pequeño debajo
 * @param {boolean} negative   - fuerza color rojo
 */
export default function MetricCard({ label, value, color = 'white', subtitle, isCurrency = true }) {
  const colorMap = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    white: 'text-white',
  }
  const textColor = colorMap[color] ?? 'text-white'

  return (
    <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-1 border border-slate-700">
      <span className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wide leading-tight">
        {label}
      </span>
      <span className={`metric-value font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight ${textColor}`}>
        {isCurrency ? formatARS(value) : value?.toLocaleString('es-AR')}
      </span>
      {subtitle && (
        <span className="text-slate-500 text-xs mt-1">{subtitle}</span>
      )}
    </div>
  )
}
