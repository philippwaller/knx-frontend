import type { Connection } from "home-assistant-js-websocket";

import type { MockHomeAssistant } from "@ha/fake_data/provide_hass";

declare global {
  interface Window {
    /** WebSocket command types sent without a registered mock, in order. */
    __unmockedCalls: string[];
    /** In-flight WebSocket command count and the last time one started or settled. */
    __wsActivity: { inFlight: number; lastActivity: number };
  }
}

// provideHass rejects unmocked commands with this code. Registry collections swallow the
// rejection, so without this record a missing mock only shows up as an empty table.
const isNotMocked = (err: unknown) =>
  (err as { code?: string } | undefined)?.code === "command_not_mocked";

/**
 * Records every WebSocket command sent without a mock in `window.__unmockedCalls`, and tracks
 * WebSocket activity in `window.__wsActivity` so tests can wait for the connection to go idle
 * before asserting on the recorded commands.
 */
export const trackUnmockedCalls = (hass: MockHomeAssistant) => {
  window.__unmockedCalls = [];
  window.__wsActivity = { inFlight: 0, lastActivity: performance.now() };
  const connection: Connection = hass.connection;

  const sendMessagePromise = connection.sendMessagePromise.bind(connection);
  connection.sendMessagePromise = (async (
    ...args: Parameters<Connection["sendMessagePromise"]>
  ) => {
    window.__wsActivity.inFlight++;
    window.__wsActivity.lastActivity = performance.now();
    try {
      return await sendMessagePromise(...args);
    } catch (err) {
      if (isNotMocked(err)) {
        window.__unmockedCalls.push(args[0].type);
      }
      throw err;
    } finally {
      window.__wsActivity.inFlight--;
      window.__wsActivity.lastActivity = performance.now();
    }
  }) as Connection["sendMessagePromise"];

  const subscribeMessage = connection.subscribeMessage.bind(connection);
  connection.subscribeMessage = (async (...args: Parameters<Connection["subscribeMessage"]>) => {
    window.__wsActivity.inFlight++;
    window.__wsActivity.lastActivity = performance.now();
    try {
      return await subscribeMessage(...args);
    } catch (err) {
      if (isNotMocked(err)) {
        window.__unmockedCalls.push(args[1].type);
      }
      throw err;
    } finally {
      window.__wsActivity.inFlight--;
      window.__wsActivity.lastActivity = performance.now();
    }
  }) as Connection["subscribeMessage"];
};
