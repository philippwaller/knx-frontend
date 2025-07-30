import { beforeAll } from "vitest";

beforeAll(() => {
  global.window = {} as Partial<Window>;
  global.navigator = {} as Partial<Navigator>;
});
