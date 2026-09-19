const staffMembers = [
  {
    name: 'Abubakar Ahmed',
    position: 'Founder & Director',
    image: 'https://i.ibb.co/0bTK9mV/abu.png',
  },
  {
    name: 'Ibrahim Yusuf (NARARA)',
    position: 'patron',
    image: 'https://i.ibb.co/cXk6Bhyf/honorable.png',
  },
  {
    name: 'Abdulmalik Aminu',
    position: 'Training Coordinator',
    image: 'https://i.ibb.co/1tmhfH5S/3108c11f-6f49-4077-85f6-0b104511ac27-0-watermark.jpg',
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
