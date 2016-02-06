## VM setup
Download VMware fusion 8
- Create a new VM
- Choose "Install OSX from the recovery partition"
- Install VM Ware Tools & restart.
- Get Xcode from the app store (you have to log in with your numenta icloud account to be able to use the app store) -- Wait for installation (it's pretty long). Open app and accept license terms.
- Get brew at brew.sh (install with `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`)
- Install cmake with `brew install cmake`. Check that it works: restart terminal and run `cmake`

### To create a backup of the VM
Source: http://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2006202

> To back up the virtual machine (which includes the operating system, application files, settings, and user data), you need to make a copy of the folder in which the virtual machine is stored. Ensure that the virtual machine is not running or suspended while you are backing up the virtual machine.

To back up the virtual machine:
- Ensure your virtual machine is in a powered off state.
- Locate the virtual machine folder. For more information, see  Locating a hosted virtual machine's files (1003880)
- Right-click the virtual machine folder and click Copy.
- Navigate to the folder in which you want to store the backup, right-click anywhere within the folder, and click Paste.

To create a new VM the backup:
- Double click on the backup image.
- Select "I copied it"


## Building a portable python distribution with nupic and nupic.bindings
* Follow instructions in the section `VM Setup`. You must have XCode and cmake installed.
* Run `build-python.sh`

### Check that it worked
Say `PREFIX` is the install location of your python distribution. To check that nupic and nupic.bindings have been installed correctly, run:
```
$PREFIX/bin/python -c "import nupic.algorithms.anomaly_likelihood"
$PREFIX/bin/python -c "import nupic.bindings.math"
```

## Troubleshooting
### MACOSX_DEPLOYMENT_TARGET and pycapnp on OSX Yosemite
On OSX Yosemite, you may get an error when installing `pycapnp`. This is documented here (https://github.com/numenta/nupic/issues/2061) as a _Yosemite gcc/clang -stdlib=c++ issue_.
Assuming you are running OSX 10.10, you can fix this by running:
```
export MACOSX_DEPLOYMENT_TARGET=10.10
```