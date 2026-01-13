import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
  const lastUpdated = 'January 13, 2026'
  const contactEmail = 'privacy@poche.to'

  return (
    <div className="privacy-policy-page">
      <AppHeader>
        <Link to="/" className="back-home-link">Back to Home</Link>
      </AppHeader>

      <main className="privacy-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {lastUpdated}</p>

        <section>
          <h2>Introduction</h2>
          <p>
            Poche ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
            explains how we collect, use, and share information when you use our website (poche.to), 
            browser extension, and mobile application (collectively, the "Service").
          </p>
        </section>

        <section>
          <h2>Information We Collect</h2>
          
          <h3>Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li><strong>Email address</strong> — Used for account authentication and communication</li>
            <li><strong>Password</strong> — Stored securely using industry-standard hashing (never in plain text)</li>
            <li><strong>Display name</strong> — Optional, derived from your email if not provided</li>
          </ul>

          <h3>Article Data</h3>
          <p>When you save articles, we collect:</p>
          <ul>
            <li><strong>Article URLs</strong> — The web addresses of articles you save</li>
            <li><strong>Article content</strong> — Text, images, and metadata extracted from saved articles</li>
            <li><strong>Tags</strong> — Any tags you assign to organize your articles</li>
            <li><strong>Timestamps</strong> — When articles were saved</li>
          </ul>

          <h3>Browser Extension Data</h3>
          <p>The Poche browser extension:</p>
          <ul>
            <li>Accesses the URL of the current tab <strong>only when you click "Save Article"</strong></li>
            <li>Stores your authentication token locally to keep you signed in</li>
            <li>Caches saved article URLs locally to show "Already Saved" status</li>
            <li>Does <strong>not</strong> track your browsing history or access tabs without your action</li>
          </ul>

          <h3>Mobile App Data</h3>
          <p>The Poche mobile app:</p>
          <ul>
            <li>Stores your authentication token and article data locally for offline access</li>
            <li>May cache article images locally for faster loading</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Authenticate your account and keep you signed in</li>
            <li>Save and display your articles across devices</li>
            <li>Send password reset emails when requested</li>
            <li>Improve and optimize the Service</li>
          </ul>
          <p>
            We do <strong>not</strong> use your data for advertising, profiling, or selling to third parties.
          </p>
        </section>

        <section>
          <h2>Information Sharing</h2>
          <p>We share your information only with the following parties:</p>
          
          <h3>Service Providers</h3>
          <ul>
            <li>
              <strong>Resend</strong> — Email delivery service used to send password reset emails. 
              They receive only your email address when you request a password reset. 
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                Resend Privacy Policy
              </a>
            </li>
            <li>
              <strong>Hosting providers</strong> — Our servers and database are hosted on secure 
              infrastructure. These providers process data on our behalf and are bound by 
              data protection agreements.
            </li>
          </ul>

          <h3>Legal Requirements</h3>
          <p>
            We may disclose your information if required by law or in response to valid legal requests 
            by public authorities.
          </p>

          <p className="emphasis">
            We do <strong>not</strong> sell, rent, or share your personal information with advertisers 
            or data brokers.
          </p>
        </section>

        <section>
          <h2>Data Storage and Security</h2>
          <p>
            Your data is stored on secure servers with encryption in transit (HTTPS/TLS) and at rest. 
            Passwords are hashed using industry-standard algorithms and are never stored in plain text.
          </p>
          <p>
            While we implement reasonable security measures, no method of transmission over the Internet 
            is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>Data Retention</h2>
          <p>
            We retain your account information and saved articles for as long as your account is active. 
            If you delete your account, we will delete your personal data within 30 days, except where 
            we are required to retain it for legal purposes.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> — Request a copy of your personal data</li>
            <li><strong>Correction</strong> — Update or correct inaccurate information</li>
            <li><strong>Deletion</strong> — Request deletion of your account and associated data</li>
            <li><strong>Export</strong> — Download your saved articles</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            The Service is not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13. If we become aware that we have collected 
            personal information from a child under 13, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new policy on this page and updating the "Last updated" date. 
            We encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </section>
      </main>

      <footer className="privacy-footer">
        <p>&copy; {new Date().getFullYear()} Poche. All rights reserved.</p>
        <Link to="/">Back to Home</Link>
      </footer>
    </div>
  )
}

