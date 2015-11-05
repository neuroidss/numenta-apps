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


import UIKit
import MessageUI
/** Sliding side navigation/command menu
*/

class MenuController: UITableViewController, MFMailComposeViewControllerDelegate {

    let ABOUT = 5
    let TUTORIAL = 4
    let SETTINGS = 3
    let FEEDBACK = 1
    let SHARE = 2
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Uncomment the following line to preserve selection between presentations
        // self.clearsSelectionOnViewWillAppear = false

        // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
        // self.navigationItem.rightBarButtonItem = self.editButtonItem()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    
    override func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        if (indexPath.item == ABOUT){
            self.showAbout(tableView)
        }
        if (indexPath.item == TUTORIAL){
            self.show ("showTutorial")
        }

        
        if (indexPath.item == SETTINGS){
            self.showSettings(tableView)
        }
        
        if (indexPath.item == FEEDBACK){
            self.feedback()
        }
        
        
        if (indexPath.item == SHARE){
            self.share()
        }
        
        
    }
    
    func show ( name : String){
    self.revealViewController().rightRevealToggle(self)
    self.revealViewController().frontViewController.performSegueWithIdentifier (name, sender: nil)
    }
    
    @IBAction func showAbout( sender: UIView ){
        self.revealViewController().rightRevealToggle(self)
        self.revealViewController().frontViewController.performSegueWithIdentifier ("showAbout", sender: nil)
    }
    
    @IBAction func showSettings( sender: UIView ){
        self.revealViewController().rightRevealToggle(self)
        self.revealViewController().frontViewController.performSegueWithIdentifier ("showSettings", sender: nil)
    }
    
    @IBAction func share( ){
         self.revealViewController().rightRevealToggle(self)
        let shareService = ShareService()
        shareService.share(self.revealViewController().frontViewController)
    }
    
    @IBAction func feedback(){
         self.revealViewController().rightRevealToggle(self)
        let shareService = ShareService()
        shareService.feedback(self.revealViewController().frontViewController, presenter : self)
    }
    
    /** mail delegate
    */
    func mailComposeController(controller: MFMailComposeViewController!, didFinishWithResult result: MFMailComposeResult, error: NSError!) {
        
        controller.dismissViewControllerAnimated(true, completion: nil)
    }

    
}
