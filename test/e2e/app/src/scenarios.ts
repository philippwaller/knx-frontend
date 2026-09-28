import type { KnxFixtures } from "./fixtures";
import { defaultFixtures } from "./fixtures";

/**
 * Named variants of the fixture data, selected with `?scenario=<name>`. Add one when a test needs
 * a different backend state; keep the default realistic.
 */
const SCENARIOS = {
  default: defaultFixtures,
  "no-project": (): KnxFixtures => {
    const fixtures = defaultFixtures();
    return {
      ...fixtures,
      baseData: { ...fixtures.baseData, project_info: null },
      project: null,
      groupMonitorInfo: { ...fixtures.groupMonitorInfo, project_loaded: false },
    };
  },
} satisfies Record<string, () => KnxFixtures>;

export type ScenarioName = keyof typeof SCENARIOS;

/** Fixtures for a `?scenario=` value; unknown names throw so typos cannot pass silently. */
export const resolveScenario = (name: string | null): KnxFixtures => {
  if (name === null) {
    return SCENARIOS.default();
  }
  if (!Object.prototype.hasOwnProperty.call(SCENARIOS, name)) {
    throw new Error(
      `Unknown e2e scenario "${name}". Known scenarios: ${Object.keys(SCENARIOS).join(", ")}`,
    );
  }
  return SCENARIOS[name as ScenarioName]();
};
