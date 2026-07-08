import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <section className="not-found section">
      <div className="container not-found-inner">
        <p className="not-found-code">404</p>
        <h1>Page not found</h1>
        <p className="not-found-text">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Return Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound
