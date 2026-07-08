import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Any navigation (link click) inside the mobile menu should close it.
  const closeMenu = () => setIsMenuOpen(false)

  // "How It Works" scrolls to a section on the Home page. If we're on a
  // different page, navigate home first, then let the browser handle the hash.
  const handleHowItWorksClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    closeMenu()
    if (location.pathname === '/') {
      event.preventDefault()
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      event.preventDefault()
      navigate('/#how-it-works')
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo" aria-label="LostLens home">
          LostLens
        </Link>

        <nav
          className={`navbar-links ${isMenuOpen ? 'navbar-links-open' : ''}`}
          aria-label="Primary"
          onClick={closeMenu}
        >
          <NavLink to="/" end className="navbar-link">
            Home
          </NavLink>
          <span
            className="navbar-link navbar-link-disabled"
            title="Browse Items is coming soon"
          >
            Browse Items
          </span>
          <a href="/#how-it-works" className="navbar-link" onClick={handleHowItWorksClick}>
            How It Works
          </a>

          {/* Auth actions live inside the collapsible menu on mobile only */}
          <div className="navbar-mobile-actions">
            <Link to="/login" className="btn btn-secondary btn-block">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-block">
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="btn btn-secondary">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          className="navbar-toggle"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
          <span className="navbar-toggle-bar" />
        </button>
      </div>
    </header>
  )
}

export default Navbar
