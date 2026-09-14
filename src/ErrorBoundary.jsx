// ErrorBoundary.jsx — red de seguridad ante un fallo de carga real: el juego
// encadena varias cargas asincronas -bloques GLB del terreno, mixer 3D con
// strict:true, atlas de VFX, musica- y sin esto un fallo en cualquiera de
// ellas tumbaba TODA la app a pantalla en blanco sin ningun mensaje.
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary atrapo un error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="error-boundary">
        <p className="error-boundary-title">Axie · Dados de Lunacia</p>
        <p className="error-boundary-text">
          Algo se rompio al cargar la partida. Puede ser un asset (modelo 3D,
          musica) que no ha llegado a tiempo.
        </p>
        <button type="button" className="error-boundary-retry" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    )
  }
}
