"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function WhatsAppCallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorMessage = searchParams.get("error_message");

  useEffect(() => {
    if (code) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "oauth-code",
            code: code,
          },
          window.location.origin,
        );
      }
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    } else if (error || errorCode) {
      // Handle error
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "oauth-error",
            error: errorMessage || error,
            code: errorCode,
          },
          window.location.origin,
        );
      }
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [code, error, errorCode, errorMessage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center space-y-4">
        {code ? (
          <>
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-800">
              Authenticating...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete the setup.
            </p>
            <p className="text-xs text-gray-400">
              This window will close automatically.
            </p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-5xl mb-2">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800">
              Connection Failed
            </h2>
            <p className="text-red-600 bg-red-50 p-3 rounded text-sm">
              {errorMessage ||
                error ||
                "Unknown error occurred during checking OAuth callback."}
            </p>
            <p className="text-gray-600">
              Please close this window and try again.
            </p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 text-sm font-medium"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
