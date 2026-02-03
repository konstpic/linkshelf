import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

function getInitialTheme() {
  try {
    const v = localStorage.getItem('linkshelf_theme')
    if (v === 'light' || v === 'dark') return v
    if (v === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {}
  return 'dark'
}
document.documentElement.setAttribute('data-theme', getInitialTheme())

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24,
          background: '#1a1a24',
          color: '#e5e5ea',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ color: '#ef4444' }}>Ошибка загрузки</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
