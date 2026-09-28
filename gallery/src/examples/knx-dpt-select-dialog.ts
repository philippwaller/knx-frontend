import en from "../localize/en.json" with { type: "json" };
import type { GalleryEntry } from "../types";
import { metadata } from "./helpers";

const copy = en.dialogs["knx-dpt-select-dialog"];
export const entry: GalleryEntry = {
  meta: {
    ...metadata(
      "knx-dpt-select-dialog",
      copy,
      {},
      [],
      [],
      ["params", "onClose"],
      [
        { id: "empty", label: en.scenarios["empty"], values: {} },
        { id: "callback-reject", label: en.scenarios["callback-reject"], values: {} },
      ],
    ),
    category: "dialogs",
    api: [
      { name: "params", kind: "property", description: copy.api.params },
      { name: "onClose", kind: "callback", description: copy.api.onClose },
    ],
  },
  covers: ["knx-dpt-select-dialog"],
  async load() {
    const [{ dialogButton }, { callbackAdapter }, { createKnxFixtures }] = await Promise.all([
      import("./dialog"),
      import("../protocol"),
      import("../fixtures/knx"),
      import("../../../src/dialogs/knx-dpt-select-dialog"),
    ]);
    let scenario = "default";
    return {
      async prepare(_env, id) {
        scenario = id;
      },
      render: (env, _values, _slots, emit) =>
        dialogButton(env, emit, "knx-dpt-select-dialog", {
          title: copy.title,
          dpts: scenario === "empty" ? {} : createKnxFixtures().base.dpt_metadata,
          onClose: callbackAdapter(
            "onClose",
            emit,
            (value: string | undefined) =>
              scenario === "callback-reject" && value !== undefined
                ? Promise.reject(new Error(en.dialogs.callbackRejected))
                : value,
            (value) => value ?? null,
          ),
        }),
    };
  },
};
