import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Błąd aplikacji React:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-boundary">
          <div className="card">
            <h1>Coś poszło nie tak</h1>
            <p>Odśwież stronę i spróbuj ponownie. Jeżeli problem wraca, skontaktuj się z obsługą.</p>
            <button className="btn-primary" type="button" onClick={() => window.location.reload()}>Odśwież stronę</button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
