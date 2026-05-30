import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="page page--centered">
      <h1>404</h1>
      <p className="muted">La página que buscás no existe.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </section>
  )
}
