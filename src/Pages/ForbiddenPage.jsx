import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div style={{ maxWidth: 540, margin: '4rem auto', padding: 24, textAlign: 'center' }}>
      <h2>Access denied</h2>
      <p>You do not have permission to view this page.</p>
      <Link to="/" style={{ color: '#0b5fff', fontWeight: 600 }}>Return to dashboard</Link>
    </div>
  );
}
