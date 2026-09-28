// Tasks to run rspack.

import log from "fancy-log";
import fs from "fs";
import gulp from "gulp";
import rspack from "@rspack/core";
import { RspackDevServer } from "@rspack/dev-server";
import paths from "../paths.cjs";
import { createE2ETestAppConfig, createKNXConfig } from "../rspack.cjs";

const bothBuilds = (createConfigFunc, params) => [
  createConfigFunc({ ...params, latestBuild: true }),
  createConfigFunc({ ...params, latestBuild: false }),
];

const isWsl =
  fs.existsSync("/proc/version") &&
  fs.readFileSync("/proc/version", "utf-8").toLocaleLowerCase().includes("microsoft");

gulp.task("ensure-knx-build-dir", (done) => {
  if (!fs.existsSync(paths.knx_output_root)) {
    fs.mkdirSync(paths.knx_output_root, { recursive: true });
  }
  if (!fs.existsSync(paths.app_output_root)) {
    fs.mkdirSync(paths.app_output_root, { recursive: true });
  }
  done();
});

const doneHandler = (done) => (err, stats) => {
  if (err) {
    log.error(err.stack || err);
    if (err.details) {
      log.error(err.details);
    }
    return;
  }

  if (stats.hasErrors() || stats.hasWarnings()) {
    console.log(stats.toString("minimal"));
  }

  log(`Build done @ ${new Date().toLocaleTimeString()}`);

  if (done) {
    done();
  }
};

const prodBuild = (conf) =>
  new Promise((resolve) => {
    rspack(
      conf,
      // Resolve promise when done. Because we pass a callback, rspack closes itself
      doneHandler(resolve),
    );
  });

gulp.task("rspack-watch-knx", () => {
  // This command will run forever because we don't close compiler
  rspack(
    createKNXConfig({
      isProdBuild: false,
      latestBuild: true,
    }),
  ).watch({ ignored: /build/, poll: isWsl }, doneHandler());
});

gulp.task("rspack-prod-knx", () =>
  prodBuild(
    bothBuilds(createKNXConfig, {
      isProdBuild: true,
    }),
  ),
);

const E2E_TEST_APP_PORT = 8095;

// Unlike prodBuild, rejects on compile errors: a broken harness must fail the build instead of
// serving a blank page to the tests.
const strictProdBuild = (conf) =>
  new Promise((resolve, reject) => {
    rspack(conf, (err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors()) {
        reject(new Error(stats.toString("errors-only")));
      } else {
        if (stats.hasWarnings()) {
          console.log(stats.toString("minimal"));
        }
        log(`Build done @ ${new Date().toLocaleTimeString()}`);
        resolve();
      }
    });
  });

gulp.task("rspack-prod-e2e-test-app", () =>
  strictProdBuild(createE2ETestAppConfig({ isProdBuild: true })),
);

gulp.task("rspack-dev-server-e2e-test-app", async () => {
  const server = new RspackDevServer(
    {
      hot: false,
      open: false,
      host: "localhost",
      port: E2E_TEST_APP_PORT,
      static: {
        directory: paths.e2e_test_app_output_root,
        watch: true,
      },
      // The panel routes by path (/knx/…); every page request gets the harness index.html.
      historyApiFallback: true,
      client: {
        overlay: {
          runtimeErrors: (error) => !error?.message?.includes("ResizeObserver loop"),
        },
      },
    },
    rspack(createE2ETestAppConfig({ isProdBuild: false })),
  );
  await server.start();
  log("[rspack-dev-server]", `E2E test app is running at http://localhost:${E2E_TEST_APP_PORT}`);
});
