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


/**
 * Unicorn: ConfigClientHTTP - HTTP Adapter (one of many) for ConfigClient
 *  (talks to a ConfigServer) to access the Node/io.js-layer config settings.
 */
export default class ConfigClientHTTP {

  /**
   * @constructor
   */
  constructor() {
    this.config = {
      env: 'http',
      target: 'http'
    };
  }

  /**
   * Synchronous Getter of key from config hash.
   * @param {string} key - String key to get from config hash
   * @returns {Object|string} - Object or String of config values
   */
  get(key) {
    return key ? this.config[key] : this.config;
  }

}
