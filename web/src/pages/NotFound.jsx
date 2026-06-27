import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ fontSize: '4rem', color: '#e2e8f0' }}>404</h1>
      <p>Page not found</p>
      <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
}
