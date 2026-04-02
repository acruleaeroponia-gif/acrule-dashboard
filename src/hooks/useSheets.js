/**
 * Hook: useSheets
 * Lee las hojas Ventas y Egresos de Google Sheets API v4.
 * Refresca cada 5 minutos, silenciosamente.
 * Si falla, conserva el último dato cacheado e indica cuándo fue.
 *
 * Estructura real de las hojas de ACRULE:
 *
 * Ventas: Año | Fecha | Mes | Cliente | Sexo | Tipo de venta | N°Orden |
 *         Detalle | Modelo | lo que paga | Comisiones | LO QUE COBRO | Estado | ...
 *
 * Egresos: Año | Mes | Fecha | Egreso Ingreso | Razon Social | Nro Factura |
 *          Tipo Factura | Categoria | Producto | Detalle | Cantidad |
 *          Precio Unitario | Total Bruto | IVA | Total Neto | Estado | ...
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const REFRESH_MS = 5 * 60 * 1000  // 5 minutos
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID
const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// ─── Conversor de fecha "D-mes" → "YYYY-MM-DD" ──────────────────────────────

const MESES = {
  ene: '01', feb: '02', mar: '03', abr: '04',
  may: '05', jun: '06', jul: '07', ago: '08',
  sep: '09', oct: '10', nov: '11', dic: '12',
}

/**
 * Convierte "1-ene", "15-feb", "31-dic" → "2026-01-01", "2026-02-15", etc.
 * También acepta "DD/MM/YYYY" y "YYYY-MM-DD".
 */
function parseDate(str, year = new Date().getFullYear()) {
  if (!str) return null
  const s = String(str).trim().toLowerCase()

  // Formato "D-mes" o "DD-mes" (ej: "1-ene", "15-feb")
  const match = s.match(/^(\d{1,2})-([a-z]+)$/)
  if (match) {
    const day = match[1].padStart(2, '0')
    const mes = MESES[match[2]]
    if (mes) return `${year}-${mes}-${day}`
  }

  // Formato DD/MM/YYYY
  if (s.includes('/')) {
    const parts = s.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }

  // Ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  return null
}

function parseNum(str) {
  if (!str) return 0
  const s = String(str).replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim()
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

// ─── Normalización de categorías de egresos ──────────────────────────────────

/**
 * Normaliza el nombre de categoría al formato que espera la lógica de cálculo.
 * La hoja usa: "Anuncios (Meta, Google)", "Otros Gastos", "Sueldos y Jornales", etc.
 */
function normalizarCategoria(cat) {
  const c = String(cat).toLowerCase().trim()
  if (c.includes('anunci') || c.includes('meta') || c.includes('google ads')) return 'Anuncios'
  if (c.includes('sueldo') || c.includes('jornal') || c.includes('personal')) return 'Sueldos'
  if (c.includes('gasto') || c.includes('otros') || c.includes('extra')) return 'Gastos extras'
  return cat // dejar el original si no matchea
}

// ─── Parsers de hojas ────────────────────────────────────────────────────────

/**
 * Parsea filas de la hoja Ventas de ACRULE.
 * Detecta columnas por nombre de header automáticamente.
 */
function parseVentas(rows) {
  if (!rows || rows.length < 2) return []
  const [header, ...data] = rows

  const col = (names) => {
    for (const name of (Array.isArray(names) ? names : [names])) {
      const idx = header.findIndex(h =>
        String(h).toLowerCase().trim().includes(name.toLowerCase())
      )
      if (idx >= 0) return idx
    }
    return null
  }

  // Columnas reales de la hoja: Fecha | Modelo | lo que paga | Comisiones
  const iFecha    = col('fecha') ?? 1
  const iModelo   = col('modelo') ?? 8
  const iPrecio   = col(['lo que paga', 'precio cobrado', 'precio']) ?? 9
  const iComision = col('comision') ?? 10

  // Intentar detectar el año de la primera fila de datos para la conversión de fecha
  const anoRow = data.find(r => r[0] && !isNaN(parseInt(r[0])))
  const year = anoRow ? parseInt(anoRow[0]) : new Date().getFullYear()

  return data
    .filter(row => row[iFecha] && row[iPrecio])
    .map(row => ({
      fecha: parseDate(String(row[iFecha] || ''), year),
      hora: '',  // La hoja no tiene columna hora — se puede agregar después
      modelo: String(row[iModelo] || '').trim(),
      precio: parseNum(row[iPrecio]),
      comision: parseNum(row[iComision] ?? 0),
    }))
    .filter(v => v.fecha) // descartar filas sin fecha válida
}

/**
 * Parsea filas de la hoja Egresos de ACRULE.
 * Columnas reales: Año | Mes | Fecha | ... | Categoria | ... | Total Neto
 */
function parseEgresos(rows) {
  if (!rows || rows.length < 2) return []
  const [header, ...data] = rows

  const col = (names) => {
    for (const name of (Array.isArray(names) ? names : [names])) {
      const idx = header.findIndex(h =>
        String(h).toLowerCase().trim().includes(name.toLowerCase())
      )
      if (idx >= 0) return idx
    }
    return null
  }

  const iFecha     = col('fecha') ?? 2
  const iCategoria = col(['categor', 'categoria']) ?? 7
  const iMonto     = col(['total neto', 'total bruto', 'monto', 'importe']) ?? 14

  const anoRow = data.find(r => r[0] && !isNaN(parseInt(r[0])))
  const year = anoRow ? parseInt(anoRow[0]) : new Date().getFullYear()

  return data
    .filter(row => row[iFecha] && row[iMonto])
    .map(row => ({
      fecha: parseDate(String(row[iFecha] || ''), year),
      categoria: normalizarCategoria(String(row[iCategoria] || '')),
      monto: parseNum(row[iMonto]),
    }))
    .filter(e => e.fecha)
}

// ─── Fetch de una hoja via Sheets API v4 ────────────────────────────────────

async function fetchSheet(token, sheetName) {
  const url = `
API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Error leyendo hoja "${sheetName}": ${err.error?.message || res.status}`)
  }
  const data = await res.json()
  return data.values || []
}

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useSheets(token) {
  const [ventas, setVentas] = useState([])
  const [egresos, setEgresos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [stale, setStale] = useState(false)

  const timerRef = useRef(null)
  const tokenRef = useRef(token)
  tokenRef.current = token

  const fetchAll = useCallback(async (showLoading = true) => {
    const t = tokenRef.current
    if (!t) return

    if (showLoading) setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const [ventasRows, egresosRows] = await Promise.all([
        fetchSheet(t, 'Ventas'),
        fetchSheet(t, 'Egresos'),
      ])
      clearTimeout(timeout)
      setVentas(parseVentas(ventasRows))
      setEgresos(parseEgresos(egresosRows))
      setLastUpdated(new Date())
      setStale(false)
    } catch (err) {
      clearTimeout(timeout)
      if (err.name === 'AbortError') {
        setError('La hoja tardó más de 10 s. Mostrando último dato cacheado.')
      } else {
        setError(err.message)
      }
      setStale(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetchAll(true)
    timerRef.current = setInterval(() => fetchAll(false), REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, [token, fetchAll])

  return { ventas, egresos, loading, error, lastUpdated, stale, refetch: () => fetchAll(true) }
}
