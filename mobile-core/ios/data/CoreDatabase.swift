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

/**
    Database protocol.
  */
protocol CoreDatabase {
    func getVersion() -> Int
    func getFileName() -> String!
    func getServerName(_instanceId: String!) -> String!
    
    func getReadableDatabase() -> FMDatabase!
    func getWritableDatabase() -> FMDatabase!
    
    func getDataFactory() -> CoreDataFactory!
    func getLastTimestamp() -> Int64
    func deleteOldRecords() -> Int32
    func deleteAll()
    
    // Metrics
    func addMetric(metric: Metric!) -> Int64
    func getAllMetrics() -> [Metric]!
    func getMetric(id: String!) -> Metric!
    func updateMetric(metric: Metric!) -> Bool
    func deleteMetric(id: String!) -> Int32
    func getMetricsByInstanceId(instanceId: String!) -> [Metric]!
    
    // Metric Data
    func addMetricDataBatch(_batch: [MetricData]!) -> Bool
    func getMetricData(metricId: String!, columns: [String]!, from: NSDate!, to: NSDate!, anomalyScore: Float, limit: Int32) -> FMResultSet!
    
    // Instance Data
    func addInstanceDataBatch(batch: [InstanceData]!) -> Bool
    func getInstanceData( instanceId: String!, columns: [String]!, aggregation: AggregationType!, from: NSDate!, to: NSDate!, anomalyScore: Float, limit: Int32) -> FMResultSet!
    func updateInstanceData(_instanceData: InstanceData!) -> Bool

    // Instances
    func getAllInstances() -> Set<String>!
    func deleteInstance(_instance: String!)
    func deleteInstanceData(_instanceId: String!)
   
    // Notifications - NOT USED IN TAURUS SO FAR
    func addNotification(notificationId: String!, metricId: String!, timestamp: Int64, description: String!) -> Int64
    func getAllNotifications() -> [Notification]!
    func getNotificationByLocalId(localId: Int32) -> Notification!
    func getUnreadNotificationCount() -> Int32
    func getNotificationCount() -> Int32
    func markNotificationRead(notificationId: Int32) -> Bool
    func deleteNotification(localId: Int32) -> Int32
    func deleteAllNotifications() -> Int32
    
    // Annotations - NOT USED IN TAURUS SO FAR
    func addAnnotation(annotation: Annotation!) -> Int64
    func getAllAnnotations() -> [Annotation]!
    func getAnnotation(id: String!) -> Annotation!
    func getAnnotations(server: String!, from: NSDate!, to: NSDate!) -> [Annotation]!
    func deleteAnnotation(id: String!) -> Int32
    func deleteAnnotationByInstanceId(instanceId: String!) -> Int32
}
