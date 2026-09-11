const services = [
  {
    title: 'JAMB Internship Programs',
    description: 'Structured placements, support, and progress tracking for JAMB interns building real-world skills.',
  },
  {
    title: 'Customer Support',
    description: 'A responsive and reliable support experience that helps customers get help when they need it.',
  },
  {
    title: 'Training & Development',
    description: 'Hands-on learning opportunities designed to strengthen technical and professional capabilities.',
  },
  {
    title: 'Operations Management',
    description: 'Simple tools and workflows that make administration, reporting, and monitoring easier to manage.',
  },
];

export default function Services() {
  return (
    <section id="services" className="landing-section alt-bg">
      <div className="section-heading">
        <span className="eyebrow">Our services</span>
        <h2>Solutions designed for growth and productivity.</h2>
      </div>

      <div className="service-grid">
        {services.map((service) => (
          <div key={service.title} className="service-card">
            <div className="service-icon">✓</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
