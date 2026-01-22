import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import './Support.css'

export default function Support() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const supportEmail = 'support@bloxd.io'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    const mailtoSubject = encodeURIComponent(subject || 'Support Request')
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    )
    
    window.location.href = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`
  }

  return (
    <div className="support-page">
      <AppHeader>
        <Link to="/" className="back-home-link">Back to Home</Link>
      </AppHeader>

      <main className="support-content">
        <h1>Contact Support</h1>
        <p className="support-intro">
          Have a question, found a bug, or need help with Poche? Fill out the form below 
          and we'll get back to you as soon as possible.
        </p>

        <form className="support-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            <i className="fa-solid fa-envelope btn-icon"></i>
            Send Message
          </button>
        </form>

        <div className="support-alternative">
          <p>
            You can also email us directly at{' '}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
        </div>
      </main>

      <footer className="support-footer">
        <p>&copy; {new Date().getFullYear()} Poche. All rights reserved.</p>
        <Link to="/">Back to Home</Link>
      </footer>
    </div>
  )
}
