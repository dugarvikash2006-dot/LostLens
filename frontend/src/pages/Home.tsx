import './Home.css'

// Mock data only — Phase 1 is frontend-only, no AI, no API calls.

const steps = [
  {
    title: 'Report',
    description: 'Upload details and a photo of your lost or found item.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 16V4m0 0-4 4m4-4 4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Smart Matching',
    description: 'LostLens compares images, descriptions, locations, and dates.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="8" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: 'Verify',
    description: 'Review potential matches and complete secure ownership verification.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m5 12.5 4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Reunite',
    description: 'Coordinate the return and close the case successfully.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20s-6.5-4.1-9-8.2C1.2 8.6 2.5 5 6 5c2 0 3.3 1 4 2 0-1 2-2 4-2 3.5 0 4.8 3.6 3 6.8C18.5 15.9 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

const matchingFactors = [
  { label: 'Visual Similarity', description: 'Compares photos to find items that look alike.' },
  { label: 'Description Similarity', description: 'Reads written details to catch matching wording.' },
  { label: 'Location Proximity', description: 'Weighs how close the lost and found spots are.' },
  { label: 'Date Proximity', description: 'Considers how close the reported dates are.' },
]

const scoreBreakdown = [
  { label: 'Visual Similarity', value: 92 },
  { label: 'Description Similarity', value: 85 },
  { label: 'Location Match', value: 90 },
  { label: 'Date Proximity', value: 88 },
]

const recentItems = [
  { name: 'Black Wireless Headphones', status: 'Found', category: 'Electronics', location: 'Library, 2nd Floor', date: 'Jul 3' },
  { name: 'Blue Water Bottle', status: 'Lost', category: 'Personal Item', location: 'Sports Complex', date: 'Jul 2' },
  { name: 'Student ID Card', status: 'Found', category: 'Documents', location: 'Cafeteria', date: 'Jul 1' },
  { name: 'Laptop Charger', status: 'Lost', category: 'Electronics', location: 'Room B-204', date: 'Jun 29' },
  { name: 'Brown Wallet', status: 'Found', category: 'Personal Item', location: 'Main Gate', date: 'Jun 28' },
  { name: 'Silver Keychain', status: 'Lost', category: 'Accessories', location: 'Parking Lot', date: 'Jun 27' },
] as const

function Home() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero section">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Lost something? We&apos;ll help you find it.</h1>
            <p className="hero-subtext">
              LostLens intelligently matches lost and found items using images,
              descriptions, location, and date.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary">
                Report Lost Item
              </button>
              <button type="button" className="btn btn-secondary">
                Report Found Item
              </button>
            </div>
            <button type="button" className="hero-browse-link">
              Browse Reported Items →
            </button>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="match-card match-card-lost">
              <span className="badge badge-lost">Lost</span>
              <div className="match-card-thumb" />
              <p className="match-card-title">Blue Water Bottle</p>
              <p className="match-card-meta">Sports Complex · Jul 2</p>
            </div>

            <div className="match-connector">
              <span className="match-connector-line" />
              <span className="match-connector-score">91%</span>
              <span className="match-connector-line" />
            </div>

            <div className="match-card match-card-found">
              <span className="badge badge-found">Found</span>
              <div className="match-card-thumb" />
              <p className="match-card-title">Blue Water Bottle</p>
              <p className="match-card-meta">Near Sports Complex · Jul 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Process</span>
            <h2>How LostLens Works</h2>
            <p>Four simple steps take a report from submission to a reunited item.</p>
          </div>

          <ol className="steps-grid">
            {steps.map((step, index) => (
              <li className="step-card" key={step.title}>
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="step-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- INTELLIGENT MATCHING ---------------- */}
      <section className="section matching-section">
        <div className="container matching-inner">
          <div className="matching-copy">
            <span className="eyebrow">Matching Engine</span>
            <h2>Intelligent Matching, Clear Results</h2>
            <p>
              Instead of relying on keywords alone, LostLens combines several
              signals to surface the most likely matches between lost and found
              reports.
            </p>

            <ul className="matching-factors">
              {matchingFactors.map((factor) => (
                <li key={factor.label}>
                  <span className="matching-factor-dot" aria-hidden="true" />
                  <div>
                    <p className="matching-factor-label">{factor.label}</p>
                    <p className="matching-factor-description">{factor.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="sample-match-card card">
            <div className="sample-match-header">
              <span className="eyebrow" style={{ marginBottom: 0 }}>
                Potential Match
              </span>
              <span className="sample-match-score">89% Match</span>
            </div>
            <h3 className="sample-match-title">Black Wireless Headphones</h3>

            <div className="sample-match-breakdown">
              {scoreBreakdown.map((row) => (
                <div className="score-row" key={row.label}>
                  <div className="score-row-labels">
                    <span>{row.label}</span>
                    <span>{row.value}%</span>
                  </div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="sample-match-note">
              Match scores are suggestions and do not confirm ownership.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- RECENT ITEMS ---------------- */}
      <section id="browse" className="section recent-items">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Community Reports</span>
            <h2>Recently Reported Items</h2>
            <p>A preview of items reported lost or found by the community.</p>
          </div>

          <div className="items-grid">
            {recentItems.map((item) => (
              <div className="item-card card" key={item.name}>
                <div className="item-card-thumb">
                  <span
                    className={`badge ${item.status === 'Lost' ? 'badge-lost' : 'badge-found'}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="item-card-body">
                  <h3 className="item-card-title">{item.name}</h3>
                  <p className="item-card-meta">{item.category}</p>
                  <p className="item-card-meta">{item.location}</p>
                  <p className="item-card-meta">{item.date}</p>
                  <button type="button" className="btn btn-secondary btn-block">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="section cta-section">
        <div className="container cta-inner">
          <h2>Lost something or found something?</h2>
          <p>
            Create a report and let LostLens help connect the right item with
            the right person.
          </p>
          <div className="cta-actions">
            <button type="button" className="btn btn-primary">
              Report Lost Item
            </button>
            <button type="button" className="btn btn-secondary btn-on-dark">
              Report Found Item
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
