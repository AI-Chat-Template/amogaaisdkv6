"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useSession } from "next-auth/react";
import { saveFcmToken } from "@/lib/server-utils";

export function NotificationManager({ hidden = true }: { hidden?: boolean }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const { data: session, status: authStatus } = useSession();

  // Save token to backend if user is authenticated
  const saveTokenToDatabase = async (token: string) => {
    if (!session?.user || !session.user.user_catalog_id) return;
    try {
      const saveFCM = await saveFcmToken(session.user.user_catalog_id, token);
      console.log("FCM token saved successfully:", token, saveFCM);
    } catch (err) {
      console.error("Failed to save FCM token:", err);
    }
  };

  const addListeners = async () => {
    await PushNotifications.addListener("registration", (token) => {
      console.info("Registration token: ", token.value);
      setToken(token.value);
      console.log("authStatus",authStatus)
      // Save token if user is authenticated
      if (authStatus === "authenticated") {
        saveTokenToDatabase(token.value);
      }
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("Registration error: ", err.error);
      setError(err.error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push notification received: ", notification);
      }
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log(
          "Push notification action performed",
          notification.actionId,
          notification.inputValue
        );
      }
    );
  };

  const registerNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();
    setStatus(permStatus.receive);

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      // throw new Error('User denied permissions!');
      return;
    }
    try {
      await addListeners();
      await PushNotifications.register();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
    }

    // addListeners();
  };

  const getDeliveredNotifications = async () => {
    const notificationList =
      await PushNotifications.getDeliveredNotifications();
    console.log("delivered notifications", notificationList);
  };

  const sendNotification = () => {
    // Suggested code may be subject to a license. Learn more: ~LicenseLog:2344935058.
    LocalNotifications.schedule({
      notifications: [
        {
          title: "Notifi Title",
          body: "Notification Body this is good messaege",
          id: 1,
          schedule: { at: new Date(Date.now() + 2000) },
          // sound: isAndroid ? 'file://sound.mp3' : 'file://beep.wav',
        },
      ],
    }).then(() => {
      console.log("Notification scheduled");
    });
  };

  useEffect(() => {
    if (Capacitor.getPlatform() !== "web") {
      registerNotifications();
      getDeliveredNotifications();
    }
    setPlatform(Capacitor.getPlatform());
  }, [registerNotifications]);

  useEffect(() => {
    console.log("authStatus canged!",authStatus)

    if (token && authStatus === "authenticated") {
      saveTokenToDatabase(token);
    }
  }, [token, authStatus, saveTokenToDatabase]);

  return (
    <>
      {!hidden && (
        <>
          <div>
            Your push token: {token}
            <br />
            error : {error}
            <br />
            status : {status}
            <br />
            platform : {platform}
            <br />
          </div>
          <div style={{ height: "30px" }}></div>
          <button onClick={sendNotification}>Send Local Notification</button>
        </>
      )}
    </>
  );
}
