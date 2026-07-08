import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">LostLens</span>
          <p className="footer-tagline">
            An intelligent platform designed to help reconnect people with their
            lost belongings.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <div className="footer-links-group">
            <span className="footer-links-title">Product</span>
            <Link to="/">Home</Link>
            <span className="footer-link-disabled">Browse Items</span>
            <a href="/#how-it-works">How It Works</a>
          </div>

          <div className="footer-links-group">
            <span className="footer-links-title">Account</span>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>

          <div className="footer-links-group">
            <span className="footer-links-title">About</span>
            <span className="footer-links-text">
              A college innovative design project exploring smarter ways to
              reunite people with lost items.
            </span>
          </div>
        </nav>
      </div>

      <div className="container">
        <p className="footer-copyright">© {year} LostLens. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
