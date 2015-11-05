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
  * <code>GrokClient</code> interface wraps a connection to the Grok REST API
  */
public protocol GrokClient {

    func isOnline() -> Bool
    func login()
    func getServerUrl() -> String!
    func getServerName() -> String!
    func getServerVersion() -> Int
    func getMetrics() -> [Metric!]!
    func getMetricData(modelId: String!, from: NSDate!, to: NSDate!, callback: (MetricData!)->Bool!)
    func getNotifications() -> [Notification!]!
    func acknowledgeNotifications(ids: [String!]!)
    func getAnnotations(from: NSDate!, to: NSDate!) -> [Annotation!]!
    func deleteAnnotation(annotation: Annotation!)
    func addAnnotation(timestamp: NSDate!, server: String!, message: String!, user: String!) -> Annotation!
}
