  /*
  * Numenta Platform for Intelligent Computing (NuPIC)
  * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
  * Numenta, Inc. a separate commercial license for this software code, the
  * following terms and conditions apply:
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License version 3 as
  * published by the Free Software Foundation.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  * See the GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program.  If not, see http://www.gnu.org/licenses.
  *
  * http://numenta.org/licenses/
  *
  */

  import Foundation
  
  /**
  * Represents Instance aggregated data
  */
class InstanceData {
    
    //  /** Database Table name */
    static let TABLE_NAME: String = "instance_data"
    var instanceId: String!
    var aggregation: Int32
    var timestamp: Int64
    var anomalyScore: Float

    init() {
         instanceId = nil
         aggregation = 0
         timestamp = 0
         anomalyScore = 0

    }

    init(cursor: FMResultSet!) {
        self.instanceId = cursor.stringForColumn("instance_id")
        self.aggregation = cursor.intForColumn("aggregation")
        self.timestamp = cursor.longLongIntForColumn("timestamp")
        self.anomalyScore = Float(cursor.doubleForColumn("anomaly_score"))
    }

    init(instanceId: String!, aggregation: Int32, timestamp: Int64, anomalyScore: Float) {
        self.instanceId = instanceId
        self.aggregation = aggregation
        self.timestamp = timestamp
        self.anomalyScore = anomalyScore
    }

    func getValues() -> Dictionary<String, AnyObject>! {
        var values = Dictionary<String, AnyObject>()
        values["instance_id"] = self.instanceId
        values["aggregation"] = NSNumber(int:self.aggregation)
        values["timestamp"] = NSNumber(longLong:self.timestamp)
        values["anomaly_score"] = NSNumber(float:self.anomalyScore)
        return values
    }

    func getInstanceId() -> String! {
        return self.instanceId
    }

    func setInstanceId(instanceId: String!) {
        self.instanceId = instanceId
    }

    func getAggregation() -> Int32 {
        return self.aggregation
    }

    func setAggregation(aggregation: Int32) {
        self.aggregation = aggregation
    }

    func getTimestamp() -> Int64 {
        return self.timestamp
    }

    func setTimestamp( timestamp: Int64) {
        self.timestamp = timestamp
    }

    func getAnomalyScore() -> Float {
        return self.anomalyScore
    }

    func setAnomalyScore( anomalyScore: Float) {
        self.anomalyScore = anomalyScore
    }
  }
