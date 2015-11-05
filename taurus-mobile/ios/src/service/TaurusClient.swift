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

public class TaurusClient : GrokClient {
    
    static let TABLE_SUFFIX : String  = ".production" // Move off to a config file

    
    static let  METRIC_TABLE : String = "taurus.metric" + TABLE_SUFFIX
    static let  METRIC_DATA_TABLE : String = "taurus.metric_data" + TABLE_SUFFIX
    static let  INSTANCE_DATA_HOURLY_TABLE : String = "taurus.instance_data_hourly" + TABLE_SUFFIX
    static let  TWEETS_TABLE : String = "taurus.metric_tweets" + TABLE_SUFFIX
    
    var awsClient : AWSDynamoDB

    /** Initialize client
        - parameter provider: AWS credentional provider
        - parameter region: AWRS region
    */
    init( provider : AWSCredentialsProvider, region: AWSRegionType){
        let configuration = AWSServiceConfiguration(region: AWSRegionType.USWest2, credentialsProvider: provider)
        AWSServiceManager.defaultServiceManager().defaultServiceConfiguration = configuration
        awsClient = AWSDynamoDB.defaultDynamoDB()
    }
    
    /** Check if data connection is available
        returns: true if available.
    */
    public func isOnline() -> Bool{
        // FIXME
        // Check for network connection
        return true
    }
    
    
    /** No login for taurus
    */
    public func login(){
        // Do nothing
    }
    
    
    /** no server url for taurus
    */
    public func getServerUrl() -> String!{
        return nil
    }
    
    /** returne name of server
    */
    public func getServerName() -> String! {
        return "Taurus"
    }
    
    public func getServerVersion() -> Int{
        return 0
    }
    
    /** get list of metrics from server
        - returns: array of metrics
    */
    public func getMetrics() -> [Metric!]!{
        var metrics = [Metric]()
        
        let  request: AWSDynamoDBScanInput =  AWSDynamoDBScanInput()
        request.tableName = TaurusClient.METRIC_TABLE
        request.attributesToGet = ["uid", "name", "server", "metricType","metricTypeName","symbol" ]
        
        repeat{
            let task : AWSTask = awsClient.scan( request ).continueWithBlock {
                (task: AWSTask!) -> AnyObject! in
                let error = task.error
                if (error != nil ){
                    print(error)
                    return nil
                }
                let taskResult = task.result
                //  print (taskResult)
                let results = taskResult as! AWSDynamoDBScanOutput
                
                for item  in results.items{
                    
                    let uid = (item["uid"] as! AWSDynamoDBAttributeValue).S
                    let name = (item["name"] as! AWSDynamoDBAttributeValue).S
                    let server = (item["server"] as! AWSDynamoDBAttributeValue).S
                    let metricType =  (item["metricType"] as! AWSDynamoDBAttributeValue).S
                    let metricTypeName = (item["metricTypeName"] as! AWSDynamoDBAttributeValue).S
                    let symbol = (item["symbol"] as! AWSDynamoDBAttributeValue).S
                
                    var pString =   "{\"metricSpec\":{\"userInfo\": {\"symbol\": \"" + symbol
                        pString += "\",\"metricType\": \"" + metricType
                        pString +=  "\",\"metricTypeName\": \"" + metricTypeName + "\"}}}"
                    
                    let dataFromString = pString.dataUsingEncoding(NSUTF8StringEncoding, allowLossyConversion: false)
                    let json = JSON(data: dataFromString!)
                    let metric = TaurusApplication.dataFactory.createMetric( uid, name: name, instanceId: server, serverName: server, lastRowId: 0, parameters: json)
                    
                    metrics.append(metric)
                }
                
                request.exclusiveStartKey =  results.lastEvaluatedKey
        
                return nil
            }
        
            task.waitUntilFinished()
        } while  request.exclusiveStartKey != nil

        return metrics
    }
    
    public func getMetricData(modelId: String!, from: NSDate!, to: NSDate!, callback: (MetricData!)->Bool!){
        // do nothing
    }
    
    public func getNotifications() -> [Notification!]!{
        // Do nothing
        return nil
    }
    
    public func acknowledgeNotifications(_ids: [String!]!){
        // do nothing, taurus notifications are managed by the client
    }
    
    public func getAnnotations(from: NSDate!, to: NSDate!) -> [Annotation!]!{
       // Do Nothing
        return nil
    }
    
    public func deleteAnnotation(_annotation: Annotation!){
        // Do nothing
    }
    
    public func addAnnotation(timestamp: NSDate!, server: String!, message: String!, user: String!) -> Annotation!{
        // Do nothing
        return nil
    }
    
    func clearCache(){
        // fix me
    }
    
    /** Retrieve tweets from server
        - parameter metricName : metric to get tweets for
        - parameter from : start time
        - paramter to: end time
        - parameter callback : will be called once for each tweet
    */
    func getTweets ( metricName: String, from: NSDate, to : NSDate, callback : (Tweet?)->Void? ){
        var keyConditions : [String: AWSDynamoDBCondition] = [: ]
        let dateFormatter : NSDateFormatter  = NSDateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        dateFormatter.timeZone = NSTimeZone(forSecondsFromGMT: 0)

        // Set up the UID condition
        let metricCondition = AWSDynamoDBCondition()
        metricCondition.comparisonOperator = AWSDynamoDBComparisonOperator.EQ
        
        let metricAttr = AWSDynamoDBAttributeValue()
        metricAttr.S = metricName
        
        metricCondition.attributeValueList = [metricAttr]
        keyConditions["metric_name"] = metricCondition
        
        // Set up the date Condition
        let timestampCondition = AWSDynamoDBCondition()
        timestampCondition.comparisonOperator = AWSDynamoDBComparisonOperator.Between
        
        let fromAttr = AWSDynamoDBAttributeValue()
        fromAttr.S = dateFormatter.stringFromDate(from)
        
        let toAttr = AWSDynamoDBAttributeValue()
        toAttr.S = dateFormatter.stringFromDate(to)
        
        
        if ( from.compare(to) == NSComparisonResult.OrderedAscending) {
            timestampCondition.attributeValueList = [fromAttr, toAttr]
        }else{
            
            // This should never happen
            timestampCondition.attributeValueList = [toAttr, fromAttr]
        }
        
        keyConditions["agg_ts"] = timestampCondition
        
        
        let query = AWSDynamoDBQueryInput()
        query.tableName = TaurusClient.TWEETS_TABLE
        

        query.attributesToGet=["tweet_uid","userid", "text", "username",
            "agg_ts", "created_at", "retweet_count"]
        query.keyConditions = keyConditions
        query.scanIndexForward = false
        query.indexName = "taurus.metric_data-metric_name_index"
        
        var done = false
        repeat {
            let task =  awsClient.query( query).continueWithBlock {
                (task: AWSTask!) -> AnyObject! in
                let error = task.error
                if (error != nil ){
                    print(error)
                    return nil
                }
                let taskResult = task.result
                let results = taskResult as! AWSDynamoDBQueryOutput
                
                let myResults  = results.items
            
                for item  in myResults{
                    //    print( item )
                    let tweetId = (item["tweet_uid"] as! AWSDynamoDBAttributeValue).S

                    let userId = (item["userid"] as! AWSDynamoDBAttributeValue).S
                    let text = (item["text"] as! AWSDynamoDBAttributeValue).S
                    let userName = (item["username"] as! AWSDynamoDBAttributeValue).S
                    let aggregated = DataUtils.parseHTMDate((item["agg_ts"]as! AWSDynamoDBAttributeValue).S)
                    let created = DataUtils.parseHTMDate((item["created_at"]as! AWSDynamoDBAttributeValue).S)
                    
                    let retweet = item["retweet_count"] as? AWSDynamoDBAttributeValue
                    var retweetCount : Int32 = 0
                    
                    if (retweet != nil && retweet!.N != nil){
                        retweetCount = Int32 (retweet!.N)!
                    }
        
                    let tweet = TaurusApplication.dataFactory.createTweet( tweetId!, aggregated: aggregated!, created: created!, userId: userId!, userName: userName!, text: text!, retweetCount: retweetCount)
                    
                    
                    callback (tweet)
                    
                }
                query.exclusiveStartKey =  results.lastEvaluatedKey
                if (results.lastEvaluatedKey == nil){
                    done = true
                }
                return nil
            }
            task.waitUntilFinished()
        } while !done
    }
    
    /** fetch metric values for given id between the specified date range
        - parameter modelId
        - parameter from : start date
        - parameter to: end Date
        - parameter ascending: sort order
        - parameter  callback: will be called for each metric value
    */
    func getMetricsValues (modelId: String, from:NSDate, to: NSDate, ascending: Bool, callback : ( metricId: String,  timestamp: Int64,  value: Float,  anomaly: Float)->Bool ) {
       
        //Do I need a Cache?
        var keyConditions : [String: AWSDynamoDBCondition] = [: ]
        let dateFormatter : NSDateFormatter  = NSDateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        dateFormatter.timeZone = NSTimeZone(name : "UTC")

        
        // Set up the UID condition
        let uidCondition = AWSDynamoDBCondition()
        uidCondition.comparisonOperator = AWSDynamoDBComparisonOperator.EQ
        
        let uidAttr = AWSDynamoDBAttributeValue()
        uidAttr.S = modelId
       
        uidCondition.attributeValueList = [uidAttr]
        keyConditions["uid"] = uidCondition
        
        // Set up the date Condition
        let timestampCondition = AWSDynamoDBCondition()
        timestampCondition.comparisonOperator = AWSDynamoDBComparisonOperator.Between
        
        let fromAttr = AWSDynamoDBAttributeValue()
        fromAttr.S = dateFormatter.stringFromDate(from)
        
        let toAttr = AWSDynamoDBAttributeValue()
        toAttr.S = dateFormatter.stringFromDate(to)
        
        
        if ( from.compare(to) == NSComparisonResult.OrderedAscending) {
            timestampCondition.attributeValueList = [fromAttr, toAttr]
        }else{
            
            // This should never happen
              timestampCondition.attributeValueList = [toAttr, fromAttr]
        }
        
        keyConditions["timestamp"] = timestampCondition

        let query = AWSDynamoDBQueryInput()
        query.tableName = TaurusClient.METRIC_DATA_TABLE

        query.attributesToGet=["timestamp", "metric_value", "anomaly_score"]
        query.keyConditions = keyConditions
        query.scanIndexForward = ascending
        
        var done = false
        repeat {
            let task =  awsClient.query( query).continueWithBlock {
                (task: AWSTask!) -> AnyObject! in
                let error = task.error
                if (error != nil ){
                    print(error)
                    return nil
                }
                let taskResult = task.result
                //  print (taskResult)
                let results = taskResult as! AWSDynamoDBQueryOutput
                
                let myResults  = results.items
                //   print("object: \(myResults.description)")
              //  let dateFormatter = NSDateFormatter()
              //  dateFormatter.dateFormat = "yyyy'-'MM'-'dd'T'HH"
                
                for item  in myResults{
                    //    print( item )
                    
                    let timeStr = item["timestamp"] as! AWSDynamoDBAttributeValue
                    let date = DataUtils.parseGrokDate(timeStr.S)
                    let value = Float((item["metric_value"] as! AWSDynamoDBAttributeValue).N)!
                    let anonomaly_score = Float((item["anomaly_score"] as! AWSDynamoDBAttributeValue).N)!
                    
    
                    let dateSeconds = DataUtils.timestampFromDate(date!)
                       
                    
                    
                   let shouldCancel =  callback  ( metricId: modelId,  timestamp: dateSeconds,  value: value,  anomaly: anonomaly_score)
                    
                    if (shouldCancel){
                        done = true
                        break
                    }
        
                }
                query.exclusiveStartKey =  results.lastEvaluatedKey
                if (results.lastEvaluatedKey == nil){
                    done = true
                }
                return nil
            }
            task.waitUntilFinished()
        } while !done
    }
    
    
    /** get instance date for a given date range
        - parameter date : day
        - parameter  fromHour : star hour
        - parameter  toHour: end hour
        - parameter  ascending: sort order
        - parameter  callback: called for each instance data
    */
    func getAllInstanceDataForDate( date : NSDate,  fromHour: Int,  toHour : Int,
        ascending : Bool,callback : (InstanceData?)->Void?){
            
            
       //     print (date)
       //     print ( fromHour)
        //    print (toHour)
            let query = AWSDynamoDBQueryInput()
            query.tableName = TaurusClient.INSTANCE_DATA_HOURLY_TABLE
            var keyConditions : [String: AWSDynamoDBCondition] = [: ]
            
            let dateFormatter : NSDateFormatter  = NSDateFormatter()
            dateFormatter.timeZone = NSTimeZone(abbreviation: "UTC")!
            dateFormatter.dateFormat = "yyyy-MM-dd"
            
            let dateStr  = dateFormatter.stringFromDate( date )
            let dateCondition = AWSDynamoDBCondition()
            dateCondition.comparisonOperator = AWSDynamoDBComparisonOperator.EQ
            
            let dateAttr = AWSDynamoDBAttributeValue()
            dateAttr.S = dateStr
            
           // print ("syncing " + dateAttr.S)
            dateCondition.attributeValueList = [dateAttr]
            keyConditions["date"] = dateCondition
            
            let fromStr = String(format: "%02d", fromHour)
            let toStr = String(format: "%02d", toHour)
            
            let fromAttr = AWSDynamoDBAttributeValue()
            fromAttr.S = fromStr
            
            
            let toAttr = AWSDynamoDBAttributeValue()
            toAttr.S = toStr
            
            let timeCondition = AWSDynamoDBCondition()
            if (fromHour == toHour){
                timeCondition.comparisonOperator = AWSDynamoDBComparisonOperator.EQ
                timeCondition.attributeValueList = [fromAttr]
            }else{
                
                timeCondition.comparisonOperator = AWSDynamoDBComparisonOperator.Between
                timeCondition.attributeValueList = [fromAttr, toAttr]
            }
        
         //   keyConditions["hour"] = timeCondition

            query.attributesToGet=["instance_id", "date_hour", "anomaly_score"]
            query.keyConditions = keyConditions
            query.scanIndexForward = ascending
            query.indexName = "taurus.instance_data_hourly-date_hour_index"
            
        
            var done = false
            repeat {
                 let task = awsClient.query( query).continueWithBlock {
                    (task: AWSTask!) -> AnyObject! in
                     let error = task.error
                    if (error != nil ){
                        print(error)
                        return nil
                    }
                    let taskResult = task.result
                    let results = taskResult as! AWSDynamoDBQueryOutput
                    let myResults  = results.items
                 
                    let dateFormatter = NSDateFormatter()
                    dateFormatter.dateFormat = "yyyy'-'MM'-'dd'T'HH"
                    dateFormatter.timeZone =  NSTimeZone(name : "UTC")

                    
                    for item  in myResults{
                        var anomalyScore :Double = 0.0
                        let date_hour = item["date_hour"] as! AWSDynamoDBAttributeValue
                        let instance_id = (item["instance_id"] as! AWSDynamoDBAttributeValue).S
                        let anonomaly_score = (item["anomaly_score"] as! AWSDynamoDBAttributeValue).M
                    //    print (date_hour)
                        let date = dateFormatter.dateFromString( date_hour.S)!
                     //   print ( "instanceData" + date.description)
                        var metricMask = MetricType()
                        
                   /*    print (instance_id)
                        print (date)
                        print (anonomaly_score)
                     */
                        let dateSeconds =  DataUtils.timestampFromDate(date)
                        

                        for (key, anomalyValue) in anonomaly_score {
                            let score :Double = Double ( anomalyValue.N)!
                            let scaledScore = DataUtils.logScale(abs(score))
                         //   print ("score : %s", scaledScore)
                            
                            if (Float(scaledScore) >= TaurusApplication.yellowBarFloor){
                                metricMask.insert(MetricType.enumForKey(key as! String))
                            }
                            anomalyScore = max(score, anomalyScore)
                        }
                      
                        let instanceData = TaurusApplication.dataFactory.createInstanceData(instance_id, aggregation: AggregationType.Day, timestamp: dateSeconds, anomalyScore: Float(anomalyScore), metricMask: metricMask)
                        callback (instanceData)
                    }
                    query.exclusiveStartKey =  results.lastEvaluatedKey
                    if (results.lastEvaluatedKey == nil){
                        done = true
                    }
                    return nil
                }
                task.waitUntilFinished()
            } while !done
            
             callback (nil)
    }
    
    
    /** Get instance data for date range
        - parameter from: starting time
        - parameter to: ending time
        - parameter ascending : sort order
        - parameter callbab: will be called for each InstanceData
    */
    func  getAllInstanceData( from : NSDate,  to: NSDate,  ascending : Bool, callback:(InstanceData?)->Void? ) {
        let calendar =  NSCalendar(identifier:NSCalendarIdentifierGregorian)!
        calendar.timeZone = NSTimeZone(abbreviation: "UTC")!
    
        let fromDay = calendar.ordinalityOfUnit(.Day, inUnit: .Year, forDate: from)
        let toDay = calendar.ordinalityOfUnit(.Day, inUnit: .Year, forDate: to)

        /*print ("Get all days")
        print ("getAllInstance from:" + from.description)
        print ("getAllInstance to:" + to.description)
*/
       
        // Check if "from" date and "to" date falls on the same day
        if (fromDay == toDay) {
             getAllInstanceDataForDate(from, fromHour: calendar.component(NSCalendarUnit.Hour, fromDate: from), toHour: calendar.component(NSCalendarUnit.Hour, fromDate: to), ascending: ascending, callback : callback)
        } else {
            // Get Multiple days
            let totalDays = toDay - fromDay;
            var interval = -1;
            var date = to
            // Check if loading in reverse order
            if (ascending) {
                date = from;
                interval = 1;
            }
            
            for var i = 0; i<=totalDays ; i++ {
                
             //   print (date)
                getAllInstanceDataForDate(date, fromHour:0, toHour: 23, ascending: ascending, callback : callback)
                
                // FIXME verify this handles end of year wrapping properly
                date = calendar.dateByAddingUnit(NSCalendarUnit.Day, value: interval, toDate: date, options: [])!
            }
        }
    }
}
