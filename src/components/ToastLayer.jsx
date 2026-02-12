import React from "react";

export default function ToastLayer({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 items-center">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg max-w-[90vw] sm:max-w-md ${
            toast.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.tone === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-zinc-200 text-zinc-800"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
