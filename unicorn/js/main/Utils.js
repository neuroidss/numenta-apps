// Copyright © 2015, Numenta, Inc. Unless you have purchased from
// Numenta, Inc. a separate commercial license for this software code, the
// following terms and conditions apply:
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero Public License version 3 as published by the
// Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for more details.
//
// You should have received a copy of the GNU Affero Public License along with
// this program. If not, see http://www.gnu.org/licenses.
//
// http://numenta.org/licenses/


import crypto from 'crypto';


export default class Utils {

  /**
   * Genereate unique hashed UID based on seed string and SHA1.
   * @param  {string} seed - Seed string to hash
   * @return {string} Unique id
   */
  static generateId(seed) {
    const hash = crypto.createHash('sha1');
    return hash.update(seed).digest('hex');
  }

  /**
   * Genereate unique file ID
   * @param  {string} filename - The absolute path
   * @return {string} Unique id
   */
  static generateFileId(filename) {
    // Use 64 bit hash
    return Utils.generateId(filename).substr(0,16);
  }

  /**
   * Genereate unique metric uid based on the filename and metric name
   *  via hashing.
   * @param  {string} filename - The absolute path
   * @param  {string} metric - Metric name
   * @return {string} Unique id
   */
  static generateMetricId(filename, metric) {
    let fileId = Utils.generateFileId(filename);
    // Use 64 bit hash
    let metricId = Utils.generateId(metric).substr(0,16);
    return `${fileId}!${metricId}`
  }

  /**
   * Genereate unique metric data row uid based on the filename, metric name,
   *  and row timestamp, via hashing.
   * @param  {string} filename - The absolute path
   * @param  {string} metric - Metric name
   * @param  {Date} timestamp - timestamp for the data record
   * @return {string} Unique id
   */
  static generateMetricDataId(filename, metric, timestamp) {
    let metricId = Utils.generateMetricId(filename, metric);
    if (!(timestamp instanceof Date)) {
      timestamp = new Date(timestamp);
    }
    return `${metricId}!${timestamp.getTime()}`;
  }

  /**
   * Template String to trim extra spaces from multiline es6 strings.
   * @param {Array} strings - Input string literals for es6 template string.
   * @param {...Array} [values] - Template string filler values.
   * @returns {String} - Completed and filled string.
   */
  static trims(strings, ...values) {
    let result = '';
    let i = 0;
    let tmp;

    while (i < strings.length) {
      tmp = strings[i];
      tmp = tmp.replace(/\n/g, ' ');
      tmp = tmp.replace(/\s+/g, ' ');
      result += tmp;

      if (i < values.length) {
        result += values[i];
      }

      i++;
    }

    return result;
  }

}
