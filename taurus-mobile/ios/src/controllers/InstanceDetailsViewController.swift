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


import UIKit

class InstanceDetailsViewController: UIViewController, UITableViewDataSource, UITableViewDelegate  {

    @IBOutlet var timeSlider: TimeSliderView?
    @IBOutlet weak var instanceTable: UITableView!
    @IBOutlet weak var anomalyChartView : AnomalyChartView!
    @IBOutlet weak var marketHoursSwitch : UISwitch?

    @IBOutlet weak var ticker : UILabel!
    @IBOutlet weak var name : UILabel!
    @IBOutlet weak var date : UILabel!
    @IBOutlet weak var menuButton:UIBarButtonItem!

    // Serial queue for loading chart data
    let loadQueue = dispatch_queue_create("com.numenta.InstanceDetailsController", nil)
     var  metricChartData  = [MetricAnomalyChartData]()
    
    //
    var _aggregation: AggregationType = TaurusApplication.getAggregation()
    var marketHoursOnly = false
     var chartData: InstanceAnomalyChartData? {
        didSet {
            // Update the view.
            self.configureView()
        }
    }
    
    
    /**
        tell any pending chart to stop loading if the view is going away
    */
    override func viewWillDisappear(animated:Bool){
        for chartData in metricChartData {
            chartData.stopLoading()
        }
        super.viewWillDisappear (animated)
        
    }
    
    /** bind data to view
    */
    func configureView() {
        if (chartData == nil){
                       return
        }
   
        if ( chartData?.getEndDate() != nil && timeSlider != nil){
            updateTimeSlider ( (chartData?.getEndDate()!)!)
        }
        
        timeSlider?.disableTouches = false
        
        updateAnomalyChartView()
       
        ticker?.text = chartData?.ticker
        name?.text = chartData?.name
        
        metricChartData.removeAll()
        for metric in chartData!.metrics! {
           metricChartData.append( MetricAnomalyChartData (metric: metric, endDate :0))
        }
        
        metricChartData.sortInPlace {
            let left = MetricType.enumForKey($0.metric.getUserInfo("metricType")).rawValue
            let right = MetricType.enumForKey($1.metric.getUserInfo("metricType")).rawValue
            
            return left < right
        }
        
       
    
    }

    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

      
        // Hook up swipe gesture
        
         let panRec = UIPanGestureRecognizer()
         panRec.addTarget(self, action: "draggedView:")
         timeSlider?.addGestureRecognizer(panRec)
         timeSlider?.showBottom = false
         timeSlider?.transparentBackground = true
        
        timeSlider?.openColor = UIColor.clearColor().CGColor

        timeSlider?.closedColor = UIColor(red: 0.3, green: 0.3, blue: 0.3, alpha: 0.25).CGColor

        // on iOS 8+ need to make sure table background is clear
        
        instanceTable.backgroundColor = UIColor.clearColor()
   
        let menuIcon = UIImage(named: "menu")
        let b2 = UIBarButtonItem (image: menuIcon,  style: UIBarButtonItemStyle.Plain, target: self.revealViewController(), action: "rightRevealToggle:")
        self.menuButton = b2
     
        b2.tintColor = UIColor.whiteColor()
   
        self.navigationItem.rightBarButtonItems = [ menuButton!]
        
        if self.revealViewController() != nil {
         //   menuButton.target = self.revealViewController()
           // menuButton.action = "revealToggle:"
            self.view.addGestureRecognizer(self.revealViewController().panGestureRecognizer())
            
                self.revealViewController().rearViewRevealWidth = 100
        }
        
         marketHoursSwitch?.on = self.marketHoursOnly
        
         configureView()
        
        dispatch_set_target_queue(loadQueue, dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0))
        
      
    }

    
    func updateAnomalyChartView(){
        if (marketHoursOnly){
            anomalyChartView?.setData (chartData!.getCollapsedData())
        }else{
            anomalyChartView?.setData (chartData!.getData())
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func toggleMarketHours(){
        self.marketHoursOnly = marketHoursSwitch!.on
        self.timeSlider?.collapsed =  self.marketHoursOnly
        self.timeSlider?.setNeedsDisplay()
        
        updateAnomalyChartView()
        
        let visibleCells = self.instanceTable.visibleCells
        for cell in visibleCells{
            let metricCell = cell as! MetricCell

            if (metricCell.data != nil){
              
                metricCell.data?.collapsed = self.marketHoursOnly
                metricCell.data?.refreshData()
                
                metricCell.chart.data  = metricCell.data!.rawData!
                metricCell.chart.anomalies = metricCell.data!.data!
                metricCell.chart.updateData()
                metricCell.setNeedsDisplay()
            }
        }
    }
    
    /**
        Handle the swipe gesture. Updates the time slider, anomalychart, and the metric table
        - parameter sender:
    */
    func draggedView(sender:UIPanGestureRecognizer){
      //  self.view.bringSubviewToFront(sender.view)
        let translation = sender.translationInView(self.view)
      //  print (translation)
        if (abs(translation.y) > abs(translation.x))
        {
            return
        }
        let distance = getDistance( Double( translation.x) * -1.0 )
        sender.setTranslation(CGPointZero, inView: self.view)
      
        let newTime:NSDate? =  timeSlider?.endDate.dateByAddingTimeInterval(distance)
     //   print ((timeSlider?.endDate,newTime))
        
        var flooredDate = DataUtils.floorTo5Mins (newTime!)
        let endDateInd = DataUtils.timestampFromDate(flooredDate)
        let maxDate = DataUtils.floorTo5minutes(TaurusApplication.getDatabase().getLastTimestamp())
        let minDate = maxDate - (Int64(TaurusApplication.getNumberOfDaysToSync() - 1)) * DataUtils.MILLIS_PER_DAY;
        // Check max date and no date
        if (endDateInd > maxDate) {
            flooredDate =  DataUtils.dateFromTimestamp(  maxDate )
        }
            // Check min date
        if (endDateInd < minDate) {
            flooredDate =  DataUtils.dateFromTimestamp(  minDate )
        }
        
        updateTimeSlider (flooredDate)
        chartData?.setEndDate(flooredDate)
        chartData?.load()
        
        updateAnomalyChartView()

        let visibleCells = self.instanceTable.visibleCells
        for cell in visibleCells{
            let metricCell = cell as! MetricCell
            
            if (metricCell.data != nil){
                metricCell.data?.setEndDate (flooredDate)
                metricCell.data?.collapsed = self.marketHoursOnly
                metricCell.data?.refreshData()

                metricCell.chart.data  = metricCell.data!.rawData!
                metricCell.chart.anomalies = metricCell.data!.data!
                metricCell.chart.updateData()
                metricCell.setNeedsDisplay()
            }
        }
       }
    
    /** Update timeslider view to match the passed in date
        - parameter date: end date to show
    */
    func updateTimeSlider ( date : NSDate){
        timeSlider?.endDate =  date
        timeSlider?.setNeedsDisplay()
        
        let dayTimePeriodFormatter = NSDateFormatter()
        dayTimePeriodFormatter.dateFormat = "EEE M/d"
        
        let dateString = dayTimePeriodFormatter.stringFromDate(date)
        
        self.date?.text = dateString
    }
    
    /** get the amount of time to shift
        -parameter distance: length of swipe
    */
     func getDistance(distance : Double)->Double {
        let width =  self.view.frame.size.width
        let pixels = Double(Double(width) / (Double)(TaurusApplication.getTotalBarsOnChart()))
        let scrolledBars = Double(Int64 (distance / pixels))
        // Scroll date by aggregation interval
        let interval = Double(TaurusApplication.getAggregation().milliseconds())/1000.0
        let timeDistance = Double(interval * scrolledBars)*(1.0)
        return timeDistance
    }
    
    
    /** Datasource delegate 
        - returns : number of sections in table
    */
    func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return 1
    }
    
    /** header title
    */
     func tableView(tableView: UITableView, titleForHeaderInSection section: Int) -> String?{
       return nil
    }
    
    /** Datasource delegate to return number of rows in a cell.
    */
    func tableView(tableView: UITableView!, numberOfRowsInSection section: Int) -> Int{
        return metricChartData.count
    }
    
    
    /** bind data to cell and return the cell
    */
    func tableView(tableView: UITableView!, cellForRowAtIndexPath indexPath: NSIndexPath!) -> UITableViewCell!{
        let cell = self.instanceTable.dequeueReusableCellWithIdentifier("metricCell")
        
        cell?.selectionStyle = UITableViewCellSelectionStyle.None
        let metricCell =  cell    as! MetricCell?

        if ( metricCell == nil ){
          return metricCell
        }
        
        metricCell?.chart.emptyTextString = "Market Closed"
        metricCell?.backgroundColor = UIColor.clearColor()
    //    metricCell?.selectionStyle =   UITableViewCellSelectionStyle.Blue
    //    metricCell?.userInteractionEnabled = true
        
        let cellData =  metricChartData[ indexPath.item]
        
        metricCell?.label.text = cellData.getName()
        
        let type = MetricType.enumForKey(cellData.metric.getUserInfo("metricType"))
        if ( type == MetricType.StockPrice){
             metricCell?.chart?.wholeNumbers = false
        }else{
            metricCell?.chart?.wholeNumbers = true
        }
        
        if ( type == MetricType.TwitterVolume){
            metricCell?.prompt.text = "tap for details"
        }
        
        
        loadChartData( metricCell!, data: cellData)
        return cell
    }
    
    /** Handle selection of row
    
    */
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        
         let cellData =  metricChartData[ indexPath.item]
        
        if (MetricType.enumForKey(cellData.metric.getUserInfo("metricType")) == MetricType.TwitterVolume){
            performSegueWithIdentifier("twitterSegue", sender: nil)
        }
        
    }
    
   /* func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath)
    {
    }*/
    
   

    /** load the chart data and then update the table cell
        - parameter cell: table cell to update
        - parameter data: Metric chart data to load
    */
    func loadChartData(cell : MetricCell, data: MetricAnomalyChartData){
      

        dispatch_async(loadQueue) {
            UIApplication.sharedApplication().networkActivityIndicatorVisible = true
            data.load()
            if (data.rawData != nil){
                dispatch_async(dispatch_get_main_queue()) {
                    
                    data.setEndDate(  (self.timeSlider?.endDate)!)
                    data.refreshData()
                    cell.chart.data  = data.rawData!
                    cell.chart.anomalies = data.data!
                    cell.chart.updateData()
                    cell.data = data
                    
                    UIApplication.sharedApplication().networkActivityIndicatorVisible = false
                  }
            }
        }
    }
    

    /** load twitter scene
    */
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "twitterSegue" {
            if let indexPath = self.instanceTable.indexPathForSelectedRow {
                let controller = segue.destinationViewController as! TwitterViewController
                
                controller.metricChartData = self.metricChartData[indexPath.row].shallowCopy()
                controller.chartData = self.chartData
            }
        }
    }

}

