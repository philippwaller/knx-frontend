import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.dialogs["knx-group-monitor-telegram-info-dialog"];
export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-group-monitor-telegram-info-dialog",
      copy,
      {},
      [],
      ["dialog-closed", "hass-automation-editor"],
      ["params"],
      [],
    ),
    category: "dialogs",
  },
  covers: ["knx-group-monitor-telegram-info-dialog"],
  async load() {
    const [{ dialogButton }, { createDialogTelegrams }, telegramRows] = await Promise.all([
      import("./dialog"),
      import("../fixtures/telegrams"),
      import("../../../src/features/group-monitor/types/telegram-row"),
      import("../../../src/features/group-monitor/dialogs/telegram-info-dialog"),
    ]);
    return {
      render: (env, _values, _slots, emit) => {
        const rows = createDialogTelegrams().map(
          (telegram) => new telegramRows.TelegramRow(telegram),
        );
        return dialogButton(env, emit, "knx-group-monitor-telegram-info-dialog", {
          knx: env.knx,
          narrow: matchMedia("(max-width: 870px)").matches,
          telegram: rows[0],
          filteredTelegrams: rows,
        });
      },
    };
  },
};
