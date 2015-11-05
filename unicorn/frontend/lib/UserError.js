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


/**
 * Base UserError class
 *
 * Overcomes the fact babel have problems inheriting from builtin objects:
 *  @TODO: http://stackoverflow.com/questions/3108980
 *
 * @class
 * @extends Error
 * @module
 * @this UserError
 */
export default class UserError extends Error {
  /**
   * @constructor
   * @default
   * @method
   * @param {string} message - Error message for user
   * @this UserError
   */
  constructor(message) {
    super(message);
    this.message = message;
    this.stack = (new Error()).stack;
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when having trouble getting data from Database
 * @class
 * @extends UserError
 * @module
 * @this DatabaseGetError
 */
export class DatabaseGetError extends UserError {
  /**
   * @constructor
   * @method
   * @param {string} message - Error message for user
   * @this DatabaseGetError
   */
  constructor(message) {
    super(message || 'Could not perform GET operation from Database');
  }
}

/**
 * Thrown when having trouble putting data into Database
 * @class
 * @extends UserError
 * @module
 * @this DatabasePutError
 */
export class DatabasePutError extends UserError {
  /**
   * @constructor
   * @method
   * @param {string} message - Error message for user
   * @this DatabasePutError
   */
  constructor(message) {
    super(message || 'Could not perform PUT operation into Database');
  }
}

/**
 * Thrown when having trouble getting data from Filesystem
 * @class
 * @extends UserError
 * @module
 * @this FilesystemGetError
 */
export class FilesystemGetError extends UserError {
  /**
   * @constructor
   * @method
   * @param {string} message - Error message for user
   * @this FilesystemGetError
   */
  constructor(message) {
    super(message || 'Could not perform READ operation on Filesystem');
  }
}
