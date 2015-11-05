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


const assert = require('assert');

import path from 'path';

import FileServer from '../../../frontend/lib/FileServer';


// Contents of 'fixture/file.csv'
const EXPECTED_CONTENT =
`timestamp,metric
2015-08-26T19:46:31+17:00,21
2015-08-26T19:47:31+17:00,17
2015-08-26T19:48:31+17:00,22
2015-08-26T19:49:31+17:00,21
2015-08-26T19:50:31+17:00,16
2015-08-26T19:51:31+17:00,19
`;

// Expected data
const EXPECTED_DATA = [
  {timestamp: '2015-08-26T19:46:31+17:00', metric: '21'},
  {timestamp: '2015-08-26T19:47:31+17:00', metric: '17'},
  {timestamp: '2015-08-26T19:48:31+17:00', metric: '22'},
  {timestamp: '2015-08-26T19:49:31+17:00', metric: '21'},
  {timestamp: '2015-08-26T19:50:31+17:00', metric: '16'},
  {timestamp: '2015-08-26T19:51:31+17:00', metric: '19'}
];

// Expected fields
const EXPECTED_FIELDS = [{
  uid: 'TEST_UID_TS',
  file_uid: 'TEST_FILE_UID_TS',
  name: 'timestamp',
  type: 'date'
}, {
  uid: 'TEST_UID_METRIC',
  file_uid: 'TEST_FILE_UID_METRIC',
  name: 'metric',
  type: 'number'
}];
const EXPECTED_FIELDS_VALUE_TESTS = ['name', 'type'];

// Expected statistics for the whole file
const EXPECTED_MIN = 16;
const EXPECTED_MAX = 22;
const EXPECTED_SUM = 116;
const EXPECTED_MEAN = 19.333333333333332;
const EXPECTED_COUNT = 6;
const EXPECTED_VARIANCE = 5.866666666666665 ;
const EXPECTED_STDEV = 2.422120283277993 ;

// Expected statistics for the first 2 lines
const EXPECTED_MIN_PARTIAL = 17;
const EXPECTED_MAX_PARTIAL = 21;

// Keep this list up to date with file names in "frontend/samples"
const EXPECTED_SAMPLE_FILES = ['file1.csv', 'gym.csv'];

const FILENAME_SMALL = path.resolve(__dirname, 'fixtures/file.csv');
const FILENAME_LARGE = path.resolve(__dirname, 'fixtures/rec-center-15.csv');

/* eslint-disable max-nested-callbacks */
describe('FileServer', () => {
  let server;

  beforeEach(() => {
    server = new FileServer();
  });

  describe('#getSampleFiles()', () => {
    it('should list sample files', (done) => {
      server.getSampleFiles((error, files) => {
        assert.ifError(error);
        assert.deepEqual(files.map((f) => {
          return f.name;
        }), EXPECTED_SAMPLE_FILES, 'Got unexpected file names');
        assert(files.every((f) => {
          return f.type === 'sample';
        }), 'Expecting "sample" files only');
        done();
      });
    });
  });

  describe('#getContents', () => {
    it('should get File Contents', (done) => {
      server.getContents(FILENAME_SMALL, (error, data) => {
        assert.ifError(error);
        assert.equal(data, EXPECTED_CONTENT, 'Got different file content');
        done();
      });
    });
  });

  describe('#getFields', () => {
    it('should get fields using default options', (done) => {
      server.getFields(FILENAME_SMALL, (error, fields) => {
        assert.ifError(error);
        fields.forEach((field, index) => {
          // match object keys
          assert.deepEqual(
            Object.keys(fields[index]),
            Object.keys(EXPECTED_FIELDS[index]),
            'Got different Fields keys (all)'
          );
          // match certain key-specified values
          EXPECTED_FIELDS_VALUE_TESTS.forEach((valueTestKey) => {
            assert.equal(
              fields[index][valueTestKey],
              EXPECTED_FIELDS[index][valueTestKey],
              'Got different Fields values (specific keys only)'
            );
          });
        });
        done();
      });
    });
  });

  describe('#getData', () => {
    it('should get data using default options', (done) => {
      let i = 0;
      server.getData(FILENAME_SMALL, (error, data) => {
        assert.ifError(error);
        if (data) {
          let row = JSON.parse(data);
          assert.deepEqual(row, EXPECTED_DATA[i++]);
        } else {
          done();
        }
      });
    });

    it('should get data with limit=1', (done) => {
      server.getData(FILENAME_SMALL, {limit: 1}, (error, data) => {
        assert.ifError(error);
        if (data) {
          let row = JSON.parse(data);
          assert.deepEqual(row, EXPECTED_DATA[0]);
        } else {
          done();
        }
      });
    });

    it('should get aggregated data', (done) => {
      let options = {
        limit: 1,
        aggregation: {
          timefield: 'timestamp',
          valuefield: 'kw_energy_consumption',
          function: 'count',
          interval: 24 * 60 * 60 * 1000
        }
      };
      server.getData(FILENAME_LARGE, options, (error, data) => {
        assert.ifError(error);
        if (data) {
          let row = JSON.parse(data);
          assert.equal(row['kw_energy_consumption'], 96);
        } else {
          done();
        }
      });
    });
  });

  describe('#getStatistics', () => {
    it('should get statistics for the whole file', (done) => {
      server.getStatistics(FILENAME_SMALL, (error, data) => {
        assert.ifError(error);
        assert.equal(data.count, EXPECTED_COUNT, 'Got different "Count"');
        assert.equal(data.fields['metric'].min, EXPECTED_MIN,
                                                'Got different "Min"');
        assert.equal(data.fields['metric'].max, EXPECTED_MAX,
                                                'Got different "Max"');
        assert.equal(data.fields['metric'].sum, EXPECTED_SUM,
                                                'Got different "Sum"');
        assert.equal(data.fields['metric'].mean, EXPECTED_MEAN,
                                          'Got different "Mean"');
        assert.equal(data.fields['metric'].variance, EXPECTED_VARIANCE,
                                              'Got different "Variance"');
        assert.equal(data.fields['metric'].stdev, EXPECTED_STDEV,
                                          'Got different "Standard Deviation"');
        done();
      });
    });

    it('should get statistics for some records of the file', (done) => {
      server.getStatistics(FILENAME_SMALL, {limit: 2}, (error, data) => {
        assert.ifError(error);
        assert.equal(data.fields['metric'].min, EXPECTED_MIN_PARTIAL);
        assert.equal(data.fields['metric'].max, EXPECTED_MAX_PARTIAL);
        done();
      });
    });
  });
});
