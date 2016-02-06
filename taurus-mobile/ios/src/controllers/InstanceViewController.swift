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

class InstanceViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UISearchResultsUpdating, UISearchBarDelegate {

    @IBOutlet var timeSlider: TimeSliderView?
    @IBOutlet var instanceTable: UITableView!
    @IBOutlet var menuButton: UIBarButtonItem?
    @IBOutlet var dateLabel: UILabel?
    @IBOutlet var progressLabel: UILabel?

    var searchController: UISearchController?
    var searchButton: UIBarButtonItem?
    var searchSpacerButton: UIBarButtonItem?
    var favoriteSegment: UIBarButtonItem?
    var favoriteSegmentControl: UISegmentedControl?
    var searchControllerButton: UIBarButtonItem?
    var logo: UIBarButtonItem?
    let dayTimePeriodFormatter = NSDateFormatter()
    var hide = false

    var _aggregation: AggregationType = TaurusApplication.getAggregation()
    var tableData = [Int : [InstanceAnomalyChartData]]() // Data to show, after filtering
    var currentData = [Int : [InstanceAnomalyChartData]]() // data before filtering
    var allData = [Int : [InstanceAnomalyChartData]]() // all data
    var synchronizing = false // Whether or not the view is already loading data from the database

    override func viewDidLoad() {
        super.viewDidLoad()

        // Set up Search bar
        searchController = UISearchController(searchResultsController: nil)
        searchController!.searchResultsUpdater = self
        searchController!.dimsBackgroundDuringPresentation = false
        searchController!.searchBar.sizeToFit()
        searchController!.searchBar.delegate = self
        searchController!.hidesNavigationBarDuringPresentation = false
        self.definesPresentationContext = true

        // Add spacer to search
        searchSpacerButton = UIBarButtonItem(barButtonSystemItem: .FixedSpace, target: self, action: nil)
        searchSpacerButton?.width = -20

        // Add buttons to navigation bar
        searchButton = UIBarButtonItem(barButtonSystemItem: .Search, target: self, action: "showSearch")
        searchButton!.tintColor = UIColor.whiteColor()
        searchButton!.imageInsets = UIEdgeInsetsMake(0, 0, 0, -40)

        let items = ["All", "Favorites"]
        favoriteSegmentControl = UISegmentedControl(items: items)
        favoriteSegmentControl!.selectedSegmentIndex = 0
        favoriteSegmentControl!.tintColor = UIColor.whiteColor()
        favoriteSegmentControl!.addTarget(self, action: "favoriteSwitch:", forControlEvents: UIControlEvents.ValueChanged)
        favoriteSegmentControl!.setWidth(50.0, forSegmentAtIndex: 0)
        favoriteSegmentControl!.setWidth(65.0, forSegmentAtIndex: 1)
        let container = UIView()
        container.addSubview(favoriteSegmentControl!)
        container.backgroundColor = UIColor.blueColor()

        favoriteSegment = UIBarButtonItem(customView:favoriteSegmentControl!)
        searchControllerButton = UIBarButtonItem(customView: self.searchController!.searchBar)
        searchController?.searchBar.hidden = false

        let menuIcon = UIImage(named: "menu")
        let b2 = UIBarButtonItem (image: menuIcon, style: UIBarButtonItemStyle.Plain, target: self, action: "showMenu:")
        self.menuButton = b2

        b2.tintColor = UIColor.whiteColor()

        self.navigationItem.rightBarButtonItems = [menuButton!, searchButton!]

        // Show header icon

        let icon = UIImage(named: "ic_grok_logo")!.imageWithRenderingMode(UIImageRenderingMode.AlwaysOriginal)

        // icon?.renderingMode = UIImageRenderingModeAlwaysOriginal
        logo = UIBarButtonItem (image: icon, style: UIBarButtonItemStyle.Plain, target: nil, action: nil)
        logo!.imageInsets = UIEdgeInsetsMake(0, 0, 0, -20)

        // Shift it to the left to free up some space

        self.navigationItem.leftBarButtonItems = [logo!, favoriteSegment!]

        // Hook up swipe gesture

        let panRec = UIPanGestureRecognizer()
        panRec.addTarget(self, action: "draggedView:")
        timeSlider?.addGestureRecognizer(panRec)

        // on iOS 8+ need to make sure table background is clear

        instanceTable.backgroundColor = UIColor.clearColor()

        NSNotificationCenter.defaultCenter().addObserverForName(TaurusDatabase.INSTANCEDATALOADED, object: nil, queue: nil, usingBlock: {
            [unowned self] note in
            self.syncWithDB()
            })

        NSNotificationCenter.defaultCenter().addObserverForName(TaurusDataSyncService.INSTANCE_DATA_CHANGED_EVENT, object: nil, queue: nil, usingBlock: {
            [unowned self] note in
            self.syncWithDB()
            })

        self.syncWithDB()

        /*  if self.revealViewController() != nil {
        menuButton!.target = self.revealViewController()
        menuButton!.action = "rightRevealToggle:"
        //  self.view.addGestureRecognizer(self.revealViewController().panGestureRecognizer())
        self.revealViewController().rightViewRevealWidth = 180
        }*/


        dayTimePeriodFormatter.dateFormat = "EEEE, M/d"
        dateLabel!.layer.masksToBounds = true
        self.dateLabel!.hidden  = true

        progressLabel!.layer.masksToBounds = true

        let firstRun = NSUserDefaults.standardUserDefaults().boolForKey("firstRun")
        if firstRun != true {
            self.navigationController!.performSegueWithIdentifier ("startTutorial", sender: nil)
            NSUserDefaults.standardUserDefaults().setBool(true, forKey: "firstRun")
        }

        // Show sync progress
        NSNotificationCenter.defaultCenter().addObserverForName(DataSyncService.PROGRESS_STATE_EVENT, object: nil, queue: nil, usingBlock: {
            [unowned self] note in
            let date = note.object as? NSDate

            dispatch_async(dispatch_get_main_queue()) {
                if date == nil || self.tableData.count > 0 {
                    self.progressLabel!.hidden  = true
                    return
                }
                self.progressLabel!.text = "Syncing\r\n"+self.dayTimePeriodFormatter.stringFromDate(date!)
                self.progressLabel!.hidden  = false
            }
            })
    }

    func showMenu( sender: UIButton) {
        CustomMenuController.showMenu(self)
    }

    /** shows search bar in navigation area
     */
    func showSearch() {
        self.navigationItem.setRightBarButtonItems([searchSpacerButton!, searchControllerButton!], animated: true)
        self.navigationItem.setLeftBarButtonItems([], animated: true)
        searchController?.searchBar.becomeFirstResponder()
    }

    /* hide search bar*/
    func searchBarCancelButtonClicked(_searchBar: UISearchBar) {
        self.navigationItem.setRightBarButtonItems([menuButton!, searchButton!], animated: true)
        self.navigationItem.setLeftBarButtonItems([logo!, favoriteSegment!], animated: true)

        favoriteSegmentControl?.selectedSegmentIndex = 0
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func favoriteSwitch(segment: UISegmentedControl) {
        if segment.selectedSegmentIndex == 0 {
            self.tableData = self.allData
        } else {
            var   listData = [Int:[InstanceAnomalyChartData]]()
            let sections: Int = self.allData.count
            for var i = 0; i < sections; i++ {
                listData[i] = [InstanceAnomalyChartData]()
                let sectionData = self.allData[i]!
                for val: InstanceAnomalyChartData in sectionData {
                    if TaurusApplication.isInstanceFavorite(val.instanceId) {
                        listData[i]?.append(val)
                    }
                }
            }

            self.tableData = listData
        }

        self.instanceTable.reloadData()


        //   let service = TaurusNotificationService()
        //  service.showNotification()

    }

    /**
     Handle the swipe gesture
     - parameter sender:
     */
    func draggedView(sender: UIPanGestureRecognizer) {
        //  self.view.bringSubviewToFront(sender.view)
        let translation = sender.translationInView(self.view)
        //  print (translation)
        if abs(translation.y) > abs(translation.x) {
            return
        }
        let distance = getDistance( Double( translation.x) * -1.0 )
        sender.setTranslation(CGPoint.zero, inView: self.view)

        let newTime: NSDate? =  timeSlider?.endDate.dateByAddingTimeInterval(distance)
        //   print ((timeSlider?.endDate,newTime))

        var flooredDate = DataUtils.floorTo5Mins (newTime!)
        let endDateInd = Int64(flooredDate.timeIntervalSince1970 * 1000)

        let maxDate = DataUtils.floorTo5minutes(TaurusApplication.getDatabase().getLastTimestamp())
        let minDate = maxDate - (Int64(TaurusApplication.getNumberOfDaysToSync() - 1)) * DataUtils.MILLIS_PER_DAY
        // Check max date and no date
        if endDateInd > maxDate {
            flooredDate =  NSDate(timeIntervalSince1970: Double(maxDate)/1000.0 )
        }
        // Check min date
        if endDateInd < minDate {
            flooredDate =  NSDate(timeIntervalSince1970: Double(minDate)/1000.0 )

        }

        // print (distance/(60*60))
        //   print ((timeSlider?.endDate,flooredDate))
        timeSlider?.endDate =  flooredDate
        timeSlider?.setNeedsDisplay()

        self.dateLabel!.text = self.dayTimePeriodFormatter.stringFromDate(flooredDate)
        self.dateLabel!.hidden  = false
        let visibleCells = self.instanceTable.visibleCells
        for cell in visibleCells {
            let instanceCell = cell as! InstanceCell
            instanceCell.data?.setEndDate (flooredDate)
            instanceCell.data?.load()
            instanceCell.chart.setData(instanceCell.data?.getData())
            instanceCell.setNeedsDisplay()
        }
        self.hide  = false
        if sender.state == .Ended {
            self.hide = true
            // Pan has ended. Hide label in a couple of seconds
            let dispatchTime: dispatch_time_t = dispatch_time(DISPATCH_TIME_NOW, Int64(3 * Double(NSEC_PER_SEC)))

            dispatch_after(dispatchTime, dispatch_get_main_queue(), {
                if self.hide {
                    self.dateLabel!.hidden  = true
                }
            })
        }
    }

    /* get the amount of time to shift
     -parameter distance: length of swipe
     */
    func getDistance(distance: Double) -> Double {
        let width =  self.view.frame.size.width
        let pixels = Double(Double(width) / (Double)(TaurusApplication.getTotalBarsOnChart()))
        let scrolledBars = Double(Int64 (distance / pixels))
        // Scroll date by aggregation interval
        let interval = Double(TaurusApplication.getAggregation().milliseconds())/1000.0
        let timeDistance = Double(interval * scrolledBars)*(1.0)
        //   print ((pixels, scrolledBars, timeDistance))
        return timeDistance
    }

    /** number of sections in the table with data. Skips over entries with 0 data elements
     - parameter tableView: table
     - returns: number of sections
     */
    func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        var numSections = 0

        for item in tableData {
            if item.1.count > 0 {
                numSections++
            }
        }

        return numSections
    }




    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {

        let data = tableData[ getSectionIndex(section)]
        if data != nil {
            return tableData[ getSectionIndex(section)]!.count
        }
        return 0
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell: InstanceCell? = self.instanceTable.dequeueReusableCellWithIdentifier("InstanceCell") as! InstanceCell?

        cell?.backgroundColor = UIColor.clearColor()
        let data = tableData[ getSectionIndex(indexPath.section)]

        if data != nil {
            let chartData = data![ indexPath.item]

            cell?.ticker.text = chartData.ticker
            cell?.name.text  = chartData.name
            cell?.data = chartData
            if chartData.hasData() && !chartData.modified {
                let cv: AnomalyChartView? = cell!.chart
                let valueData = chartData.getData()
                cv!.setData (valueData)
                // loadChartData (cell!, data: chartData)
            } else {
                loadChartData (cell!, data: chartData)
            }
        }

        return cell!
    }

    /*    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
    }

    func tableView(tableView: UITableView, commitEditingStyle editingStyle: UITableViewCellEditingStyle, forRowAtIndexPath indexPath: NSIndexPath)
    {

    }*/

    /** gets the index into the table data
    - parameter section: table section
    - returns: data section
    */
    func getSectionIndex (section: Int) -> Int {
        var sections: Int = 0
        var index = 0
        for index = 0; index < tableData.count; index++ {
            let data = tableData[index]!
            if data.count == 0 {
                continue
            }
            if sections == section {
                break
            }
            sections++
        }
        return index
    }


    func tableView(tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
        let tableViewWidth = self.instanceTable.bounds.width

        let headerView = UIView(frame: CGRectMake(0, 0, tableViewWidth, self.instanceTable.sectionHeaderHeight))
        let label = UILabel(frame: CGRectMake(10, 0, tableViewWidth - 20, self.instanceTable.sectionHeaderHeight))
        label.backgroundColor = UIColor.init(red: 0.7, green: 0.7, blue: 0.7, alpha: 1.0)
        label.font  = UIFont.boldSystemFontOfSize(14.0)
        headerView.addSubview(label)

        let sectionIndex = getSectionIndex( section)
        switch sectionIndex {
        case 0:
            label.text =  " Stock & Twitter"
        case 1:
            label.text =  " Stock"
        case 2:
            label.text =  " Twitter"
        default:
            label.text =  " No anomalies"
        }
        return headerView
    }

    /*  func tableView(tableView: UITableView, editActionsForRowAtIndexPath indexPath: NSIndexPath) -> [UITableViewRowAction]?
    {
    let shareAction = UITableViewRowAction(style: .Normal, title: "Favorite" , handler: { (action:UITableViewRowAction, indexPath:NSIndexPath) -> Void in

    })

    shareAction.backgroundColor = UIColor.blueColor()

    return [shareAction]
    }*/


    func loadChartData(cell: InstanceCell, data: InstanceAnomalyChartData) {

        let priority = DISPATCH_QUEUE_PRIORITY_DEFAULT
        dispatch_async(dispatch_get_global_queue(priority, 0)) {
            data.setEndDate( self.timeSlider!.endDate)
            data.load()
            if data.hasData() {
                dispatch_async(dispatch_get_main_queue()) {
                    cell.chart.setData ( data.getData())
                }
            }
        }
    }


    func syncWithDB() {
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0)) {
            if self.synchronizing {
                return
            }
            self.synchronizing = true
            let instanceSet = TaurusApplication.getDatabase().getAllInstances()
            var   listData = [Int:[InstanceAnomalyChartData]]()
            for var i = 0; i<4; i++ {
                listData[i] = [InstanceAnomalyChartData]()
            }

            for  instance in instanceSet {
                let instanceChartData = InstanceAnomalyChartData(instanceId: instance, aggregation: self._aggregation)
                instanceChartData.setEndDate( DataUtils.dateFromTimestamp(TaurusApplication.getDatabase().getLastTimestamp() ))
                instanceChartData.load()

                let metrics = instanceChartData.anomalousMetrics
                let hasStock = metrics.contains (MetricType.StockPrice) || metrics.contains(MetricType.StockVolume)
                let hasTwitter = metrics.contains(MetricType.TwitterVolume)
                var index  = 3
                if hasTwitter && hasStock {
                    index = 0
                } else if hasStock {
                    index = 1
                } else if hasTwitter {
                    index  = 2
                }

                var instanceArray = listData[index]
                instanceArray!.append ( instanceChartData)
                listData[index] = instanceArray

            }

            for var i = 0; i<4; i++ {
                var data =  listData[i]
                data!.sortInPlace {
                    if $0.getRank() > $1.getRank() {
                        return true
                    }

                    if $0.getRank() < $1.getRank() {
                        return  false            }


                    let result = $0.getName().compare ($1.getName())


                    if result == NSComparisonResult.OrderedAscending {
                        return true
                    }
                    return false

                }
                listData[i] = data
            }

            self.synchronizing = false

            // Update UI with new data
            dispatch_async(dispatch_get_main_queue()) {
                self.allData = listData
                //   self.currentData = listData
                self.tableData = self.allData
                self.timeSlider?.endDate = DataUtils.dateFromTimestamp( TaurusApplication.getDatabase().getLastTimestamp() )
                self.timeSlider?.setNeedsDisplay()
                self.favoriteSwitch (self.favoriteSegmentControl!)
            }
        }
    }


    func updateSearchResultsForSearchController(searchController: UISearchController) {
        let text = searchController.searchBar.text
        if text!.isEmpty {
            self.tableData = self.allData
            self.instanceTable.reloadData()
            return
        }

        let searchPredicate = NSPredicate(format: "SELF CONTAINS[c] %@", text!)
        var   listData = [Int:[InstanceAnomalyChartData]]()
        for var i = 0; i<4; i++ {
            listData[i] = [InstanceAnomalyChartData]()

            if i >= self.allData.count {
                continue
            }

            let sectionData = self.allData[i]!
            for val: InstanceAnomalyChartData in  sectionData {
                if searchPredicate.evaluateWithObject ( val.ticker ) ||
                    searchPredicate.evaluateWithObject ( val.getName()) {
                        listData[i]?.append(val)
                }
            }
        }

        self.tableData = listData
        self.instanceTable.reloadData()
    }

    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "showInstanceDetail" {
            if let indexPath = self.instanceTable.indexPathForSelectedRow {
                let controller = segue.destinationViewController as! InstanceDetailsViewController
                let data = tableData[ getSectionIndex(indexPath.section)]
                if data != nil {
                    controller.chartData = data![ indexPath.item]
                }
                self.instanceTable.deselectRowAtIndexPath (indexPath, animated: false)
            }
        }
    }

    /**
     * Detect long press on table row and present the add/remove favorite dialog
     */
    @IBAction func handleLongPress(sender: AnyObject ) {
        if sender.state == UIGestureRecognizerState.Began {
            let longPress = sender as? UILongPressGestureRecognizer
            let location = longPress!.locationInView (self.instanceTable)
            let indexPath = self.instanceTable.indexPathForRowAtPoint(location)
            if indexPath == nil {
                return
            }

            let data = tableData[getSectionIndex(indexPath!.section)]
            if data == nil {
                return
            }

            let chartData = data![ indexPath!.item]
            let favorite = TaurusApplication.isInstanceFavorite(chartData.getId())
            var msg = "Add as favorite?"
            if favorite {
                msg = "Remove as favorite?"
            }

            let alertView = UIAlertController(title: "", message: msg, preferredStyle: .Alert)
            alertView.addAction(UIAlertAction(title: "Yes", style: .Default, handler: { (alertAction) -> Void in

                // Google Analytics
                let tracker = GAI.sharedInstance().defaultTracker
                let builder = GAIDictionaryBuilder.createEventWithCategory("Favorites", action: favorite ? "Remove" : "Add", label: chartData.ticker, value: 1)
                tracker.send(builder.build() as [NSObject : AnyObject])

                if favorite {
                    TaurusApplication.removeInstanceToFavorites(chartData.getId())
                } else {
                    TaurusApplication.addInstanceToFavorites(chartData.getId())
                }
            }))
            alertView.addAction(UIAlertAction(title: "No", style: .Cancel, handler: nil))
            presentViewController(alertView, animated: true, completion: nil)
        }
    }
    override func viewWillAppear(animated: Bool) {
        // Google Analytics
        let tracker = GAI.sharedInstance().defaultTracker
        tracker.set(kGAIScreenName, value: "com.numenta.taurus.instance.InstanceListActivity")
        let builder = GAIDictionaryBuilder.createScreenView()
        tracker.send(builder.build() as [NSObject : AnyObject])
    }
}
