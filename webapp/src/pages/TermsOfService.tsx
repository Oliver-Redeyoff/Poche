import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import './PrivacyPolicy.css'

export default function TermsOfService() {
  const lastUpdated = 'March 29, 2026'
  const contactEmail = 'support@poche.to'

  return (
    <div className="privacy-policy-page">
      <AppHeader>
        <Link to="/" className="back-home-link">Back to Home</Link>
      </AppHeader>

      <main className="privacy-content">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {lastUpdated}</p>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing or using Poche ("the Service"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2>Description of Service</h2>
          <p>
            Poche is a "read it later" application that allows you to save articles from the web and read
            them on your mobile device or in your browser. The Service includes the Poche mobile app,
            browser extensions, and website.
          </p>
        </section>

        <section>
          <h2>Accounts</h2>
          <p>
            You must create an account to use the Service. You are responsible for maintaining the
            confidentiality of your account credentials and for all activity that occurs under your account.
            You must notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            You must provide a valid email address when creating an account. You may not create accounts
            using automated means or impersonate any person or entity.
          </p>
        </section>

        <section>
          <h2>Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any laws</li>
            <li>Save or distribute content that infringes on intellectual property rights</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Use the Service to distribute malware or engage in phishing</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Scrape or automate access to the Service beyond normal personal use</li>
          </ul>
        </section>

        <section>
          <h2>Subscriptions and Billing</h2>
          <p>
            Poche offers a free tier and a premium subscription ("Poche Plus"). Subscription pricing and
            features are described in the app. Subscriptions are billed through the Apple App Store and
            are subject to Apple's terms and refund policies.
          </p>
          <p>
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the
            current billing period. You can manage or cancel your subscription in your device's App Store
            account settings.
          </p>
        </section>

        <section>
          <h2>Content</h2>
          <p>
            The Service saves copies of publicly accessible web articles for your personal reading use.
            We do not claim ownership of any content you save. You are responsible for ensuring your use
            of saved content complies with applicable copyright laws.
          </p>
          <p>
            We reserve the right to remove content that violates these terms or applicable law.
          </p>
        </section>

        <section>
          <h2>Termination</h2>
          <p>
            You may delete your account at any time from within the app. We reserve the right to suspend
            or terminate accounts that violate these terms, with or without notice.
          </p>
          <p>
            Upon termination, your right to use the Service ceases immediately and your data will be
            deleted in accordance with our <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2>Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, either express or implied.
            We do not warrant that the Service will be uninterrupted, error-free, or free of harmful
            components.
          </p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Poche shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2>Changes to These Terms</h2>
          <p>
            We may update these Terms of Service from time to time. We will notify you of material changes
            by posting the updated terms on this page and updating the "Last updated" date. Continued use
            of the Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
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
