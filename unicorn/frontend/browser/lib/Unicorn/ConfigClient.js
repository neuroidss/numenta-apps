/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */


// externals

import isElectronRenderer from 'is-electron-renderer';

// internals

import ConfigClientHTTP from './ConfigClientHTTP';

let ConfigClient;


/**
 * Unicorn: ConfigClient - Talk to a ConfigServer over IPC or HTTP, gaining
 *  access to the Node/io.js-layer configuration settings. Connects via HTTP or
 *  IPC adapter. ConfigClientIPC adpater is currently a pseudo-library, using
 *  the magic of Electron's `remote` module.
 */
if (isElectronRenderer) { // desktop
  let remote;
  try {
    remote = require('remote'); // eslint-disable-line
  } catch (error) { /* Ignore */ }
  ConfigClient = remote.require('./lib/ConfigServer'); // pseduo-ConfigClientIPC
} else { // web
  ConfigClient = ConfigClientHTTP;
}


// EXPORT
export default ConfigClient;
