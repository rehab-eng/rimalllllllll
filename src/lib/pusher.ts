import PusherClient from "pusher-js";
import type PusherServer from "pusher";

type EnvKey =
  | "PUSHER_APP_ID"
  | "PUSHER_SECRET"
  | "NEXT_PUBLIC_PUSHER_KEY"
  | "NEXT_PUBLIC_PUSHER_CLUSTER";

type BrowserPusher = PusherClient;
type ServerPusher = PusherServer;

declare global {
  var __pusherClient__: BrowserPusher | undefined;
  var __pusherServer__: ServerPusher | undefined;
}

const getEnv = (key: EnvKey): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const createPusherClient = (): BrowserPusher =>
  new PusherClient(getEnv("NEXT_PUBLIC_PUSHER_KEY"), {
    cluster: getEnv("NEXT_PUBLIC_PUSHER_CLUSTER"),
  });

const createPusherServer = async (): Promise<ServerPusher> => {
  const { default: Pusher } = await import("pusher");

  return new Pusher({
    appId: getEnv("PUSHER_APP_ID"),
    key: getEnv("NEXT_PUBLIC_PUSHER_KEY"),
    secret: getEnv("PUSHER_SECRET"),
    cluster: getEnv("NEXT_PUBLIC_PUSHER_CLUSTER"),
    useTLS: true,
  });
};

export const getPusherClient = (): BrowserPusher => {
  if (typeof window === "undefined") {
    throw new Error("getPusherClient must be called in the browser.");
  }

  globalThis.__pusherClient__ ??= createPusherClient();

  return globalThis.__pusherClient__;
};

export const getPusherServer = async (): Promise<ServerPusher> => {
  if (typeof window !== "undefined") {
    throw new Error("getPusherServer must be called on the server.");
  }

  globalThis.__pusherServer__ ??= await createPusherServer();

  return globalThis.__pusherServer__;
};
