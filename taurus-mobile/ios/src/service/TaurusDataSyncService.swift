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

import Foundation


public class TaurusDataSyncService: DataSyncService{
    
    /** loads  instance data
    */
    override func loadAllData() {
        
            let db = TaurusApplication.getTaurusDatabase()
            var from = db.getLastTimestamp()
        
            let nowDate = NSDate()
            let now = DataUtils.timestampFromDate( nowDate )
        // The server updates the instance data table into hourly buckets as the models process
        // data. This may leave the last hour with outdated values when the server updates the
        // instance data table after we start loading the new hourly bucket.
        // To make sure the last hour bucket is updated we should get data since last update up to
        // now and on when the time is above a certain threshold (15 minutes) also download the
        // previous hour once.
        
        
        let defaults = NSUserDefaults.standardUserDefaults()
        var date = defaults.objectForKey("previous_hour_threshold") as? NSDate
        if ( date == nil ){
            date = NSDate()
        }

        if (now >= DataUtils.timestampFromDate(date!)) {
            // Download the previous hour
            from -= DataUtils.MILLIS_PER_HOUR;
            var units : NSCalendarUnit = [NSCalendarUnit.NSYearCalendarUnit,
                NSCalendarUnit.NSMonthCalendarUnit     ,
                NSCalendarUnit.NSDayCalendarUnit ,
                NSCalendarUnit.NSHourCalendarUnit ,
                NSCalendarUnit.NSMinuteCalendarUnit]
            
            
           
            var newDate =  NSCalendar.currentCalendar().dateByAddingUnit(
                NSCalendarUnit.NSHourCalendarUnit, // adding hours
                value: 1,
                toDate: nowDate ,
                options: []
            )
            
            
            let components = NSCalendar.currentCalendar().components (units, fromDate: newDate!)
            components.minute = 15
            components.second = 0
           
            newDate = NSCalendar.currentCalendar().dateFromComponents(components)
            
            defaults.setObject( newDate, forKey: "previous_hour_threshold")
        }
        
        
        
        let oldestTimestamp = DataUtils.floorTo60Minutes (  now - TaurusApplication.getNumberOfDaysToSync() * DataUtils.MILLIS_PER_DAY )
        
        // Check if we need to catch up and download old data
        if ( db.firstTimestamp - DataUtils.MILLIS_PER_HOUR > oldestTimestamp){
            from = oldestTimestamp
        }
        
        // Don't fetch data olders than NUMBER_OF_DAYS_TO_SYNC
        
        from = max (from, oldestTimestamp)
        
        let fromDate = DataUtils.dateFromTimestamp( from )
        
        var results = [InstanceData]()
        getClient().getAllInstanceData(  fromDate,  to: nowDate,  ascending : false, callback:{
            (instance: InstanceData?) in
            
            if (instance == nil ){
                if (results.count > 0){
                     db.addInstanceDataBatch( results )
                }
                
                return nil
            }
            results.append (instance!)
            
            if (results.count > 50 ){
                db.addInstanceDataBatch( results )
                results.removeAll()
            }
            
            return nil
            }
            
        )
    }
    

    override func loadAllMetrics() -> Int32 {
        return super.loadAllMetrics()
    }
    
    override func loadAllAnnotations() {
        // do nothing<#code#>
    }
    
    
    func getClient()->TaurusClient {
        return client as! TaurusClient;
    }
}