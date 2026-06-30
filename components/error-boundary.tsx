"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Luxion UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="grid min-h-[50vh] place-items-center p-6">
          <Card className="max-w-md text-center">
            <CardContent className="grid gap-4 p-6">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-200" aria-hidden />
              <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
              <p className="text-sm text-zinc-400">
                {this.state.error.message || "An unexpected error occurred in this module."}
              </p>
              <Button
                onClick={() => this.setState({ error: null })}
                variant="secondary"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
