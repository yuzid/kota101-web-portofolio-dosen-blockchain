import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

interface ServerResponse {
  status: string;
  message: string;
  timestamp: string;
  server: string;
}

function App() {
  const [count, setCount] = useState(0)
  const [serverStatus, setServerStatus] = useState<ServerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Test koneksi ke backend saat component mount
  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/status')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ServerResponse = await response.json()
        setServerStatus(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal terhubung ke server')
        setServerStatus(null)
      } finally {
        setLoading(false)
      }
    }

    fetchServerStatus()
  }, [])

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Portfolio Dosen Blockchain</h1>
          <p>Client-Server Communication Test</p>
        </div>

        {/* Server Connection Status */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h2>🔗 Backend Connection Status</h2>
          {loading && <p>⏳ Connecting to backend...</p>}
          {error && (
            <div style={{ color: 'red', padding: '1rem', backgroundColor: '#ffe0e0', borderRadius: '4px' }}>
              ❌ Error: {error}
            </div>
          )}
          {serverStatus && (
            <div style={{ color: 'green', padding: '1rem', backgroundColor: '#e0ffe0', borderRadius: '4px' }}>
              ✅ {serverStatus.message}
              <ul style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                <li><strong>Status:</strong> {serverStatus.status}</li>
                <li><strong>Server:</strong> {serverStatus.server}</li>
                <li><strong>Timestamp:</strong> {serverStatus.timestamp}</li>
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn React
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
