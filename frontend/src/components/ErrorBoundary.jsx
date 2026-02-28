import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-navy text-center px-4">
                    <div className="glass rounded-2xl p-10 max-w-md">
                        <div className="text-6xl mb-4">⚡</div>
                        <h2 className="text-2xl font-display font-bold text-gold mb-3">Something went wrong</h2>
                        <p className="text-gray-400 mb-6">An unexpected error occurred. Please refresh the page.</p>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
