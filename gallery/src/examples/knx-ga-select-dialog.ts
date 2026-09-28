import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.dialogs["knx-ga-select-dialog"];
export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-ga-select-dialog",
      copy,
      {},
      [],
      [],
      ["params", "onClose"],
      [{ id: "empty", label: en.scenarios["empty"], values: {} }],
    ),
    category: "dialogs",
    api: [
      { name: "params", kind: "property", description: copy.api.params },
      { name: "onClose", kind: "callback", description: copy.api.onClose },
    ],
  },
  covers: ["knx-ga-select-dialog"],
  async load() {
    const [{ dialogButton }, { callbackAdapter }, { createKnxFixtures }] = await Promise.all([
      import("./dialog"),
      import("../protocol"),
      import("../fixtures/knx"),
      import("../../../src/dialogs/knx-ga-select-dialog"),
    ]);
    let scenario = "default";
    return {
      async prepare(_env, id) {
        scenario = id;
      },
      render: (env, _values, _slots, emit) =>
        dialogButton(env, emit, "knx-ga-select-dialog", {
          title: copy.title,
          groupAddresses:
            scenario === "empty" ? [] : Object.values(createKnxFixtures().project.group_addresses),
          onClose: callbackAdapter(
            "onClose",
            emit,
            (value: string | undefined) => value,
            (value) => value ?? null,
          ),
        }),
    };
  },
};
