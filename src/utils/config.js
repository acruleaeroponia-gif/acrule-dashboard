// Configuración inicial por defecto — adaptada a los modelos reales de ACRULE

export const DEFAULT_CONFIG = {
  // Porcentajes fijos (usados en el cálculo por venta)
  enviosPct: 0.17,      // 17% envíos
  impuestosPct: 0.04,   // 4%  impuestos

  // Sueldos mensuales fijos
  sueldosMensuales: 6500000,

  /**
   * Límites de presupuesto expresados como % sobre lo cobrado.
   * El usuario los puede editar desde el panel de configuración.
   * La suma total es 100% — cada peso cobrado tiene destino.
   */
  budgetPct: {
    inversores:  45,   // Costo materia prima / pago a inversores
    envios:      17,   // Envíos (calculado por venta)
    comisiones:  16,   // Comisiones MercadoLibre / Web
    sueldos:      6.8, // Sueldos y jornales
    anuncios:     8.8, // Anuncios Meta + Google
    impuestos:    4,   // Impuestos (calculado por venta)
    otrosGastos:  2.4, // Otros gastos / materiales
  },

  /**
   * Costos por modelo — nombres exactos tal como aparecen en la hoja Ventas.
   * Los marcados con *** necesitan que confirmes el costo inversor.
   */
  costosPorModelo: {
    '12 Insumos':           0,        // Insumos → sin costo inversor
    '13 Huerta Acr 12P':    126829,
    '14 Huerta Acr 24P':    149441,
    '14 Huerta Acr 32P':    172053,
    '16 Huerta Acr Led 28P':240686,
    '17 Upsell 12P':        22612,
    '18 Torre V 20':        0,        // *** confirmar costo
    '19 Torre V 64':        0,        // *** confirmar costo
    '20 Torre V 48':        0,        // *** confirmar costo
    '22 NFT 138':           0,        // *** confirmar costo
    '24 NFT P 48':          0,        // *** confirmar costo
    '25 NFT P 72':          0,        // *** confirmar costo
    '30 Extra':             0,        // Extra → sin costo inversor
    '31 NFT 288':           0,        // *** confirmar costo
    '32 Mini Baige':        30787,    // Mini Huerta Nacional
    '32 Mini Gris':         81337,    // Mini Huerta China
    '33 Torre 1.0':         247342,
  },
}

const STORAGE_KEY = 'acrule_config'

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const saved = JSON.parse(raw)
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      costosPorModelo: {
        ...DEFAULT_CONFIG.costosPorModelo,
        ...(saved.costosPorModelo || {}),
      },
      budgetPct: {
        ...DEFAULT_CONFIG.budgetPct,
        ...(saved.budgetPct || {}),
      },
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
