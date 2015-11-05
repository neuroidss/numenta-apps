// Numenta Platform for Intelligent Computing (NuPIC)
// Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero Public License version 3 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License
// along with this program.  If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/

import crypto from 'crypto';


export default {

  /**
   * Genereate unique hashed UID based on seed string and SHA1.
   * @param  {string} seed - Seed string to hash
   * @return {string} Unique id
   */
  generateId(seed) {
    const hash = crypto.createHash('sha1');
    return hash.update(seed).digest('hex');
  },

  /**
   * Genereate unique model uid based on the filename and metric name
   *  via hashing.
   * @param  {string} filename - The absolute path
   * @param  {string} metric - Metric name
   * @return {string} Unique id
   */
  generateModelId(filename, metric) {
    return this.generateId(`${filename}#${metric}`);
  },

  /**
   * Genereate unique metric data row uid based on the filename, metric name,
   *  and row timestamp string, via hashing.
   * @param  {string} filename - The absolute path
   * @param  {string} metric - Metric name
   * @param  {string} timestamp - Unique Record row timestamp string
   * @return {string} Unique id
   */
  generateDataId(filename, metric, timestamp) {
    return this.generateId(`${filename}#${metric}#${timestamp}`);
  }

};
