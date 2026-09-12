const staffMembers = [
  {
    name: 'Abubakar Ahmed',
    position: 'Founder & Director',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Abubakar Ahmed',
    position: 'Operations Manager',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Abdulmalik Aminu',
    position: 'Training Coordinator',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  },
];

export default function About() {
  return (
    <section id="about" className="landing-section">
      <div className="section-heading">
        <span className="eyebrow">About us</span>
        <h2>We make learning and service delivery simple and effective.</h2>
      </div>

      <div className="info-grid two-col">
        <div className="info-card">
          <h3>Our mission</h3>
          <p>
            To create a platform where training, administration, and customer service work together
            seamlessly so everyone can grow with clarity and confidence.
          </p>
        </div>

        <div className="info-card">
          <h3>Why choose us</h3>
          <p>
            We combine practical guidance, efficient operations, and responsive support to make
            each step of your journey smoother and more rewarding.
          </p>
        </div>
      </div>

      <div className="staff-section">
        <div className="section-heading small-heading">
          <span className="eyebrow">Our team</span>
          <h2>Meet our staff</h2>
        </div>

        <div className="staff-grid">
          {staffMembers.map((member) => (
            <div key={member.name} className="staff-card">
              <img src={member.image} alt={member.name} className="staff-image" />
              <h3>{member.name}</h3>
              <p>{member.position}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
