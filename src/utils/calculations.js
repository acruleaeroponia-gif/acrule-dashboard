/**
 * Lógica de cálculos financieros — Dashboard Acrule
 * Exactamente según el spec del usuario.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Formatea número como moneda argentina sin decimales */
export function formatARS(n) {
  if (n == null || isNaN(n)) return '$0'
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return n < 0 ? `-${formatted}` : formatted
}

/** Parsea un string de moneda/número argentino a número */
export function parseNum(str) {
  if (str == null) return 0
  const s = String(str).replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim()
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

/** Devuelve true si una fecha (Date o string YYYY-MM-DD) es hoy */
export function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

/** Devuelve true si la fecha está en la semana actual (lunes→hoy) */
export function isThisWeek(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  // Lunes de la semana actual
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1 // 0=lunes
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)
  monday.setHours(0, 0, 0, 0)
  return d >= monday && d <= today
}

/**
 * Busca el costo inversor de un modelo.
 * Hace match case-insensitive y también busca coincidencias parciales.
 * Si no encuentra → retorna null (para activar alerta de modelo desconocido)
 */
export function getCostoModelo(modelo, costosPorModelo) {
  if (!modelo) return 0
  const m = modelo.trim().toLowerCase()

  // Match exacto primero
  for (const [key, val] of Object.entries(costosPorModelo)) {
    if (key.toLowerCase() === m) return val
  }

  // Match parcial (si el nombre del modelo contiene la clave o viceversa)
  for (const [key, val] of Object.entries(costosPorModelo)) {
    if (m.includes(key.toLowerCase()) || key.toLowerCase().includes(m)) return val
  }

  // Insumos sin costo
  if (m.includes('insumo') || m.includes('extra')) return 0

  return null // DESCONOCIDO
}

// ─── Cálculo por venta (Paso 1) ─────────────────────────────────────────────

/**
 * Calcula cuánto queda libre de UNA venta.
 * @returns { quedaLibre, costoInversor, comision, envios, impuestos, modeloDesconocido }
 */
export function calcVenta(venta, config) {
  const precio = venta.precio
  const comision = venta.comision
  const modelo = venta.modelo

  const costoRaw = getCostoModelo(modelo, config.costosPorModelo)
  const modeloDesconocido = costoRaw === null
  const costoInversor = costoRaw ?? 0

  const envios = precio * config.enviosPct
  const impuestos = precio * config.impuestosPct

  const quedaLibre = precio - costoInversor - comision - envios - impuestos

  return { quedaLibre, costoInversor, comision, envios, impuestos, modeloDesconocido }
}

// ─── Métricas del día / semana ───────────────────────────────────────────────

/**
 * Calcula todas las métricas del dashboard.
 *
 * @param {Array} ventas     - filas de la hoja Ventas
 * @param {Array} egresos    - filas de la hoja Egresos
 * @param {Object} config    - configuración actual
 * @param {string} periodo   - 'dia' | 'semana'
 * @returns métricas completas
 */
export function calcMetricas(ventas, egresos, config, periodo = 'dia') {
  const filtro = periodo === 'dia' ? isToday : isThisWeek

  // — Ventas del período —
  const ventasPeriodo = ventas.filter(v => filtro(v.fecha))

  let cobradoTotal = 0
  let pagoInversoresTotal = 0
  let totalQuedaLibre = 0
  const modelosDesconocidos = []
  const filasVentas = []

  for (const v of ventasPeriodo) {
    const { quedaLibre, costoInversor, comision, modeloDesconocido } = calcVenta(v, config)
    cobradoTotal += v.precio
    pagoInversoresTotal += costoInversor
    totalQuedaLibre += quedaLibre

    if (modeloDesconocido) {
      modelosDesconocidos.push(v.modelo)
    }

    filasVentas.push({
      hora: v.hora || '',
      modelo: v.modelo,
      precio: v.precio,
      costoInversor,
      comision,
      quedaLibre,
    })
  }

  // — Egresos del período —
  const egresosPeriodo = egresos.filter(e => filtro(e.fecha))
  const sueldosDia = config.sueldosMensuales / 30
  const gastosExtrasDia = egresosPeriodo
    .filter(e => e.categoria?.toLowerCase().includes('gasto'))
    .reduce((sum, e) => sum + e.monto, 0)
  const adsGastados = egresosPeriodo
    .filter(e => e.categoria?.toLowerCase().includes('anunci') || e.categoria?.toLowerCase() === 'ads')
    .reduce((sum, e) => sum + e.monto, 0)

  // — Burn fijos —
  const burnFijos = sueldosDia + gastosExtrasDia

  // — Disponible para ads —
  const disponibleAds = Math.max(0, totalQuedaLibre - burnFijos)

  // — Diferencia vs ads gastados —
  const diferencia = disponibleAds - adsGastados

  // — EBITDA —
  const ebitda = totalQuedaLibre - burnFijos - adsGastados

  // — Para semana: transferir a inversores el viernes —
  const transferenciaViernes = pagoInversoresTotal

  return {
    cobradoTotal,
    pagoInversoresTotal,
    disponibleAds,
    adsGastados,
    ebitda,
    diferencia,
    burnFijos,
    sueldosDia,
    gastosExtrasDia,
    totalQuedaLibre,
    transferenciaViernes,
    filasVentas,
    modelosDesconocidos: [...new Set(modelosDesconocidos)],
    cantidadVentas: ventasPeriodo.length,
  }
}
