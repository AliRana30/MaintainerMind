import { EventEmitter } from "events";

declare global {
  var notificationEmitter: EventEmitter | undefined;
}

export const notificationEmitter = globalThis.notificationEmitter || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.notificationEmitter = notificationEmitter;
}
