export default function BrandPanel() {
  return (
    <div className="split-brand">
      <div className="split-brand-icon"><i className="fa-solid fa-book-open" /></div>
      <h1>A.A Dynamic Computer Training Center</h1>
      <p className="tagline">
        Empowering Katsina with digital skills. From basic computing to advanced
        programming, and comprehensive walk-in services.
      </p>
      <div className="split-brand-features">
        <div className="split-brand-feature">
          <div className="feat-icon"><i className="fa-solid fa-graduation-cap" /></div>
          <div>Professional computer training programs and certification.</div>
        </div>
        <div className="split-brand-feature">
          <div className="feat-icon"><i className="fa-solid fa-print" /></div>
          <div>Walk-in services: Printing, Scanning, Typing, and more.</div>
        </div>
      </div>
    </div>
  );
}
