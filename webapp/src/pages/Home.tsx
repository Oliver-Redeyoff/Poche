import './Home.css'
import AppHeader from '../components/AppHeader'

const Home = () => {
  return (
    <div className="page">

      <div className='above-folder-container'>
        {/* Navigation */}
        <AppHeader>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#download">Download</a>
            <a href="#extensions">Extensions</a>
            <a href="/app" className='btn btn-secondary btn-small'>
              App
              <i className="fa-solid fa-up-right-from-square btn-icon"></i>
            </a>
          </div>
        </AppHeader>

        {/* Hero Section */}
        <header className='hero'>
          <div className="hero-background">
            <div className="hero-shape hero-shape-1"></div>
            <div className="hero-shape hero-shape-2"></div>
            <div className="hero-shape hero-shape-3"></div>
          </div>
          
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">📚</span>
              <span>Your personal reading companion</span>
            </div>
            
            <h1 className="hero-title">
              Save it now.<br />
              <span className="hero-title-accent">Read it later.</span>
            </h1>
            
            <p className="hero-subtitle">
              Poche is the distraction-free read-it-later app that works everywhere. 
              Save articles from any browser, read them offline on any device. 
              No clutter, no ads—just your content.
            </p>
            
            <div className="hero-cta">
              <a href="#download" className="btn btn-primary">
                <i className="fa-solid fa-download btn-icon"></i>
                Get Poche Free
              </a>
              <a href="#features" className="btn btn-secondary">
                Learn More
              </a>
            </div>
            
            <div className="hero-platforms">
              <span className="platform-label">Available on</span>
              <div className="platform-icons">
                <span className="platform-icon" title="iOS">
                  <i className="fa-brands fa-apple"></i>
                </span>
                <span className="platform-icon" title="Android">
                  <i className="fa-brands fa-google-play"></i>
                </span>
                <span className="platform-icon" title="Chrome">
                  <i className="fa-brands fa-chrome"></i>
                </span>
                <span className="platform-icon" title="Firefox">
                  <i className="fa-brands fa-firefox-browser"></i>
                </span>
                <span className="platform-icon" title="Safari">
                  <i className="fa-brands fa-safari"></i>
                </span>
              </div>
            </div>
          </div>
          
          <div className="hero-mockup">
            <div className="mockup-phone">
              <div className="mockup-screen">
                <div className="mockup-header">
                  <div className="mockup-logo"></div>
                  <span>Poche</span>
                </div>
                <div className="mockup-article">
                  <div className="mockup-article-title"></div>
                  <div className="mockup-article-meta"></div>
                  <div className="mockup-article-line"></div>
                  <div className="mockup-article-line short"></div>
                </div>
                <div className="mockup-article">
                  <div className="mockup-article-title"></div>
                  <div className="mockup-article-meta"></div>
                  <div className="mockup-article-line"></div>
                  <div className="mockup-article-line short"></div>
                </div>
                <div className="mockup-article">
                  <div className="mockup-article-title"></div>
                  <div className="mockup-article-meta"></div>
                  <div className="mockup-article-line"></div>
                  <div className="mockup-article-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2 className="section-title">Why readers love Poche</h2>
          <p className="section-subtitle">
            A thoughtfully designed reading experience that puts your content first
          </p>
        </div>
        
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <h3 className="feature-title">Save from Anywhere</h3>
            <p className="feature-description">
              One click to save articles from Chrome, Firefox, Safari, or share directly from any mobile app. Your reading list syncs instantly.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <h3 className="feature-title">Read Offline</h3>
            <p className="feature-description">
              Articles are saved for offline reading. Perfect for flights, commutes, or anywhere without internet. Your content is always available.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-regular fa-clock"></i>
            </div>
            <h3 className="feature-title">Distraction-Free</h3>
            <p className="feature-description">
              Clean, beautiful reading experience with no ads, popups, or clutter. Just you and the content, the way reading should be.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-tags"></i>
            </div>
            <h3 className="feature-title">Organize with Tags</h3>
            <p className="feature-description">
              Add tags to organize your reading list. Filter by topic, project, or priority. Find any article in seconds.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>
            <h3 className="feature-title">Cross-Platform</h3>
            <p className="feature-description">
              Seamlessly switch between your phone, tablet, and desktop. Your reading list stays perfectly in sync across all devices.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="feature-title">Self-Hosted Option</h3>
            <p className="feature-description">
              Own your data. Host Poche on your own server with our open-source backend. Complete privacy and control.
            </p>
          </article>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download">
        <div className="download-background">
          <div className="download-shape"></div>
        </div>
        
        <div className="section-header light">
          <h2 className="section-title">Get the App</h2>
          <p className="section-subtitle">
            Download Poche for your favorite device and start saving articles today
          </p>
        </div>
        
        <div className="download-cards">
          <a href="https://apps.apple.com/app/poche" className="download-card" target="_blank" rel="noopener noreferrer">
            <div className="download-card-icon">
              <i className="fa-brands fa-apple"></i>
            </div>
            <div className="download-card-content">
              <span className="download-card-label">Download on the</span>
              <span className="download-card-title">App Store</span>
            </div>
            <div className="download-card-arrow">
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </a>
          
          <a href="https://play.google.com/store/apps/details?id=app.poche" className="download-card" target="_blank" rel="noopener noreferrer">
            <div className="download-card-icon">
              <i className="fa-brands fa-google-play"></i>
            </div>
            <div className="download-card-content">
              <span className="download-card-label">Get it on</span>
              <span className="download-card-title">Google Play</span>
            </div>
            <div className="download-card-arrow">
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </a>
        </div>
      </section>

      {/* Extensions Section */}
      <section id="extensions" className="extensions">
        <div className="section-header">
          <h2 className="section-title">Browser Extensions</h2>
          <p className="section-subtitle">
            Save articles with one click directly from your browser
          </p>
        </div>
        
        <div className="extensions-grid">
          <a href="https://chromewebstore.google.com/detail/gjecgbldlcdjkhfkhflddhbfhgdikmic" className="extension-card" target="_blank" rel="noopener noreferrer">
            <div className="extension-icon chrome">
              <i className="fa-brands fa-chrome"></i>
            </div>
            <h3 className="extension-name">Chrome</h3>
            <p className="extension-desc">For Google Chrome & Chromium browsers</p>
            <span className="extension-cta">Install Extension <i className="fa-solid fa-arrow-right"></i></span>
          </a>
          
          <a href="https://addons.mozilla.org/firefox/addon/poche" className="extension-card" target="_blank" rel="noopener noreferrer">
            <div className="extension-icon firefox">
              <i className="fa-brands fa-firefox-browser"></i>
            </div>
            <h3 className="extension-name">Firefox</h3>
            <p className="extension-desc">For Mozilla Firefox browser</p>
            <span className="extension-cta">Install Add-on <i className="fa-solid fa-arrow-right"></i></span>
          </a>
          
          <a href="https://apps.apple.com/app/poche-safari" className="extension-card" target="_blank" rel="noopener noreferrer">
            <div className="extension-icon safari">
              <i className="fa-brands fa-safari"></i>
            </div>
            <h3 className="extension-name">Safari</h3>
            <p className="extension-desc">For Apple Safari on Mac</p>
            <span className="extension-cta">Install Extension <i className="fa-solid fa-arrow-right"></i></span>
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Start saving and reading in three simple steps
          </p>
        </div>
        
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Install Poche</h3>
            <p className="step-description">
              Get the app on your phone and the extension for your browser. Create a free account in seconds.
            </p>
          </div>
          
          <div className="step-connector"></div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">Save Articles</h3>
            <p className="step-description">
              Click the Poche button when you find something interesting. Articles are automatically cleaned and formatted.
            </p>
          </div>
          
          <div className="step-connector"></div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Read Anywhere</h3>
            <p className="step-description">
              Open the app whenever you're ready. Your articles are waiting, beautifully formatted and available offline.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2 className="cta-title">Ready to reclaim your reading time?</h2>
          <p className="cta-subtitle">
            Join thousands of readers who've simplified their content consumption with Poche
          </p>
          <a href="#download" className="btn btn-primary btn-large">
            Get Started Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.png" alt="Poche" className="footer-logo" />
            <span className="footer-brand-name">Poche</span>
            <p className="footer-tagline">Save it now. Read it later.</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#download">Download</a>
              <a href="#extensions">Extensions</a>
            </div>
            
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="https://github.com/poche" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 Poche. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
