import type { ConfigEntry } from "@ha/data/config_entries";

export const KNX_CONFIG_ENTRY_ID = "e2e-knx-entry";

export const knxConfigEntry: ConfigEntry = {
  entry_id: KNX_CONFIG_ENTRY_ID,
  domain: "knx",
  title: "KNX",
  source: "user",
  state: "loaded",
  supports_options: true,
  supports_remove_device: true,
  supports_unload: true,
  supports_reconfigure: true,
  supported_subentry_types: {},
  num_subentries: 0,
  pref_disable_new_entities: false,
  pref_disable_polling: false,
  disabled_by: null,
  reason: null,
  error_reason_translation_domain: null,
  error_reason_translation_key: null,
  error_reason_translation_placeholders: null,
};
