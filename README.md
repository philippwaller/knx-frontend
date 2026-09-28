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

### KNX Frontend Gallery

```shell
yarn gallery                 # http://127.0.0.1:8091
yarn gallery --port 8093      # optional local port
yarn gallery:build           # standalone files in build/gallery/
yarn gallery:test            # Chromium; starts its own gallery on port 8092
```

Use the Node version in `.nvmrc` and run `script/bootstrap` first. Install the
browser once with `yarn playwright install chromium` (on Linux CI, add
`--with-deps`). The gallery works without running Home Assistant, signing in,
or connecting to KNX. It renders the actual product components with local
fixtures. Unknown backend calls fail visibly; there is no live mode or API
fallback. It does not replace backend integration tests.

The start page shows all catalog entries as preview cards, grouped by category.
Each card includes the friendly name, component tag and description and opens the
existing scenario workspace. Search and category filters also narrow this overview.
The sticky category bar jumps between sections without filtering the cards. Compact
captions describe each component's purpose; relationship hints distinguish internal
building blocks from optional slot content using the same links as the inspector.
Use Overview in the sidebar to return. Thumbnails are static PNGs of the real default
examples, including opened dialogs, in light and dark mode. The overview loads images
lazily and starts no preview iframes. Clicking or pressing Enter opens the interactive
example. The development server keeps source maps in separate files.

`yarn gallery:build` builds the optimized gallery and generates all thumbnails with
headless Chromium. Install it once with `yarn playwright install chromium` (CI uses
`--with-deps`). The capture step serves the build on port 8093, uses local fixtures,
a fixed clock, viewport, locale and timezone, and disables animations for screenshots.
It fails the build on missing examples or rendering errors. Images stay in the ignored
`build/gallery/thumbnails/` directory and are shipped with the gallery, not the Python package.

For local development, run `yarn gallery:build` once before `yarn gallery`. After changing
an example, rebuild to refresh its thumbnails; `yarn gallery:thumbnails` regenerates all
images from the existing build without compiling again. The development server serves
these same images, so they show the last generated build while detail previews update live.

The gallery has a full-height catalog sidebar with its title, search and category
filters. Each entry shows its friendly name above the complete component tag.
Browse the grouped catalog or choose a category from the menu to narrow the list. Search
by component tag or title within that category; All components restores every category.
Filtering keeps the current preview intact. Category headings stay at the top
of the scrolling catalog until the next category replaces them. Opening an example
reveals its active catalog entry, expands its category and clears only filters that
would hide it. A closed catalog follows the selection when reopened. The menu button left
of the component title collapses or expands the catalog on desktop. On narrow screens,
it opens the catalog over the preview; selecting an example, pressing Escape, or clicking
outside closes it. Search and filters survive closing and reopening the catalog.
The event log sits below the canvas, with newest messages first. The inspector extends
to the bottom of the workspace independently of the log.
The inspector toggle beside Reset hides or shows the inspector, giving its space to
the canvas on desktop and opening an overlay on compact screens. Inspector drafts and
preview inputs survive toggling either the inspector or the catalog.
The canvas toolbar stays on one line and adapts to its own available width.
Auto height is always a toggle button, with its label hidden below 1400px.
Below 1400px the toolbar uses icon presets and a view-mode menu;
the exact width and component boundaries move into Preview options. Below 560px,
device and color modes also use menus and Auto height stays in Preview options.
The wide toolbar also offers a direct Inspect alignment button. All layouts share
the same settings and preview session.
The workspace stays within the screen, with separate
scroll areas for the catalog, canvas, and inspector. Desktop scenario tabs form a compact rounded group beside the component title and switch
examples directly and scroll horizontally when needed; mobile keeps a compact
picker. A single scenario is shown as a label. Choose a scenario, then adjust properties or
toggle slot samples. Reset an individual control or the whole scenario to
restore fixture defaults. Invalid JSON keeps the last valid state. The event
log shows events, callbacks, API calls, and errors; it keeps the latest 200
entries and can be cleared. Its dock stays visible with the latest event and error
count; expand it to inspect payloads alongside the controls in a fixed-height scroll area. The right inspector
combines each property or slot control with its API description. Scenario values
show the reset target; longer API details expand at the field. Additional
properties, methods, events, and callbacks appear below, without duplicating
documented controls. Examples without controls show their reference directly.
The Relationships section explains the tabs subpage data and filter building blocks and links
to their examples in both directions. Internal dependencies are distinguished from
optional slot content. These curated links live in `gallery/src/catalog.ts`;
their explanations live in `gallery/src/localize/en.json`.
Search the inspector by label, code name, description, or API detail; matching details
open automatically. Section headings stay visible while their fields scroll beneath them.
All, Editable, and Interfaces filters narrow the results without
discarding unfinished edits. Text and JSON fields share an outlined style; JSON fields
can be resized vertically. On smaller screens, use Open inspector; closing it preserves editor drafts.
The editor uses Home Assistant controls. Preview options contains the default/KNX
theme; Component boundaries has a dedicated toolbar button. A single canvas selector offers Light, Dark, and Compare, each with an icon and label.
Project links above the theme button opens the KNX frontend repository, XKNX
organisation, official integration documentation, and integration issue tracker in
new tabs, keeping the current example intact.
The fixed tool area at the bottom of the catalog switches the application between
light and dark, independently of the canvas. The initial appearance matches the system.
Device buttons select representative CSS viewport widths: phone (390), large
phone (430), tablet (768), landscape tablet (1024), and desktop (1280). A custom
positive width is also supported; these presets resize the viewport without
emulating device hardware. Auto height beside the width field fits components to their
content while preserving the selected width. Each comparison preview follows its own
content height. Opening a dialog or menu temporarily restores the normal viewport height.
Auto height is available for all examples. View components retain their own viewport-filling
layout constraints; dialog examples fit their launch button while closed and expand
to the normal viewport height while open.
Collapsing the catalog gives the preview more workspace while retaining the selected
viewport width. Dialogs and viewport contexts stay inside the preview iframe.

The canvas separates the workspace from each preview viewport. Compare shows
light and dark side by side when space permits, or stacked at the same selected
width. Both use the same scenario, controls, slots, theme and interactive state.
Changes from either pane are reflected in both, including filter panes, search,
selection, sorting, expansion, supported dialogs and local view navigation. Returning
to Light or Dark retains the primary preview and its inputs. Default/KNX theme changes
also preserve inputs. Synchronization applies state rather than replaying submissions;
the originating pane alone records the action and calls its fixture callbacks.
Explicit gallery-only bindings live in `gallery/src/sync-bindings.ts`. Add bindings
and a browser regression when a new component introduces interactive state. Native
hover/focus and file picker contents are not mirrored. Dialogs that require an
application continuation (such as an unsaved-navigation prompt) need an explicit
adapter; these are not reconstructed automatically.

Choose Preview, Split or Code to inspect the evaluated Lit usage alongside the UI.
Split uses two columns when space permits, and stacks on narrow screens. With Compare,
one shared code panel sits below both previews. Switching presentation keeps the frames
mounted. Syntax highlighting covers JavaScript/TypeScript tokens and embedded Lit HTML
and SVG, follows the gallery theme, and preserves the exact copied text. Examples show
current configured properties and enabled slots; required application callbacks and
host dependencies are identified in comments. Dialog examples show their actual
`showDialog` invocation. The code is read-only and does not include callback bodies.
Component boundaries adds an outline without changing component geometry. Preview
headers show color mode, device width, and loading state; comparison events are
labeled Light or Dark in the event log.

Inspect alignment in the wide toolbar (or Preview options on narrower layouts)
shows edge guides for the element under the
pointer, including elements inside open shadow roots. Click to pin or unpin guides;
Choose element selects a containing element from the hierarchy. Dashed lines follow
the pointer, while solid lines stay attached to pinned elements as their geometry
changes. Component actions are suspended during inspection. The floating canvas bar
shows the total pinned count across Compare panes, resets all guides, and exits the
mode. Exit inspection or Escape removes every guide and restores normal interaction.

To add an example, use an existing descriptor under `gallery/src/examples/`
and the types in `gallery/src/types.ts`. Each module exports `entry` with:

- `meta`: ID, tag, title, description, category, controls, slots, scenarios,
  and documented property/slot/event/callback API.
- `covers`: every production custom element demonstrated by that entry.
- `load()`: dynamic imports of product components and fixtures, returning a
  `render(env, values, slots, emit)` function and optional `prepare`/`dispose`.

Register the descriptor in the appropriate navigation group in
`gallery/src/catalog.ts`. Keep product imports
inside `load()`, use fresh fixtures per preview, and use `env.signal` to stop
asynchronous work on reset. Controls are validated JSON values; `hass`, `knx`
and callbacks come from the environment rather than editable JavaScript.
Gallery-only text belongs in `gallery/src/localize/en.json`. Product code
must not import gallery code or add gallery-specific properties.

```shell
yarn test --exclude '**/.worktrees/**'
yarn lint
yarn gallery:test
```

The gallery is excluded from the Python package. CI deliberately leaves
`build/gallery/` in place, runs `KNX_BUILD_STATS=1 yarn build` and the existing
`python -m build` pipeline, then checks both production module graphs and the
unpacked wheel. CI temporarily sets the package version to `0.0.0.dev0` and
restores `VERSION` afterward. Optional statistics are written to
`build/checks/production.json`, outside `knx_frontend/`, without changing
production optimization. To inspect an unpacked wheel manually:

```shell
node build-scripts/check-gallery-exclusion.mjs build/checks/production.json /path/to/unpacked-wheel
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

### Gallery on GitHub Pages

The gallery workflows publish `main` at the repository's Pages URL and previews at
`<pages-url>/pr/<number>/`. The same files work in `philippwaller/knx-frontend` and
`XKNX/knx-frontend`; the Pages API supplies the URL prefix, including a custom domain.

- A PR author with current **write, maintain or admin** access gets an automatic
  preview when gallery inputs change. Inputs include components, examples, build
  scripts, dependencies and the pinned Home Assistant frontend. Documentation-only
  changes do not rebuild a previously published gallery.
- For an external contributor, a maintainer posts a new, unedited comment containing
  only `/preview <full-40-character-head-SHA>`. The bot provides a copyable command.
  Approval applies to that exact commit. Every subsequent commit needs a new approval;
  the previous published preview remains available and is marked out of date.
- Repeating a request for an already published SHA does not rebuild it. If a build is
  already running, the request waits for its result; a skipped build is rerun once.
  GitHub's separate approval for first-time fork workflows may still be necessary.
- If no matching PR run exists or an old run cannot be rerun, edit the PR description
  to create a fresh run, approve the fork workflow in Actions when prompted, and post
  a new SHA approval if needed. Failed or ambiguous rerun requests are not retried in
  a loop. Check Actions before submitting a new request.
- Closing or merging a PR removes its preview from the next successful deployment.
  Reopening follows the same permission rules. The **Gallery Pages → Run workflow**
  action reconciles closed previews and retries saved, still-authorized deployment
  candidates. Rerun a failed Gallery build if it never produced a candidate.

Builds run without write permissions or repository secrets. The publisher runs code
from `main`, never installs PR dependencies, never restores a build cache and treats
build artifacts as data. It validates artifact provenance, digest, paths and sizes.
An append-only `gh-pages` data branch retains the latest candidate and the confirmed
published snapshot; a failed deployment does not advance the published pointer.
Only a successful official Pages deployment confirms publication. Status updates
happen afterward, so a comment failure cannot undo the confirmation.

Main and previews share a browser origin. Maintainer approval is therefore a review
of the actual code being hosted; URL subdirectories do not isolate browser storage
or JavaScript. Do not host credentials or confidential application data on this
origin. Removing a preview removes its current URL, not its Git history or a visitor's
cache. Use a dedicated preview origin if stronger isolation becomes necessary.

#### Enable the first repository

The workflows are inert for publishing until enabled. First merge these files to
`main` in `philippwaller/knx-frontend`, then:

1. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as source.
2. In **Settings → Environments → github-pages**, restrict deployment branches to
   `main`. Configure any optional custom domain in Pages before building the gallery.
3. Allow GitHub Actions to create PR comments and push the dedicated `gh-pages`
   branch. Leave any existing unrelated `gh-pages` branch intact: the publisher
   refuses to adopt one without its own valid ownership state.
4. Set the repository Actions variable **`GALLERY_PAGES_ENABLED` to `true`**. No PAT,
   deployment secret or additional package is required.
5. Run/re-run **Gallery build** for a push to `main`. Exercise one maintainer PR and
   one external fork PR: approval, new unapproved SHA, reapproval, close and cleanup.
   Also publish two PRs and main concurrently and verify all retained pages.

The workflows serialize the entire prepare/deploy/finish sequence. GitHub's
`queue: max` admits up to 100 waiting runs; after queue overflow, run the manual
reconciliation. Build artifacts expire after seven days; published pages do not.
Each gallery is limited to 128 MiB and 10,000 archive entries; the assembled site is
limited to 900 MiB. Closed previews are removed before the site-size check.

Repeat these settings in the upstream repository only after the fork's live checks
pass. The repository name is not hard-coded. Local tests do not establish that the
repository's permissions, environment and fork-approval settings are correct.

Configuration references: [Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site),
[deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments),
[workflow concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency).

#### Verify locally

```sh
python3 -m unittest discover -s test -p 'test_gallery_pages*.py'
yarn test --exclude '**/.worktrees/**'
GALLERY_BASE_PATH=/demo/pr/42/ yarn gallery:build
GALLERY_BASE_PATH=/demo/pr/42/ yarn playwright test --config test/playwright.gallery-pages.config.ts
GALLERY_BASE_PATH=/ yarn gallery:test --workers=2
```

The gallery build workflow also performs the regular release/wheel build with
`build/gallery` present and checks that no gallery files enter the Python package.
