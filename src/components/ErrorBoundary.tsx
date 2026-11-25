import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E2E8F0] rounded-xl p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1F65ED] mb-2">
              simplybiznest.com
            </p>
            <h1 className="text-xl font-bold text-[#0C1A38] mb-3">
              Application State Needs Refresh
            </h1>
            <p className="text-sm text-[#475569] mb-6 leading-relaxed">
              We encountered an error processing your request. Please reload the page or contact{' '}
              <a href="mailto:info@simplybiznest.com" className="text-[#1F65ED] underline">
                info@simplybiznest.com
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#0C1A38] text-white text-sm font-medium rounded-lg hover:bg-[#1F65ED] transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
