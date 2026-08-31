import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // you could also log to an external service here
    this.setState({ error, info });
    // console.error('Captured by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    // reset state and optionally reload
    this.setState({ hasError: false, error: null, info: null });
    // try a full reload to recover from broken state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 900, margin: '2rem auto', background: 'var(--panel, #0f1f2b)', borderRadius: 12, color: '#edf6ff' }}>
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p style={{ color: 'var(--muted, #a9bfd8)' }}>{String(this.state.error?.message || 'An unexpected error occurred.')}</p>
          <details style={{ color: 'var(--muted, #a9bfd8)', whiteSpace: 'pre-wrap' }}>
            {this.state.info?.componentStack}
          </details>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={this.handleReload} style={{ padding: '8px 10px', fontWeight: 700 }}>Reload page</button>
            <button onClick={() => this.setState({ hasError: false, error: null, info: null })} style={{ padding: '8px 10px' }}>Dismiss</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;