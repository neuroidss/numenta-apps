## Build instructions

### System Requirements:

- Mac OS X `10.10+`
- `XCode 7+` with `iOS 8+` SDK

### Dependencies:

The project dependencies are maintained using `cocoapods`. You must install 
`cocoapods` using the following command:

    sudo gem install cocoapods

Once `cocoapods` is installed you can run `run_pipeline.sh` to create project 
workspace, install all dependencies and build the app. Add new dependencies to 
`Podfile` as required.

### Environment Variables:

You must specify the following environment variables:

- `COGNITO_POOL_ID`: Taurus uses the Amazon Cognito Identity service and AWS
   Security Token Service to create temporary, short-lived sessions to use for
   authentication. Enter the Cognito Identity Pool ID here.
   Something like this: `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   See https://console.aws.amazon.com/cognito/home for more info.

- `GA_TRACKING_ID`: Google Analytics Tracking ID.
   Something like this: `UA-xxxxxxxx-x`.
   See https://developers.google.com/analytics for more info.

- `IOS_PROVISIONING_PROFILE`: iOS Provisioning Profile Name. 
   Something like this: `iOS Wildcard - Beta Test`.
   See https://developer.apple.com/account/ios/profile/profileList.action 
   for more info.

### IDE

Open `taurus.xcworkspace` from `XCode` and start developing. This workspace is 
composed of the `taurus` projects and its `Pods` or dependencies.

### Style Guide

See https://github.com/github/swift-style-guide for proposed style guide.
