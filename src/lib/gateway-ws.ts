import WebSocket from "ws";
import { createPrivateKey, sign, randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const GATEWAY_WS_URL =
  process.env.OPENCLAW_GATEWAY_WS_URL || "ws://127.0.0.1:18789";
const GATEWAY_TOKEN =
  process.env.OPENCLAW_GATEWAY_TOKEN ||
  "8eba7157f01cc07c6e19e8439149edeb6148b758cd20dc69";

interface DeviceIdentity {
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
}

let cachedDevice: DeviceIdentity | null = null;

function loadDeviceIdentity(): DeviceIdentity {
  if (cachedDevice) return cachedDevice;
  const devicePath =
    process.env.OPENCLAW_DEVICE_IDENTITY ||
    join(homedir(), ".openclaw", "identity", "device.json");
  const raw = readFileSync(devicePath, "utf-8");
  cachedDevice = JSON.parse(raw);
  return cachedDevice!;
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function signPayload(privateKeyPem: string, payload: string): string {
  const key = createPrivateKey(privateKeyPem);
  const signature = sign(null, Buffer.from(payload, "utf8"), key);
  return base64UrlEncode(signature);
}

function buildDeviceAuthPayload(opts: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token: string | null;
  nonce?: string;
}): string {
  const version = opts.nonce ? "v2" : "v1";
  const base = [
    version,
    opts.deviceId,
    opts.clientId,
    opts.clientMode,
    opts.role,
    opts.scopes.join(","),
    String(opts.signedAtMs),
    opts.token ?? "",
  ];
  if (version === "v2") base.push(opts.nonce ?? "");
  return base.join("|");
}

export interface GatewayConnection {
  ws: WebSocket;
  request: (
    method: string,
    params: Record<string, unknown>
  ) => Promise<unknown>;
  onEvent: (handler: (event: string, payload: unknown) => void) => void;
  onClose: (handler: () => void) => void;
  close: () => void;
}

// ── Persistent singleton connection ──
let sharedConnection: GatewayConnection | null = null;
let connectingPromise: Promise<GatewayConnection> | null = null;

function createRawConnection(): Promise<GatewayConnection> {
  return new Promise((resolve, reject) => {
    const device = loadDeviceIdentity();
    const ws = new WebSocket(GATEWAY_WS_URL);
    let reqCounter = 0;
    const pending = new Map<
      string,
      { resolve: (v: unknown) => void; reject: (e: Error) => void }
    >();
    const eventHandlers: Array<(event: string, payload: unknown) => void> = [];
    const closeHandlers: Array<() => void> = [];
    let connected = false;

    const nextId = () => `wc-${++reqCounter}-${Date.now()}`;

    const sendReq = (
      method: string,
      params: Record<string, unknown>
    ): Promise<unknown> => {
      const id = nextId();
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ type: "req", id, method, params }));
      });
    };

    const sendConnect = (nonce?: string) => {
      const signedAt = Date.now();
      const clientId = "cli";
      const clientMode = "cli";
      const role = "operator";
      const scopes = ["operator.admin", "operator.write", "operator.approvals"];

      const payload = buildDeviceAuthPayload({
        deviceId: device.deviceId,
        clientId,
        clientMode,
        role,
        scopes,
        signedAtMs: signedAt,
        token: GATEWAY_TOKEN,
        nonce,
      });
      const signature = signPayload(device.privateKeyPem, payload);

      return sendReq("connect", {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: clientId,
          version: "1.0.0",
          platform: process.platform,
          mode: clientMode,
          instanceId: randomUUID(),
        },
        role,
        scopes,
        caps: [],
        auth: { token: GATEWAY_TOKEN },
        device: {
          id: device.deviceId,
          publicKey: device.publicKeyPem,
          signature,
          signedAt: signedAt,
          nonce,
        },
      });
    };

    const conn: GatewayConnection = {
      ws,
      request: sendReq,
      onEvent: (handler) => { eventHandlers.push(handler); },
      onClose: (handler) => { closeHandlers.push(handler); },
      close: () => ws.close(),
    };

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "event") {
          if (msg.event === "connect.challenge") {
            const nonce = msg.payload?.nonce;
            sendConnect(nonce)
              .then(() => {
                connected = true;
                resolve(conn);
              })
              .catch((err) => {
                ws.close();
                reject(err);
              });
            return;
          }
          for (const h of eventHandlers) h(msg.event, msg.payload);
          return;
        }

        if (msg.type === "res") {
          const handler = pending.get(msg.id);
          if (handler) {
            pending.delete(msg.id);
            if (msg.ok) {
              handler.resolve(msg.payload);
            } else {
              handler.reject(new Error(msg.error?.message || "RPC error"));
            }
          }
        }
      } catch { /* skip */ }
    });

    ws.on("error", (err: Error) => {
      if (!connected) reject(err);
    });

    ws.on("close", () => {
      // Clear singleton so next request reconnects
      if (sharedConnection === conn) {
        sharedConnection = null;
        connectingPromise = null;
      }
      for (const [, handler] of pending) {
        handler.reject(new Error("WebSocket closed"));
      }
      pending.clear();
      for (const h of closeHandlers) h();
    });

    setTimeout(() => {
      if (!connected) {
        ws.close();
        reject(new Error("Connection timeout"));
      }
    }, 5000);
  });
}

/**
 * Returns a shared, persistent WebSocket connection to the gateway.
 * Reconnects automatically if the connection was closed.
 */
export async function connectToGateway(): Promise<GatewayConnection> {
  // Reuse live connection
  if (sharedConnection && sharedConnection.ws.readyState === WebSocket.OPEN) {
    return sharedConnection;
  }

  // Wait for in-progress connection
  if (connectingPromise) {
    return connectingPromise;
  }

  // Create new connection
  connectingPromise = createRawConnection().then((conn) => {
    sharedConnection = conn;
    connectingPromise = null;
    return conn;
  }).catch((err) => {
    connectingPromise = null;
    throw err;
  });

  return connectingPromise;
}
