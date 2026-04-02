import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import ConfigPanel from './components/ConfigPanel'
import { useSheets } from './hooks/useSheets'
import { loadConfig } from './utils/config'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly'

// ─── Google Identity Services helpers ───────────────────────────────────────

function initGoogleAuth(callback) {
  if (!window.google) return
  return window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback,
  })
}

// ─── Pantalla de login ───────────────────────────────────────────────────────

function LoginScreen({ onLogin, loading }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Acrule Dashboard</h1>
        <p className="text-slate-400 mt-2">Dashboard financiero diario</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4">
        <p className="text-slate-300 text-sm text-center">
          Iniciá sesión con tu cuenta de Google para ver los datos de la planilla en tiempo real.
        </p>
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="text-sm">Conectando…</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>
      </div>

      {!CLIENT_ID && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 w-full max-w-sm text-red-300 text-xs">
          ⚠ <strong>VITE_GOOGLE_CLIENT_ID</strong> no está configurado. Copiá <code>.env.example</code> como <code>.env</code> y completá tu Client ID.
        </div>
      )}
    </div>
  )
}

// ─── App principal ───────────────────────────────────────────────────────────

export default function App() {
  const [token, setToken] = useState(null)
  const [tokenClient, setTokenClient] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [config, setConfig] = useState(() => loadConfig())
  const [showConfig, setShowConfig] = useState(false)
  const [gisReady, setGisReady] = useState(false)

  // Esperar a que cargue el script de Google Identity Services
  useEffect(() => {
    const check = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true)
        clearInterval(check)
      }
    }, 200)
    return () => clearInterval(check)
  }, [])

  // Inicializar token client cuando GIS esté listo
  useEffect(() => {
    if (!gisReady || !CLIENT_ID) return
    const client = initGoogleAuth((tokenResponse) => {
      if (tokenResponse.error) {
        setLoginLoading(false)
        console.error('Auth error:', tokenResponse)
        return
      }
      setToken(tokenResponse.access_token)
      setLoginLoading(false)
    })
    setTokenClient(client)
  }, [gisReady])

  const handleLogin = useCallback(() => {
    if (!tokenClient) return
    setLoginLoading(true)
    tokenClient.requestAccessToken()
  }, [tokenClient])

  // Usar el hook de Sheets
  const { ventas, egresos, loading, error, lastUpdated, stale, refetch } = useSheets(token)

  // ── Render ──
  if (!token) {
    return <LoginScreen onLogin={handleLogin} loading={loginLoading} />
  }

  return (
    <>
      {loading && !lastUpdated && (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">🌀</div>
            <p className="text-slate-300 text-sm">Cargando datos de la planilla…</p>
          </div>
        </div>
      )}

      {(lastUpdated || error) && (
        <Dashboard
          ventas={ventas}
          egresos={egresos}
          config={config}
          lastUpdated={lastUpdated}
          stale={stale}
          error={error}
          onOpenConfig={() => setShowConfig(true)}
        />
      )}

      {showConfig && (
        <ConfigPanel
          config={config}
          onClose={() => setShowConfig(false)}
          onSave={(newConfig) => {
            setConfig(newConfig)
            setShowConfig(false)
          }}
        />
      )}
    </>
  )
}
