export default function Contact() {
  return (
    <section id="contact" className="landing-section">
      <div className="section-heading">
        <span className="eyebrow">Contact</span>
        <h2>Let’s talk about your goals.</h2>
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <p><strong>Email:</strong> support@abdulmalikacademy.com</p>
          <p><strong>Phone:</strong> +234 800 000 0000</p>
          <p><strong>Location:</strong> Abuja, Nigeria</p>
        </div>

        <form className="contact-form">
          <input type="text" placeholder="Your name" aria-label="Your name" />
          <input type="email" placeholder="Your email" aria-label="Your email" />
          <textarea rows="4" placeholder="Your message" aria-label="Your message" />
          <button type="button" className="btn btn-primary">Send message</button>
        </form>
      </div>
    </section>
  );
}
