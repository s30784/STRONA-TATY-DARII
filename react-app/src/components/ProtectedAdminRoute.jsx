import { Link } from 'react-router-dom';
import { Message } from './Message.jsx';

export function ProtectedAdminRoute({ authReady, currentProfile, children }) {
  if (!authReady) {
    return (
      <div className="page active">
        <section className="section">
          <div className="loading-box">Sprawdzam uprawnienia...</div>
        </section>
      </div>
    );
  }

  if (currentProfile?.role !== 'admin') {
    return (
      <div className="page active">
        <section className="section admin-guard">
          <Message message={{ type: 'err', text: 'Ten widok jest dostępny tylko dla administratora.' }} />
          <Link className="btn-outline" to="/">Wróć na stronę główną</Link>
        </section>
      </div>
    );
  }

  return children;
}
