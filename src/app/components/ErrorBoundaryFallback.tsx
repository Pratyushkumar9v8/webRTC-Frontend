import { useRouteError } from "react-router";
import { AlertTriangle } from "lucide-react";

export function ErrorBoundaryFallback() {
  const error: any = useRouteError();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#07080F] p-4 text-center">
      <div className="max-w-md w-full bg-[#0D1117] rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-[#EEF1F8] mb-2">Oops! Something went wrong</h1>
        <p className="text-sm text-[#7E8BA3] mb-8 line-clamp-3">
          {error?.message || error?.statusText || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 active:scale-95 w-full"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
