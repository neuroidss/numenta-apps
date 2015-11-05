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
import UIKit

/** View for holding a
*/
  
class TimeSliderView: UIView {
    
    var endDate :NSDate = NSDate()
    var showTop : Bool = true
    var showBottom : Bool = true
    var showBackground = true
    var calendarTime : NSDate = NSDate()
    var transparentBackground = false
    var collapsed = false
    var disableTouches : Bool = false

    var chartTotalBars = TaurusApplication.getTotalBarsOnChart()
    var aggregation : AggregationType =  AggregationType(period:60)
    
    var labelCenterBottom : Double = 20.0
    var labelCenterTop : Double  = 5.0
    
    
    let labelFormatter = NSDateFormatter()
   
    var openColor : CGColorRef =   UIColor.whiteColor().CGColor
    var closedColor : CGColorRef =  UIColor(red: 192.0/255.0, green: 192.0/255.0, blue: 192.0/255.0, alpha: 80.0/255.0).CGColor
    
    let leftMargin =  Appearence.viewMargin
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        setup()
           
    }
    
    override init( frame : CGRect){
        super.init(frame: frame)
        setup()
    }
    
    func setup(){
        labelFormatter.dateFormat = "haaaaaa"

    }
    
   
    
    /** draw the view*
        -prameter rect: rect to draw in
    */
      override func drawRect(rect: CGRect) {
        var bar = chartTotalBars
        var previousCollapsed = false
        
        let interval = aggregation.milliseconds()
        
        var time :Int64 = (Int64(endDate.timeIntervalSince1970*1000)/interval)*interval
         let floatWidth = Double(rect.width)
        let barWidth = (floatWidth -  (leftMargin * 2)) / Double(chartTotalBars)
        var left = Double(rect.width) - barWidth-0.5 - leftMargin

        let startLeft = left
        let top = Double(frame.origin.y)
        let bottom = Double(frame.height)
        var lastLeft: Double = Double(frame.width) - leftMargin
     //   print (endDate)
        let context = UIGraphicsGetCurrentContext()
        // Draw right to left all of the bars.
        while (bar>0){
          /*  if (transparentBackground){
                if (!previousCollapsed){
                    calendarTime = NSDate(timeIntervalSince1970: Double(time)/1000.0)
                    //drawLabelsBackground()
                    let hourOfDay = getHour (calendarTime)
                    if (hourOfDay%3==0){
                        drawLabel  (rect, time: time, left: left, top: top, right: 0.0, bottom:bottom)
                    }
                }
            }*/
            
            
            let open = TaurusApplication.marketCalendar.isOpen(time + DataUtils.METRIC_DATA_INTERVAL)
            
            if (showBackground){
               
                
                CGContextSaveGState( context)
                

                if (open){
                    CGContextSetFillColorWithColor(context, self.openColor)
                    
                }else{
                    CGContextSetFillColorWithColor(context, self.closedColor)
                }
                
                
                
             
                
                
                
                
                let width :Double = ceil(lastLeft - left)
                lastLeft  -= width
                let backRect : CGRect = CGRectMake(floor(CGFloat(lastLeft)), CGFloat(top), (CGFloat(width)), CGFloat(bottom))
              //  print (backRect)
                
                CGContextSetAllowsAntialiasing (context, false)
                CGContextFillRect(context, backRect)
                CGContextSetAllowsAntialiasing (context, true)

                CGContextRestoreGState( context)
                
            }
            
            if (!previousCollapsed ){
                calendarTime = NSDate(timeIntervalSince1970: Double(time)/1000.0)
                //drawLabelsBackground()
                let hourOfDay = getHour (calendarTime)
                if (hourOfDay%3==0){
                    drawLabel  (rect, time: time, left: left, top: top, right: 0.0, bottom:bottom)
                }
            }
            
            previousCollapsed = false
            
            if (collapsed){
                var newTime  = time
                while ( open == false ) {
                    newTime  -= interval
                    let marketOpen = TaurusApplication.marketCalendar.isOpen(newTime + DataUtils.METRIC_DATA_INTERVAL)
                    
                    if (marketOpen)
                    {
                        break
                    }
                    time-=interval
                }
            
            }
            
      //      lastLeft = left
            left -= barWidth
            time -= interval
            bar--
            
        }
        // Draw Seperator line
         CGContextSetStrokeColorWithColor(context, UIColor.lightGrayColor().CGColor)
        CGContextMoveToPoint(context, CGFloat(10.0), CGFloat(20.0))
        CGContextAddLineToPoint(context, CGFloat(rect.width-10.0),  CGFloat(20.0))
         CGContextStrokePath(context)
    }
    

    /** draw label for time at top and bottom of screen
        - parameter rect: drawing rectangle
        - parameter time: time to draw
        - paramter  left: left location for label
        - parameter top: top location for top label
        - parameter right: right
        - parameter bottom: bottom of drawing rectangle
    */
    func drawLabel( rect: CGRect, time: Int64, left :Double, top: Double, right: Double, bottom: Double) {
        // set the text color to dark gray
        let fieldColor: UIColor = UIColor(red: 0.3, green: 0.3, blue: 0.3, alpha: 1.0)
        let fontName = "HelveticaNeue-Bold"
        let helveticaBold = UIFont(name: fontName, size: 12.0)
        
        let date  = NSDate(timeIntervalSince1970: Double(time)/1000.0)
        let text : NSString  = labelFormatter.stringFromDate(date)
        
        if (self.showTop){
            text.drawAtPoint(CGPointMake(CGFloat(left), CGFloat(top+labelCenterTop)),
                withAttributes: [NSFontAttributeName : helveticaBold!,  NSForegroundColorAttributeName: fieldColor])   
        }
        
        if (self.showBottom){
            text.drawAtPoint(CGPointMake(CGFloat(left), CGFloat(bottom-labelCenterBottom)),
                withAttributes: [NSFontAttributeName : helveticaBold!,  NSForegroundColorAttributeName: fieldColor])
            
        }
    }
    
    
    /** hour for given date in local time
        - parameter time: time to get hour of
        - returns: hour of day in local time
    */
     func getHour (time : NSDate)->Int{
        let calendar = NSCalendar.autoupdatingCurrentCalendar()
        let comp = calendar.components((NSCalendarUnit.NSHourCalendarUnit), fromDate: time)
        let hour = comp.hour
        return hour
    }
    

       /** allow ignoring of touches to allow the views behind the time slider view to handle the event
    */
    override func pointInside(point: CGPoint,
        withEvent event: UIEvent?) -> Bool {
            if (disableTouches ){
                
            }else{
                return super.pointInside( point, withEvent: event)
            }
            return false
    }
        
 
        
    
    
    
    
}