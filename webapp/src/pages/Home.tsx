import { useState, useEffect } from 'react'
import './Home.css'
import AppHeader from '../components/AppHeader'

const Home = () => {
  return (
    <div className="page">
      {/* Navigation */}
      <AppHeader>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#download">Download</a>
          <a href="#extensions">Extensions</a>
          <a href="/app">App</a>
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
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
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
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </span>
              <span className="platform-icon" title="Android">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.341c-.5 0-.909-.409-.909-.909v-4.545c0-.5.409-.909.909-.909s.909.409.909.909v4.545c0 .5-.409.909-.909.909zm-11.046 0c-.5 0-.909-.409-.909-.909v-4.545c0-.5.409-.909.909-.909s.909.409.909.909v4.545c0 .5-.409.909-.909.909zm11.273-8.182l1.273-2.318c.091-.182.045-.409-.136-.5-.182-.091-.409-.045-.5.136l-1.318 2.409c-1.045-.5-2.227-.795-3.5-.795s-2.455.295-3.5.795l-1.318-2.409c-.091-.182-.318-.227-.5-.136-.182.091-.227.318-.136.5l1.273 2.318c-2.091 1.136-3.5 3.227-3.5 5.636h14.773c0-2.409-1.409-4.5-3.5-5.636zm-7.227 3.182c-.25 0-.455-.205-.455-.455s.205-.455.455-.455.455.205.455.455-.205.455-.455.455zm5 0c-.25 0-.455-.205-.455-.455s.205-.455.455-.455.455.205.455.455-.205.455-.455.455zm-8.682 2.727v6.364c0 .5.409.909.909.909h.909v2.727c0 .5.409.909.909.909s.909-.409.909-.909v-2.727h1.818v2.727c0 .5.409.909.909.909s.909-.409.909-.909v-2.727h.909c.5 0 .909-.409.909-.909v-6.364h-9.091z"/>
                </svg>
              </span>
              <span className="platform-icon" title="Chrome">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.178-5.598A11.977 11.977 0 0 0 24 12c0-.063-.003-.125-.004-.188zm-3.273 1.91a2.727 2.727 0 1 0 0 5.455 2.727 2.727 0 0 0 0-5.454z"/>
                </svg>
              </span>
              <span className="platform-icon" title="Firefox">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.006.003a11.988 11.988 0 00-6.539 1.93l.107.065c.205.118.41.245.61.383a7.173 7.173 0 01.464.335l.033.025a7.06 7.06 0 01.6.504l.045.042a7.17 7.17 0 01.515.53l.035.04a7.17 7.17 0 01.435.55l.023.032a7.52 7.52 0 01.39.58l.013.022c.12.193.232.393.335.598l.008.018c.1.204.19.413.272.627l.006.016c.037.097.071.196.104.295l.015-.026a3.092 3.092 0 00-.256-.385 3.1 3.1 0 00-.36-.405 3.11 3.11 0 00-.436-.356l-.013-.01a3.1 3.1 0 00-.485-.276l-.02-.01a3.1 3.1 0 00-.518-.19l-.024-.007a3.18 3.18 0 00-.542-.097l-.023-.003a3.14 3.14 0 00-.545-.006l-.025.002a3.15 3.15 0 00-.535.068l-.028.006a3.16 3.16 0 00-.516.147l-.028.01a3.16 3.16 0 00-.483.223l-.026.014a3.17 3.17 0 00-.44.294l-.023.018a3.18 3.18 0 00-.386.358l-.018.02a3.18 3.18 0 00-.323.412l-.015.022a3.18 3.18 0 00-.254.457l-.01.023a3.19 3.19 0 00-.18.49l-.007.026a3.24 3.24 0 00-.103.515l-.003.027a3.22 3.22 0 00-.025.534v.028c.008.178.028.354.06.528l.006.028c.035.174.082.346.14.514l.01.028c.06.168.13.334.21.494l.013.028c.082.16.174.316.274.466l.016.026c.102.15.213.296.332.434l.019.024c.12.138.25.27.386.395l.021.02c.138.126.283.245.435.356l.024.018c.152.112.311.216.476.312l.025.015c.166.097.338.186.515.267l.026.012c.179.082.362.155.55.22l.027.01c.19.065.382.12.579.168l.027.006c.197.048.398.087.601.117l.027.004c.204.03.41.05.618.062l.027.002c.21.012.421.014.632.007h.028a6.03 6.03 0 00.64-.044l.026-.004a6.02 6.02 0 00.636-.103l.025-.006a6.01 6.01 0 00.625-.162l.023-.008a6 6 0 00.607-.22l.02-.008a6 6 0 00.582-.277l.016-.01a5.99 5.99 0 00.551-.33l.012-.008a5.99 5.99 0 00.514-.38l.008-.007a5.98 5.98 0 00.47-.426l.004-.004a5.98 5.98 0 00.422-.466 11.998 11.998 0 00-6.531-18.028 12.01 12.01 0 00-.015-.003z"/>
                </svg>
              </span>
              <span className="platform-icon" title="Safari">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-2c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.276-4.635l1.445-5.12 5.12-1.445-1.444 5.12-5.121 1.445zm.898-4.222l-.539 1.91 1.91-.54.538-1.91-1.91.54zM12 4.5l.4 1.2-.4 1.2-.4-1.2.4-1.2zm0 12.6l.4 1.2-.4 1.2-.4-1.2.4-1.2zm7.5-7.5l1.2.4-1.2.4-1.2-.4 1.2-.4zm-15 0l1.2.4-1.2.4-1.2-.4 1.2-.4z"/>
                </svg>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3 className="feature-title">Save from Anywhere</h3>
            <p className="feature-description">
              One click to save articles from Chrome, Firefox, Safari, or share directly from any mobile app. Your reading list syncs instantly.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <line x1="12" y1="2" x2="12" y2="1"/>
              </svg>
            </div>
            <h3 className="feature-title">Read Offline</h3>
            <p className="feature-description">
              Articles are saved for offline reading. Perfect for flights, commutes, or anywhere without internet. Your content is always available.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 className="feature-title">Distraction-Free</h3>
            <p className="feature-description">
              Clean, beautiful reading experience with no ads, popups, or clutter. Just you and the content, the way reading should be.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                <line x1="16" y1="8" x2="2" y2="22"/>
                <line x1="17.5" y1="15" x2="9" y2="15"/>
              </svg>
            </div>
            <h3 className="feature-title">Organize with Tags</h3>
            <p className="feature-description">
              Add tags to organize your reading list. Filter by topic, project, or priority. Find any article in seconds.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <h3 className="feature-title">Cross-Platform</h3>
            <p className="feature-description">
              Seamlessly switch between your phone, tablet, and desktop. Your reading list stays perfectly in sync across all devices.
            </p>
          </article>
          
          <article className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
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
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div className="download-card-content">
              <span className="download-card-label">Download on the</span>
              <span className="download-card-title">App Store</span>
            </div>
            <div className="download-card-arrow">→</div>
          </a>
          
          <a href="https://play.google.com/store/apps/details?id=app.poche" className="download-card" target="_blank" rel="noopener noreferrer">
            <div className="download-card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
            </div>
            <div className="download-card-content">
              <span className="download-card-label">Get it on</span>
              <span className="download-card-title">Google Play</span>
            </div>
            <div className="download-card-arrow">→</div>
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
          <a href="https://chrome.google.com/webstore/detail/poche" className="extension-card" target="_blank" rel="noopener noreferrer">
            <div className="extension-icon chrome">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.178-5.598A11.977 11.977 0 0 0 24 12c0-.063-.003-.125-.004-.188zm-3.273 1.91a2.727 2.727 0 1 0 0 5.455 2.727 2.727 0 0 0 0-5.454z"/>
              </svg>
            </div>
            <h3 className="extension-name">Chrome</h3>
            <p className="extension-desc">For Google Chrome & Chromium browsers</p>
            <span className="extension-cta">Install Extension →</span>
          </a>
          
          <a href="https://addons.mozilla.org/firefox/addon/poche" className="extension-card" target="_blank" rel="noopener noreferrer">
            <div className="extension-icon firefox">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.567 6.247c.322.548.556 1.135.697 1.75-.38-.31-.826-.534-1.31-.66-.124-.033-.25-.06-.376-.082a5.846 5.846 0 00-.65-1.194c.617.007 1.2.063 1.639.186zm-3.175-1.85c.21.082.422.176.634.283.158.08.315.168.47.263-.22-.035-.438-.051-.65-.051-.303 0-.592.037-.858.105.131-.204.268-.404.404-.6zm-1.66.82c-.353.337-.658.758-.878 1.25a4.472 4.472 0 00-.372-.04c-.335-.02-.663.015-.97.095-.148-.396-.24-.803-.27-1.205.33-.06.682-.1 1.05-.1.502 0 .983.037 1.44.105v-.105zm-3.624.79c.156.094.313.2.47.317-.208.08-.408.176-.596.288a4.948 4.948 0 00-1.248 1.006 5.735 5.735 0 00-.312-.58c.51-.56 1.09-.962 1.686-1.03zm-.744 3.056c.088.122.183.238.285.348a4.56 4.56 0 00-.54 1.22 5.768 5.768 0 00-.165 1.23c-.31-.312-.57-.68-.76-1.095a4.08 4.08 0 01-.178-.56 5.058 5.058 0 011.358-1.143zm.4 3.536a4.457 4.457 0 00.476 1.016c.15.232.322.448.51.647-.606.104-1.184.31-1.7.608a5.83 5.83 0 01-.295-1.094 5.94 5.94 0 01-.06-.795c.35-.155.695-.29 1.069-.382zm1.938 2.47c.358.166.738.293 1.133.373-.187.35-.41.678-.67.978a5.807 5.807 0 01-1.168-.368c.26-.315.502-.65.705-1.003zm2.587.86c.464-.007.92-.063 1.36-.165a5.76 5.76 0 01-.8 1.062c-.35.093-.715.145-1.088.145a5.94 5.94 0 01-.68-.04c.397-.303.796-.65 1.208-1.002z"/>
              </svg>
            </div>
            <h3 className="extension-name">Firefox</h3>
            <p className="extension-desc">For Mozilla Firefox browser</p>
            <span className="extension-cta">Install Add-on →</span>
          </a>
          
          <a href="https://apps.apple.com/app/poche-safari" className="extension-card" target="_blank" rel="noopener noreferrer">
            <div className="extension-icon safari">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-2c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.276-4.635l1.445-5.12 5.12-1.445-1.444 5.12-5.121 1.445zm.898-4.222l-.539 1.91 1.91-.54.538-1.91-1.91.54zM12 4.5l.4 1.2-.4 1.2-.4-1.2.4-1.2zm0 12.6l.4 1.2-.4 1.2-.4-1.2.4-1.2zm7.5-7.5l1.2.4-1.2.4-1.2-.4 1.2-.4zm-15 0l1.2.4-1.2.4-1.2-.4 1.2-.4z"/>
              </svg>
            </div>
            <h3 className="extension-name">Safari</h3>
            <p className="extension-desc">For Apple Safari on Mac</p>
            <span className="extension-cta">Install Extension →</span>
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
              <a href="/privacy">Privacy Policy</a>
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

