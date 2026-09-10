import React from 'react';
import ErrorState from '../ErrorState/ErrorState';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error('Captured by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, info: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem 1rem', maxWidth: 800, margin: '0 auto' }}>
          <ErrorState
            error={this.state.error}
            title="Application Error Encountered"
            onRetry={this.handleReload}
            showDiagnostics
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;