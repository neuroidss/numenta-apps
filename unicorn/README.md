# Numenta Unicorn

> Cross-platform Desktop Application to demonstrate basic HTM functionality to
> users using their own data files.


## WARNING! CURRENTLY UNDER HEAVY DEVELOPMENT


## License

Dual Commercial and AGPLv3 License. See [LICENSE.txt](LICENSE.txt)
and http://numenta.org/licenses/.


## Repository

The `js/` directory contains Cross-platform Desktop Application GUI code,
running Javascript/HTML/CSS/etc. on [Node.js](https://nodejs.org/),
[Electron](https://github.com/atom/electron), and
[Google Chromium](https://www.chromium.org/Home). It also contains non-GUI logic
to run and manage HTM Models on the Unicorn model runner.

The `py/` directory contains Unicorn ModelRunner and supporting code
(Python / C++), which drives the main functionality of the app, which it is our
goal to demo to the user.

```shell
DEPENDENCIES.md     # Module dependency overview file
LICENSE.txt         # Dual: Commercial and AGPLv3
README.md           # This file, a project overview
gulpfile.babel.js   # Babel.js ES6 Config file for the Gulp build tool
npm-debug.log       # NPM/node run output logs, not in source control
package.json        # Node.js `npm` packages, dependencies, and App config
py/                 # Unicorn ModelRunner and support Python/C++ code here!
  README.md         # Overview for HTM/NuPIC part of project
  requirements.txt  # Python pip package dependencies
  setup.py          # Backend Python project initialization tooling
  build/            # Backend build working output
  dist/             # Packaging and distribution output
  unicorn_backend/  # Unicorn Backend code, Model Runner, etc.
js/                 # Frontend+GUI that exposes NuPIC HTM functionality to the User
  README.md         # Overview for Frontend+GUI part of project
  assets/           # App assets
    icons/          # App icons (Electron app packaging, etc)
  browser/          # Javascript, HTML, CSS act as GUI inside electron's "Renderer Process"
    app.js          # Fluxible GUI Browser Web App entry, compiles to bundle.js
    index.html      # App main startup browser window contents
    actions/        # Fluxible Actions JS
    assets/         # Browser assets
      bundle/       # Auto-generated WebPack output compiled Web+Map bundle
      images/       # Browser images for display in UI (logos, etc)
    components/     # React view components JSX
    lib/            # Custom JS libs for inside the browser (engine clients)
      Fluxible/     # Fluxible lib helper code
        Plugins/    # Fluxbile plugins
      MaterialUI/   # Material UI lib helper code
      Unicorn/      # Unicorn lib helper code = Client libraries
    stores/         # Fluxible Stores JS
  config/           # JS Config files loaded by nconf
  database/         # File-based database storage (levelup + leveldown)
    schema/         # Database definition schemas in JSON
  docs/             # Output dir for generated JS docs (not saved in src)
  main/             # JS from electron's "Main Process" (i.e. engine services)
    loader.js       # Electron App entry point loader for main.js ES5 => ES6
    index.js        # ES6 Electron App main entry, creates browser GUI window and model runner engine
  samples/          # Sample .CSV data files to pre-load for user in GUI
logs/               # Logfile output of all kinds should end up here
node_modules/       # Where `npm` installs packages to, not in source control
tests/              # Unicorn project tests
  js/               # Javascript tests
    unit/           # Javascript unit tests
  py/               # Python tests
    integration/    # Python integration tests
```


## Technology


### Backend

#### Stack

> See: `py/requirements.txt`

* Languages:
  * [Python](http://python.org)
  * [C++](https://isocpp.org/)
* Machine Intelligence:
  * [NuPIC](htts://github.com/numenta/nupic)

#### Description

The Machine Intelligence behind this app is a technology known as Hierarchical
Temporal Memory (HTM). NuPIC is Numenta's open source HTM engine. NuPIC runs
on streams of data, predicting future values, and detecting pattern anomalies.


### Frontend

#### Stack

> See: `package.json`

* Languages:
  * [ECMAScript 6](https://babeljs.io/docs/learn-es2015/) (Modern Javascript)
    * via [Babel](https://babeljs.io/)
    * Also a few [ECMAScript 7](https://babeljs.io/docs/usage/experimental/)
      features.
    * Some [ECMAScript 5.1](https://es5.github.io/), the Web compile target.
    * Flow Control for A/Synchronous code:
      [js-csp](https://github.com/ubolonton/js-csp),
      [Learn More!](http://jlongster.com/Taming-the-Asynchronous-Beast-with-CSP-in-JavaScript)
    * Facebook [Flow](http://flowtype.org/) JS Typing
  * [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
  * [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS)
* Framework: [Electron](https://github.com/atom/electron)
  * Engines: [Chromium](https://www.chromium.org/Home),
      [Node.js](https://github.com/joyent/node)
    * Package Manager: [npm](https://www.npmjs.com/)
    * Module Loading and Bundling: [WebPack](https://github.com/webpack/webpack)
    * Configuration: [nconf](https://github.com/indexzero/nconf)
    * Documentation: [JSDoc](http://usejsdoc.org/) style,
      [ESDoc](https://esdoc.org/) generator.
    * Logging w/structured JSON: [bunyan](https://github.com/trentm/node-bunyan)
    * Database on filesystem: [LevelUp](https://github.com/Level/levelup)
      interface to [LevelDB](https://github.com/google/leveldb), with
      [leveldown](https://github.com/Level/leveldown) backend
  * User Interface / Browser:
    * Architecture: [Fluxible](http://fluxible.io/)
      ([Flux](https://facebook.github.io/flux/docs/overview.html#content)
      Uni-directional data flow)
    * View Components: [React](https://github.com/facebook/react),
      [JSX](https://facebook.github.io/jsx/)
    * Graphing and Charting: [DyGraphs](http://dygraphs.com/)
      * @TODO Alternatives? [react-chartjs](https://github.com/jhudson8/react-chartjs)
        Canvas, [react-d3](https://github.com/esbullington/react-d3) SVG
* Testing:
  * Test Runner, Unit Tests: [Mocha](https://github.com/mochajs/mocha)
* Tooling:
  * Streaming task runner: [Gulp](https://github.com/gulpjs/gulp)
  * Linting: [eslint](http://eslint.org/)

#### Description

The Frontend contains code to manage Models on the Backend. It also contians
the Graphical User Interface that allows users to explore HTM Models on their
own data.

The GUI for this application is web code. `Javascript`, `HTML`, and `CSS` are
loaded into a browser. For Desktop, this browser is a bare-bones Chrome window
opened by the Electron framework. Electron also runs Node.js to connect with the
host Operating System, allowing for cross-platform native controls. Since web
code is notoriously asynchronous, we use `js-csp` to handle a/synchronous
data flow.

In the browser, we run a one-way Uni-directional data flow, an Architecture
known as "Flux".

Below is an example of tracing of our way through GUI initialization, GUI first
loop run, and GUI loop continuation:

1. Electron loads `js/main.js`
1. .. which (or Browser directly) loads `js/browser/index.html`
1. .. which loads `js/browser/js/app.js`
1. .. which inits Fluxible
1. .. and then Fluxible fires off an initial Action
1. .. which dispatches Events with state data to Stores
1. .. which then integrate state data into themselves
1. .. and then View Components tied to updated Stores render
1. .. and then The User interacts with the app firing off a new Action
1. .. GOTO #6, RINSE and REPEAT.

#### Guidelines

* ECMAScript Styleguide: `npm run lint`, Rules: `.eslintrc`
* HTML5 @TODO
* CSS3 @TODO


## Setup

IMPORTANT: These setup instructions are only about if you care about running
the full app with all its components (Electron app with packaged model
runner). If you care about the python only - for example - then change to
`unicorn/py` and follow the README instructions there.

Example of setting up development environment on Mac OS/X:

```shell
brew install git node
git clone https://github.com/numenta/numenta-apps
cd numenta-apps/unicorn
pip install -r py/requirements.txt
npm install
npm run prepare:python # to freeze model_runner.py so that it can be used in Unicorn.
export APPLICATION_LOG_DIR=logs  # to change to model_runner.py param?
```


## Develop

### Desktop App

Important note: when running `npm run desktop` the application will fail to find
`dist/model_runner` if `model_runner.py` was never frozen before. Make sure
to run `npm run prepare:python` beforehand, if any of the following applies:
* The script `model_runner.py` has never been frozen (i.e. neither
  `npm run build` nor `npm run prepare:python` have been run before).
* Changes were made to the the code under `unicon/py`.
* Changes to NuPIC were made.

Start code via Electron as a Desktop App:

```shell
# Freeze the model runner if:
# - It was never frozen before
# - Changes were made to the the code under unicon/py
# - Changes to NuPIC were made.
npm run prepare:python

# desktop dev
npm run desktop
NODE_ENV=development npm run desktop  # same
npm run desktop | `npm bin`/bunyan    # pretty logs

# desktop prod
NODE_ENV=production npm run desktop
```

### Code Documentation

Frontend code documentation can be generated and viewed by following the
directions below. Comments are in [JSDoc](http://usejsdoc.org/) format, with
output generated by [ESDoc](https://esdoc.org/).

```shell
# generate documentation
npm run docs

# view documentation (mac os/x)
open js/docs/index.html
```

### Development Problems?

* Maybe the DB stored bad data? `npm run clean:db`
* Sometimes `node_modules/` directory can become corrupted, try cleaning and
  reinstalling: `npm run clean ; npm run check`
* Local Git repo can get stuck with out-of-date JS somehow, so back up your
  current repo, and try again on a fresh repo clone.

### Development Notes

* Do not upgrade the following node/npm packages without syncing with the
  rest of the team first. The Mac build box is dependent on these versions,
  and must be upgraded in parallel.
  * `npm`
  * `node`
  * `electron-packager`
  * `electron-prebuilt`
  * `is-electron-renderer`
* Make sure to update packages often, especially after pulling an update into
  your branch:
  * `npm run check`
  * `pip list --outdated`
* Lint your code before creating pull requests:
  * `npm run lint`
* Manual access to LevelDB file database from
  [Lev](https://github.com/hij1nx/lev) command-line tool (Mac OS/X):
  * `` `npm bin`/lev $HOME/Library/Application\ Support/unicorn/database/ ``
* Remember, this is cross-platform. We need to support all main operating
  systems! Windows has no environment variables, etc. Paths should not be
  defined manually, but use the `path` library helper instead.
* Awesome Node.js Links: https://github.com/sindresorhus/awesome-nodejs


## Test

Write **Unit** and **Integration** tests using
[mocha](https://github.com/mochajs/mocha) test framework.

```shell
# All tests
npm run test
```

### Unit

```shell
# Unit tests only
npm run test:unit
```

### Integration

```shell
# Integration tests only
npm run test:integration
```

### Pipeline

To generate reults appropriate for the **pipeline** `mocha` needs to run
with a different set of options
(see [mocha.pipeline.opts](tests/js/mocha.pipeline.opts)).

```shell
# Pipeline: All tests
npm run test:pipeline

# Pipeline: Unit tests only
npm run test:pipeline:unit

# Pipeline: Integration tests only
npm run test:pipeline:integration
```


## Build

### Mac OS/X

Build the electron app with:

```shell
npm run build
```
The resulting `.app` can be found in `unicorn/Unicorn-darwin-x64/`

### Windows

TODO


## Release

### Signing

* You need a certificate type of “Developer ID Application” from Apple. This certificate usually has a common name in the form of `Developer ID Application: YourCompany, Inc. (ABCDEFGHIJK)`.
* Set the environment variable `UNICORN_CERT_DEV_APPLE` and sign the app:
```
export UNICORN_CERT_DEV_APPLE="Developer ID Application: Numenta, Inc. (ABCDEFGHIJK)"
```
* Now when you package Unicorn with `npm run electron:packager`, the app will be signed.


* Useful blog post about signing Electron apps:
  http://jbavari.github.io/blog/2015/08/14/codesigning-electron-applications

### App Store

* Currently, the instructions to release an Electron app on the app store can
  be found here:
  http://www.saschawise.com/blog/2015/08/12/electron-for-the-mac-app-store.html


## Debug

NEED `npm run blah` examples here @TODO

### Backend

* @TODO Python, NuPIC, Models, debugging etc.

### Node.js system-level

* [Electron with node-inspector](https://github.com/atom/electron/blob/master/docs/tutorial/debugging-main-process.md)
* [Node debugger](https://nodejs.org/api/debugger.html)
* Low level [Bunyan and DTrace](https://github.com/trentm/node-bunyan#runtime-log-snooping-via-dtrace)

### Command-line

* [Electron debugging switches](https://github.com/atom/electron/blob/master/docs/tutorial/debugging-main-process.md)
* [Chrome switches supported in Electron](http://electron.atom.io/docs/v0.31.0/api/chrome-command-line-switches/)
* Manual access to LevelDB file database from
  [Lev](https://github.com/hij1nx/lev) command-line tool (Mac OS/X):
  * `` `npm bin`/lev $HOME/Library/Application\ Support/unicorn/database/ ``

### Frontend + Browser

* [Electron + Chrome debug shortcuts](https://github.com/sindresorhus/electron-debug)
* [React Chrome browser plugin](http://electron.atom.io/docs/v0.31.0/tutorial/devtools-extension/)
* [Chrome DevTools plugin](http://electron.atom.io/docs/v0.31.0/tutorial/devtools-extension/)

### Other

* [Electron and Windows Debug Symbol Server](http://electron.atom.io/docs/v0.31.0/development/setting-up-symbol-server/)


## @TODO

* Spread global config around! `nconf` work
* New Electron/Node4 doesn't need babel bundle anymore? (node5 for sure)
* Add in Flow type checking
* i18n l10n setup (es6 template strings? react intl? es6/7 solution?)
* Electron integration test skeleton
