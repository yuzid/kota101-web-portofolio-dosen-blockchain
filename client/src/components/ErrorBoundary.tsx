import React from "react";
import { ErrorPage } from "./ErrorPage";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function classifyError(error: Error): "TOKEN_EXPIRED" | "NETWORK_ERROR" | "500" | "GENERIC" {
  const msg = (error.message || "").toLowerCase();

  if (msg.includes("sesi") || msg.includes("token") || msg.includes("expired") || msg.includes("unauthorized")) {
    return "TOKEN_EXPIRED";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch") || msg.includes("econnrefused") || msg.includes("load")) {
    return "NETWORK_ERROR";
  }

  return "500";
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = classifyError(this.state.error);
      return <ErrorPage errorCode={errorType} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
