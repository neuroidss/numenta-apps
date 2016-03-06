# Portable python build script

## Prerequisites
* Install [Microsoft .NET Framework 3.5](https://www.microsoft.com/en-us/download/details.aspx?id=21) to be able to install Microsoft 
Visual C++ for Python.
* Install [Visual C++ for Python](http://aka.ms/vcpython27).

## Building a portable python with NuPIC
### Simple way: pip install nupic
The script `simple_build_portable_python_with_nupic.ps1` will install a portable python distribution with NuPIC (with `pip install nupic`).
The flag to pass the specific version of nupic is: `-nupic_version`. E.g: `0.3.8` (default value is `0.3.6`)
```
powershell.exe -ExecutionPolicy RemoteSigned .\simple_build_portable_python_with_nupic.ps1 -nupic_version=0.3.6
```

### Better way: fetch nupic.core and nupic wheels
The script `build_portable_python_with_nupic.ps1` will install a portable python distribution with NuPIC by fetching the nupic.bindings wheel and installing nupic in the same fashion. The options opf this script are:
```
-cleanup: (default: False) Clean the build dir and make sure the Python 
distribution is installed from scratch.
-install_nupic: (default: False) Install nupic (and nupic.bindings)
-nupic_unzip_path: (default: <build_script_dir>) Path where to install NuPIC.
```

## Running the scripts
To run these scripts with the right execution policy, open PowerShell or a 
command prompt and run powershell.exe with the `ExecutionPolicy` flag set to `RemoteSigned`. For example:
```
powershell.exe -ExecutionPolicy RemoteSigned .\build_portable_python_with_nupic.ps1 -cleanup -install_nupic  -nupic_unzip_path "Z:\tmp"
```
This will cleanup the build directory and unzip the NuPIC source code in the directory `Z:\tmp`.

## Notes
Alternative way to run the script with PowerShell:
1. Start Windows PowerShell with the `Run as Administrator` option. Only members of the Administrators group on the computer can change the execution policy.
2. Enable running unsigned scripts: `Set-ExecutionPolicy RemoteSigned`. This will allow running unsigned scripts that you write on your local computer and signed scripts from Internet.
3. Run the script. For example: `.\build_portable_python_with_nupic.ps1 -cleanup -install_nupic`