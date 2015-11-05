

import Foundation

class LineChartView: UIView {
  //  var label: String = "Stock Price"
    var axisLabels = [String]()
    var anomalies = [(Int64, Double)]()
    var data : [Double] = []
    var numYLabels: Int32 = 3
    var axisInterval : Double = 0.0
    var pointWidth = Double( 2.0 )
    var contentArea : CGRect = CGRect()
    var barWidth : Double = 0.0
    var barMarginLeft = Appearence.viewMargin
    
    var wholeNumbers = true
    var maxValue : Double = 0.0
    var minValue : Double = 0.0
    var paddingBottom : Double = 0.0
    
    var minPadding : Double = 5.0
    var markerX = -1.0
    
    var emptyTextString : String?
    var isEmpty : Bool = false
    
    // Callback for when the chart is touched. The int is the index to the closest data element
    var selectionCallback :( (Int)->Void)?
    
    
    required init?(coder aDecoder: NSCoder) {
        
        super.init(coder: aDecoder)
       // setData()
       
    }
    
    override init( frame : CGRect){
        
        super.init(frame: frame)
     //   setData()
    }
    
    override func drawRect(rect: CGRect) {
      
        self.contentArea = rect
        
        if (data.count > 0){
            let contentWidth = Double (rect.width) - 2 * Appearence.viewMargin
            pointWidth =  Double(contentWidth)/Double(data.count)
            barWidth = Double (contentWidth) / Double(TaurusApplication.getTotalBarsOnChart())
            
        }
        drawAnomalies(rect)
        drawMarker(rect)
        drawValues( rect)
        
     
    //    drawAxes (rect)
        drawYLabels (rect)

        
    }
    
    /** draw marker in response to user touches
        - parameter rect : drawing rectangle of the view
    */
    func drawMarker ( rect : CGRect){
        if (markerX<0){
            return
        }
        let context = UIGraphicsGetCurrentContext()!
        var bar : CGRect = CGRect()
        bar.origin.y = 0
        bar.size.height = rect.height
        bar.size.width = 6.0
        
        bar.origin.x = CGFloat(markerX)
        
        CGContextSaveGState( context)
        CGContextSetFillColorWithColor(context, UIColor.whiteColor().CGColor)
        CGContextAddRect(context, bar)
        CGContextFillPath(context)
        CGContextRestoreGState( context)
    }
    
    func drawAnomalies(rect: CGRect ){
        let context = UIGraphicsGetCurrentContext()!
        var bar : CGRect = CGRect()
 
        if (anomalies.count > 0) {
//          let top = contentArea.origin.y + contentArea.size.height / 2;
            let bottom = contentArea.size.height
            
            bar.size.width = CGFloat(barWidth-1)
            bar.origin.y = bottom-1

            for  value in anomalies {
                if (value.0 >= Int64(data.count)) {
                    continue; // Out of range
                }
                
                let left = Double(contentArea.origin.x) + barMarginLeft + pointWidth*Double(value.0)
                bar.size.height = -(contentArea.size.height/2-10)

                bar.origin.x =  CGFloat(left)
                               var color : CGColor
                
                let level = abs(value.1 * 10000.0)
                
                if (level>=9000){
                    color = Appearence.redbarColor
                    bar.size.height -= 10.0
                } else if (level>4000){
                    color = Appearence.yellowbarColor
                    bar.size.height -= 5.0
                }else {
               //    color = UIColor.greenColor().CGColor
                 //   bar.size.height -= 4.0
                   continue
                }
       
                CGContextSaveGState( context)
                CGContextSetFillColorWithColor(context, color)
                CGContextAddRect(context, bar)
                CGContextFillPath(context)
                CGContextRestoreGState( context)
 
            }
            
        }
    }
    
    func getLevel(value :Double)->Int{
        if (value.isNaN) {
            return 0
        }
        var intVal : Int  = abs(Int( value * 10000.0))
        if (intVal<500)
        {
            intVal = 500
        }
        return intVal
    }
    
   
    
    func drawValues(rect: CGRect){
        let context = UIGraphicsGetCurrentContext()!
        
        CGContextSaveGState( context)
        
        var points = [Double]()
        CGContextSetLineWidth(context, 2.0)
      //  let colorSpace = CGColorSpaceCreateDeviceRGB()
      //  let components: [CGFloat] = [0.0, 0.0, 1.0, 1.0]
        let color = Appearence.lineChartColor
        
        
        
        CGContextSetStrokeColorWithColor(context, color)
        
        var x1,y1,x2,y2,y0 : Double

        if ( data.count == 0 )
        {
            return
        }
        
         points.append( Double(contentArea.origin.x) + Appearence.viewMargin )
         points.append( (convertToPixel(self.data[0])))
         points.append(  points[0]+pointWidth/2.0)
         points.append(  (convertToPixel(self.data[0])))
        
        CGContextMoveToPoint(context, CGFloat(points[0]), CGFloat(points[1]))
        CGContextAddLineToPoint(context, CGFloat(points[2]),  CGFloat(points[3]))
        
   
        for (var i = 1; i < data.count ; i++){
            x1 = points[ (i-1)*4+2]
            y1 = points[ (i-1)*4+3]

            
        
            x2 =  Double(contentArea.origin.x) + Appearence.viewMargin +    pointWidth / 2.0 + Double(i) * pointWidth
            y2 = convertToPixel(self.data[i])
            
            if (data[i].isNaN){
                  // Don't move the Y axis. The line will not be drawn, see #convertToPixel
                y1 = y2
            } else if ( data[i-1].isNaN){
                if ( i == 1){
                    y0 = y2
                } else{
                    // Two consecutive missing values
                    if (data[i - 2].isNaN) {
                        y0 = y2;
                    } else {
                        // Get previous data point
                        y0 = points[(i - 2) * 4 + 3]
                    }

                }
                y1 = y0 + (y2-y0) / 2.0
            }
           
            points.append(x1)
            points.append(y1)
            points.append(x2)
            points.append(y2)
           // print (x2)
            CGContextMoveToPoint(context, CGFloat(x1 ), CGFloat(y1))
           //  CGContextMoveToPoint(context, CGFloat(x2 ), CGFloat(rect.height))
               CGContextAddLineToPoint(context, CGFloat( x2 ),  CGFloat( y2))
                   }

        CGContextStrokePath(context)
        CGContextRestoreGState( context)
    }
    
    func drawAxes( rect: CGRect ){
        
        let context = UIGraphicsGetCurrentContext()
        
        CGContextSaveGState( context)
        
        CGContextSetLineWidth(context, 2.0)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let components: [CGFloat] = [1.0, 1.0, 1.0, 1.0]
        let color = CGColorCreate(colorSpace, components)
        CGContextSetStrokeColorWithColor(context, color)
        
        
        CGContextMoveToPoint(context, rect.origin.x, 0)
        CGContextAddLineToPoint(context, rect.origin.x, rect.height)
        CGContextAddLineToPoint(context, rect.origin.x+rect.width, rect.height)
        
        CGContextStrokePath(context)
        CGContextRestoreGState( context)
    }
    
    func drawYLabels (rect: CGRect){
        
        if (self.isEmpty){
            if (self.emptyTextString == nil){
                return
            }
            let context = UIGraphicsGetCurrentContext()
            
            let fieldColor: UIColor = UIColor.whiteColor()
           
            let font = UIFont.boldSystemFontOfSize(16.0)

            
            CGContextSaveGState( context)
            
            let size = self.emptyTextString?.sizeWithAttributes([NSFontAttributeName : font,  NSForegroundColorAttributeName: fieldColor])
            let x = rect.width/2 - size!.width/2
            let top =  rect.height/2 - size!.height/2
            self.emptyTextString?.drawAtPoint(CGPointMake(x, top),
                withAttributes: [NSFontAttributeName : font,  NSForegroundColorAttributeName: fieldColor])
            
        
        
            CGContextRestoreGState( context)
            return
        }
        let context = UIGraphicsGetCurrentContext()
        
        let fieldColor: UIColor = UIColor.whiteColor()
       // let fontName = "System-Bold"
        let font: UIFont = UIFont.boldSystemFontOfSize(12.0)
        
        CGContextSaveGState( context)
        var s: String = "1.0"
        
        var decimals = 0
        if ( axisInterval<1 && axisInterval > 0 ){
            decimals = Int(ceil (-log10(axisInterval)))
        }
        
        for (var i :Int32 = 0; i <= self.numYLabels; i++){
            let y = self.minValue+self.axisInterval*Double(i)
            
            s = DataUtils.formatDouble ( y, numDecimals: decimals)!
            
            let labelTop = convertToPixel(y) - Double( font.lineHeight)
            
            s.drawAtPoint(CGPointMake(CGFloat( self.barMarginLeft), CGFloat( labelTop)),
                withAttributes: [NSFontAttributeName : font,  NSForegroundColorAttributeName: fieldColor])
            
        }
        
        CGContextRestoreGState( context)


    }
    
    func  convertToPixel( value :Double)->Double {
    
        if value.isNaN{
            // Put invalid numbers outside the content area

            return  Double(contentArea.height+100)
            
        }
        
        if (self.maxValue == self.minValue){
            return Double(contentArea.maxY) - self.paddingBottom
        }

        let viewHeight = contentArea.height
        return Double( Double(viewHeight) - Double(viewHeight - 15 ) * (value - self.minValue) / (self.maxValue - self.minValue))
    }
    

    func updateData(){
        self.isEmpty = true
        for value in self.data {
            if (value.isNaN  == false){
                isEmpty = false
                break
            }
        }
        refreshScale()
        self.setNeedsDisplay()
    }
    
    func refreshScale(){
        
        maxValue = -1
        minValue = Double.infinity
        for val in data{
            if (val.isNaN == false ){
                if val > maxValue{
                    maxValue = val
                }
                if val  < minValue{
                    minValue = val
                }
            }
        }
        
        if (self.wholeNumbers ){
             axisInterval = ceil((maxValue-minValue)/Double(self.numYLabels))
        } else{
            axisInterval = (maxValue-minValue)/Double(self.numYLabels)
        }
        
        paddingBottom = minValue == 0 ? 0 : minPadding
    }
    
    /** Detect touches on the chart and report them to the selection listener
        - parameter touches:
        - parameter event:
    */
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        
        if ( self.selectionCallback != nil){
            if let touch = touches.first {
                let x = Double(touch.locationInView(self).x)
                if (x != markerX){
                    markerX = Double(x)
                    
                    let selection = Int ( (markerX) / self.pointWidth)
                    
                    selectionCallback! (selection)
                    self.setNeedsDisplay()
                }
            }
        }
        super.touchesBegan(touches, withEvent:event)
    }
    
    func selectIndex ( index : Int64){
        markerX = Double(index) * self.pointWidth + Double(barMarginLeft)
        self.setNeedsDisplay()
    }
}
