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
*/
import Foundation

public class Annotation {
    
    static public let TABLE_NAME = "annotation"
    var id: String!
    var timestamp: Int64
    var created: Int64
    var device: String!
    var user: String!
    var instanceId: String!
    var message: String!
    var data: String!
    
    init(cursor: FMResultSet!) {
        self.id = cursor.stringForColumn("annotation_id")
        self.timestamp = cursor.longLongIntForColumn("timestamp")
        self.created = cursor.longLongIntForColumn("created")
        self.device = cursor.stringForColumn("device")
        self.user = cursor.stringForColumn("user")
        self.instanceId = cursor.stringForColumn("instance_id")
        self.message = cursor.stringForColumn("message")
        self.data = cursor.stringForColumn("data")
    }
    
    func getValues() -> Dictionary<String, AnyObject>! {
        var values = Dictionary<String, AnyObject>()
        
        values["annotation_id"] = self.id
        values["timestamp"] = NSNumber(longLong:self.timestamp)
        values["created"] = NSNumber(longLong: self.created)
        values["device"] = self.device
        values["user"] = self.user
        values["instance_id"] = self.instanceId
        values["message"] = self.message
        values["data"] = self.data
        return values
    }
    
    init(annotationId: String!, timestamp: Int64, created: Int64, device: String!, user: String!, instanceId: String!, message: String!, data: String!) {
        self.id = annotationId
        self.timestamp = timestamp
        self.created = created
        self.device = device
        self.user = user
        self.instanceId = instanceId
        self.message = message
        self.data = data
    }
    
    func getId() -> String! {
        return self.id
    }
    
    func getTimestamp() -> Int64 {
        return self.timestamp
    }
    
    func getCreated() -> Int64 {
        return self.created
    }
    
    func getDevice() -> String! {
        return self.device
    }
    
    func getMessage() -> String! {
        return self.message
    }
    
    func getData() -> String! {
        return self.data
    }
    
    func getUser() -> String! {
        return self.user
    }
    
    func getInstanceId() -> String! {
        return self.instanceId
    }

    
}