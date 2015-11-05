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

/* collection of utility functions */
public class DataUtils{
    
    public static let  METRIC_DATA_INTERVAL: Int64 = 5 * 60 * 1000

    public static let   LOG_1_MINUS_0_9999999999 : Double =  log(1.0 - 0.9999999999)
    
    public static let SECONDS_IN_DAY :Int64 = Int64(60*60*24)
 
    
    public static let MILLIS_PER_MINUTE : Int64 = 60 * 1000
    public static let MILLIS_PER_HOUR : Int64 = 60 * MILLIS_PER_MINUTE

    public static let MILLIS_PER_DAY : Int64 = 24 * MILLIS_PER_HOUR
    
    
    public static  let GREEN_SORT_FLOOR : Double = 1000.0
    
    public static   let YELLOW_SORT_FLOOR : Double = GREEN_SORT_FLOOR * 1000.0
    
    public static  let  RED_SORT_FLOOR : Double = YELLOW_SORT_FLOOR * 1000.0
    static let  PROBATION_FACTOR : Double  = 1.0 / RED_SORT_FLOOR
    
    /**
    * Round the given time to the closest 5 minutes floor.
    * <p/>
    * For example:
    * <p/>
    * <b>[12:00 - 12:04]</b> becomes <b>12:00</b> and <b>[12:05 - 12:09]</b> becomes <b>12:05</b>
    *
    * @return the rounded time
    */
    static func floorTo5minutes( time : Int64 )->Int64 {
        return (time / DataUtils.METRIC_DATA_INTERVAL) * DataUtils.METRIC_DATA_INTERVAL;
    }
    
    /** round time to nearest 60 min floor
  */
    static func floorTo60Minutes( time : Int64 )->Int64 {
        return (time / DataUtils.MILLIS_PER_HOUR) * DataUtils.MILLIS_PER_HOUR;

    }
    
    /** round timestamp to nearest 24 hour period
        - parameter time:
    */
    static func floorToDay( time: Int64)->Int64{
         return (time / (24*DataUtils.MILLIS_PER_HOUR)) * (24*DataUtils.MILLIS_PER_HOUR)
    }

    
    
    static func logScale(value : Double)->Double{
        if (value > 0.99999) {
            return 1;
        }
        return log(1.0000000001 - value) / LOG_1_MINUS_0_9999999999
    }
    
    static var grokFormater : NSDateFormatter?
    
    static func parseGrokDate (date : String)->NSDate? {
        
        if (grokFormater == nil){
            grokFormater = NSDateFormatter()
            grokFormater!.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            grokFormater!.timeZone = NSTimeZone(name : "UTC")
        }
       
        let dateObj = grokFormater!.dateFromString(date)

        return   dateObj
    }
    
    
    static func parseHTMDate (date : String)->NSDate? {
     /*   let dateFormatter = NSDateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
         dateFormatter.timeZone = NSTimeZone(forSecondsFromGMT: 0)*/
        return  parseGrokDate(date)
    }
    
    
    
    static func floorTo5Mins (date : NSDate)->NSDate{
        let secondsInitial = DataUtils.timestampFromDate(date)
        let secondsFloored = (secondsInitial/DataUtils.METRIC_DATA_INTERVAL) *  DataUtils.METRIC_DATA_INTERVAL

            return DataUtils.dateFromTimestamp(secondsFloored)
    }
    
    
    static func calculateSortRank( value: Double)->Double{
        if (value == 0){
            return 0
        }
        
        let active : Bool  = value > 0;
        var calculated : Double = DataUtils.logScale(abs(value));
        if (Float(calculated) >= GrokApplication.redBarFloor) {
            // Red
            calculated += RED_SORT_FLOOR;
        } else if (Float(calculated) >= GrokApplication.yellowBarFloor) {
            // Yellow
            calculated += YELLOW_SORT_FLOOR;
        } else {
            // Green
            calculated += GREEN_SORT_FLOOR;
        }
        
        if (!active) {
            // Probation
            calculated *= PROBATION_FACTOR;
        }
        return calculated;
    }
    
    /** create a NSDate object from a integer timestamp
        - parameter timestamp : time in milliseconds since 1970
        - returns: nsdate object
    */
    static func dateFromTimestamp( timestamp : Int64)->NSDate{
         return NSDate(timeIntervalSince1970: Double(timestamp)/1000.0)
    }
    
    
    static func timestampFromDate ( date : NSDate )->Int64{
        return Int64(date.timeIntervalSince1970*1000)
    }

    static func formatDouble ( value : Double, numDecimals : Int )->String?{
        let formatter = NSNumberFormatter()
        formatter.minimumFractionDigits = numDecimals
        formatter.maximumFractionDigits = numDecimals
        return formatter.stringFromNumber(value)
    }

}