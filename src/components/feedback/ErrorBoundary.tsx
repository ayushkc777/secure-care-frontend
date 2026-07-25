import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // A production error-reporting adapter will be added in a later approved phase.
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="page-shell" id="main-content">
          <section className="content-card" role="alert">
            <h1>Something went wrong</h1>
            <p>The page could not be displayed. Please refresh and try again.</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
