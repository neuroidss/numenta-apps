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
import FileDetailsStore from '../../../js/browser/stores/FileDetailsStore';

const assert = require('assert');

const EXPECTED_SINGLE_FILE = [{
  name: 'file.csv',
  filename: 'fixtures/file.csv',
  type: 'uploaded'
}];

describe('FileDetailsStore', () => {
  let store;

  beforeEach(() => {
    store = new FileDetailsStore();
  });
  it('#_showFileDetails', (done) => {
    store._showFileDetails('expected');
    assert.equal('expected', store.getFileName());
    assert.equal(true, store.isVisible());
    assert.equal(false, store.isNewFile());
    done();
  });
  it('#_hideFileDetails', (done) => {
    store._hideFileDetails();
    assert.equal(null, store.getFileName());
    assert.equal(false, store.isVisible());
    assert.equal(false, store.isNewFile());
    done();
  });
  it('#_handleFileUpload', (done) => {
    store._handleFileUpload(EXPECTED_SINGLE_FILE);
    assert.equal(EXPECTED_SINGLE_FILE.filename, store.getFileName());
    assert.equal(true, store.isVisible());
    assert.equal(true, store.isNewFile());
    done();
  });
});
