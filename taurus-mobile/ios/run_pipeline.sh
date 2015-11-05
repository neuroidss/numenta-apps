# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
# Numenta, Inc. a separate commercial license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/

# Install Pods
pod install

# Update AWS Cognito Pool ID
sed -i .bak -e s/\"\"/\"${COGNITO_POOL_ID}\"/g src/app/AppConfig.swift
rm src/app/AppConfig.swift.bak

# Update build number
BUILD_NUMBER=`git rev-list HEAD --count .`
agvtool new-version -all 1.0.${BUILD_NUMBER}

# Build Taurus mobile
xcodebuild clean build archive -workspace taurus.xcworkspace -scheme Taurus -configuration Release -archivePath build/taurus.xcarchive
rm Taurus.ipa
xcodebuild -exportArchive -exportPath Taurus -exportFormat ipa -exportProvisioningProfile "${IOS_PROVISIONING_PROFILE}"  -archivePath build/taurus.xcarchive
