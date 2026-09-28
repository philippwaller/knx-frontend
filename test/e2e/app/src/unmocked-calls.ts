import type { Connection } from "home-assistant-js-websocket";

import type { MockHomeAssistant } from "@ha/fake_data/provide_hass";

declare global {
  interface Window {
    /** WebSocket command types sent without a registered mock, in order. */
    __unmockedCalls: string[];
  }
}

// provideHass rejects unmocked commands with this code. Registry collections swallow the
// rejection, so without this record a missing mock only shows up as an empty table.
const isNotMocked = (err: unknown) =>
  (err as { code?: string } | undefined)?.code === "command_not_mocked";

/** Records every WebSocket command sent without a mock in `window.__unmockedCalls`. */
export const trackUnmockedCalls = (hass: MockHomeAssistant) => {
  window.__unmockedCalls = [];
  const connection: Connection = hass.connection;

  const sendMessagePromise = connection.sendMessagePromise.bind(connection);
  connection.sendMessagePromise = (async (
    ...args: Parameters<Connection["sendMessagePromise"]>
  ) => {
    try {
      return await sendMessagePromise(...args);
    } catch (err) {
      if (isNotMocked(err)) {
        window.__unmockedCalls.push(args[0].type);
      }
      throw err;
    }
  }) as Connection["sendMessagePromise"];

  const subscribeMessage = connection.subscribeMessage.bind(connection);
  connection.subscribeMessage = (async (...args: Parameters<Connection["subscribeMessage"]>) => {
    try {
      return await subscribeMessage(...args);
    } catch (err) {
      if (isNotMocked(err)) {
        window.__unmockedCalls.push(args[1].type);
      }
      throw err;
    }
  }) as Connection["subscribeMessage"];
};
