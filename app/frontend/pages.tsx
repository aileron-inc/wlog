import React, { Component } from "react";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

const pages = import.meta.glob("./pages/**/*.tsx", { eager: true }) as Record<
  string,
  { default: React.ComponentType }
>;

type EBProps = { children: React.ReactNode };
type EBState = { error: Error | null };

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="bg-white rounded-xl border border-red-200 shadow-sm max-w-2xl w-full mx-4 p-6">
            <div className="flex items-start justify-between">
              <h1 className="text-lg font-bold text-red-700">エラーが発生しました</h1>
              <button
                onClick={() => {
                  const text = `# Error Report\n\n## Summary\n- **Class**: ${err.name}\n- **Message**: ${err.message}\n\n## Stack\n${err.stack || ""}`;
                  navigator.clipboard.writeText(text);
                }}
                className="shrink-0 ml-4 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                クリップボードにコピー
              </button>
            </div>
            <pre className="mt-3 text-xs text-slate-700 bg-red-50 rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono leading-relaxed">
              {err.message}
            </pre>
            {err.stack && (
              <details className="mt-4">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700">
                  Stack Trace
                </summary>
                <pre className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono leading-relaxed max-h-60">
                  {err.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default () => {
  const appElement = document.getElementById("app");
  if (!appElement) return;

  createInertiaApp({
    resolve: (name) => {
      const page = pages[`./pages/${name}.tsx`];
      if (!page) {
        throw new Error(`Page not found: ${name}`);
      }
      return page.default;
    },
    title: (title) => (title ? `${title} | Wlog` : "Wlog"),
    setup({ el, App, props }) {
      createRoot(el).render(
        <ErrorBoundary>
          <App {...props} />
        </ErrorBoundary>
      );
    },
  });
};
