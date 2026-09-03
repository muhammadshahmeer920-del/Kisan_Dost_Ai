import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Kisan Dost AI components:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          <div className="max-w-md w-full p-8 rounded-3xl border border-red-200 dark:border-red-950 bg-white dark:bg-slate-800 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100 mb-2">
              کچھ غلط ہو گیا ہے (Something Went Wrong)
            </h2>
            <p className="text-sm mb-6 text-slate-500 dark:text-slate-400">
              ایک غیر متوقع مسئلہ پیش آیا ہے۔ براہ کرم صفحہ کو دوبارہ لوڈ کریں یا اگر مسئلہ برقرار رہے تو کسان دوست ہیلپ ڈیسک سے رابطہ کریں۔
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              صفحہ ری لوڈ کریں (Reload Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
