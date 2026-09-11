export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <ul className="pagination">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <li key={p}>
          <a className={p === page ? 'active' : ''} onClick={() => onChange(p)}>{p}</a>
        </li>
      ))}
    </ul>
  );
}
