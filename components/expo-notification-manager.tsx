"use client";

import { useEffect, useState, useCallback } from "react";
import { getUserServerSession, saveFcmToken } from "@/lib/server-utils";
import { Session } from "next-auth";

// Extend the Window interface to include ReactNativeWebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string, targetOrigin?: string) => void;
    };
  }
}

export function ExpoNotificationManager({
  hidden = true,
}: {
  hidden?: boolean;
}) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState("unauthenticated");

  // Save token to backend if user is authenticated
  const saveTokenToDatabase = useCallback(
    async (token: string) => {
      if (!session?.user || !session.user.user_catalog_id) return;
      try {
        const saveFCM = await saveFcmToken(session.user.user_catalog_id, token);
        console.log("FCM token saved successfully:", token, saveFCM);
      } catch (err) {
        setError("Failed to save FCM token");
        setStatus("error");
        console.error("Failed to save FCM token:", err);
      }
    },
    [session]
  );

  useEffect(() => {
    // Only run if inside an iframe
    // Request the Expo push token from the parent (Expo WebView)
    if (!window.ReactNativeWebView) {
      setError(
        "ReactNativeWebView is not available. This component should be used inside an Expo WebView."
      );
      setStatus("unavailable");
      return;
    }

    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "getExpoToken" })
    );

    // Listen for the token response
    const handleMessage = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.type === "expoPushToken" && data.token) {
          //   alert("Expo push token received: " + data.token);
          if (data.token !== token) {
            setToken(data.token);
            setStatus("received");
            setError(null);
            if (authStatus === "authenticated") {
              saveTokenToDatabase(data.token);
            }
          }
        }
      } catch {
        setError("Invalid token message received");
        setStatus("error");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [authStatus, session, saveTokenToDatabase, token]);

  useEffect(() => {
    setLoginStatus(authStatus);
    if (token && authStatus === "authenticated") {
      saveTokenToDatabase(token);
    }
  }, [token, authStatus, saveTokenToDatabase]);

  useEffect(() => {
    getUserServerSession().then(({ session, status }) => {
      setSession(session);
      setAuthStatus(status);
    });
  }, []);

  return (
    <>
      {!hidden && (
        <div>
          Your Expo push token: {token}
          <br />
          error : {error}
          <br />
          status : {status}
          <br />
          loginStatus : {loginStatus}
        </div>
      )}
    </>
  );
}
