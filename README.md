# KNX UI

This is the KNX panel for the KNX core integration in Home Assistant. It
provides a user interface for interacting with the KNX integration.

## Development

If you check out this repository for the first time please run the following command to init the submodules:

```shell
$ nvm use
$ script/bootstrap
...
```

### Development build (watcher)

```shell
$ script/develop
...
```

### Production build

```shell
$ script/build
...
```

### Update the home assistant frontend

Get the latest release tag.

```shell
$ script/upgrade-frontend
...
```

Or get a specific tag or sha.

```shell
$ script/upgrade-frontend <tag-or-sha>
...
```

### End-to-end tests

Playwright tests load the KNX panel in a real browser. A small test app hosts the panel with a
fake `hass` and mocked KNX WebSocket commands, so no Home Assistant instance is needed.

Install the browser once (on Linux add `--with-deps`):

```shell
$ yarn playwright install chromium
...
```

Run the suite. Playwright builds the test app and serves it on port 8095, or reuses a server
that already answers there:

```shell
$ yarn test:e2e:app
...
```

For a fast loop, keep a watching dev server running in one terminal and run single tests from
another:

```shell
$ yarn test:e2e:app:dev
...
$ yarn test:e2e:app -g "dpt_reference" --project=chromium
...
```

`--ui` opens Playwright's interactive mode and `E2E_WORKERS` sets the number of local workers.
`yarn test:e2e` runs all suites and merges their reports; `yarn test:e2e:show-report` opens the
result. Traces, screenshots and videos of failed tests are written to `test/e2e/test-results/`.

In CI the `E2E` workflow builds the test app once and runs the suite in two shards inside the
official Playwright container. Its version is read from `@playwright/test` in `package.json`,
which follows the Home Assistant frontend submodule. The merged HTML report is attached to the
run as the `playwright-report` artifact, and failed tests are listed in the Codecov comment on
the pull request.

How the test app works and how to add tests is described in
[test/e2e/README.md](test/e2e/README.md).

### Testing the panel

First of all we recommend to follow the instructions for
[preparing a home assistant development environment][hassos_dev_env].

You can test the panel by symlinking the build result directory `knx_frontend`
into your Home Assistant configuration directory.

Assuming:

* The `knx-frontend` repository is located at `<knx-frontend-dir>` path
* The `home-assistant-core` repository is located at `<hass-dir>` path (Remark: per default the Home Assistant configuration directory will be created within `<hass-dir>/config`)

```shell
$ ln -s <knx-frontend-dir>/knx_frontend <hass-dir>/config/deps/lib/python3.xx/site-packages/
$ hass -c config
...
```

Or on a venv-install

```shell
$ cd <hass-dir>
$ script/setup
# Next step might be optional
$ source .venv/bin/activate
$ export PYTHONPATH=<knx-frontend-dir>
$ hass
...
```

Now `hass` (Home Assistant Core) should run on your machine and the knx panel is
accessible at http://localhost:8123/knx.

[hassos_dev_env]: https://developers.home-assistant.io/docs/development_environment/

On Home Assistant OS you might use https://github.com/home-assistant/addons-development/tree/master/custom_deps

### AI Agent Support

This repository ships a set of instructions for AI coding agents.

* GitHub Copilot comes pre-configured — its guidance lives in `.github/copilot-instructions.md`.
* For other agents, you can easy symlink the Copilot instructions with:

    ```shell
    yarn agent:claude   # Creates CLAUDE.md
    yarn agent:gemini   # Creates GEMINI.md  
    yarn agent:codex    # Creates AGENTS.md
    ```
