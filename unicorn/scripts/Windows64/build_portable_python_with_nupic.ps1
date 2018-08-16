# See README.md for instructions about prerequisites and how to run this script.

param (
    [string]$nupic_unzip_path = (split-path -parent $MyInvocation.MyCommand.Definition),
    [switch]$install_nupic = $false,
    [switch]$cleanup = $false
)

Write-Host "==> Will unzip nupic source to: $nupic_unzip_path"
$script_path = split-path -parent $MyInvocation.MyCommand.Definition

# Python
$python_version = "2.7.11"
$portable_python_dir = "portable_python"
$python_msi_url = "https://www.python.org/ftp/python/$python_version/python-$python_version.amd64.msi"
$python_msi = "python-$python_version.amd64.msi"

# Pip
$get_pip_url = "http://releases.numenta.org/pip/1ebd3cb7a5a3073058d0c9552ab074bd/get-pip.py"
$get_pip = "get-pip.py"

# nupic.bindings
$wheelhouse_dir = "wheelhouse"
$nupic_bindings_version = "0.2.8.dev0"
$nupic_bindings_whl_url = "http://s3-us-west-2.amazonaws.com/artifacts.numenta.org/numenta/nupic.core/releases/nupic.bindings/nupic.bindings-$nupic_bindings_version-cp27-none-win_amd64.whl"
$nupic_bindings_whl= "bindings-$nupic_bindings_version-cp27-none-win_amd64.whl"

# nupic
$nupic_version = "0.3.6"
$nupic_zip_url = "https://github.com/numenta/nupic/archive/$nupic_version.zip"
$nupic_zip = "nupic-$nupic_version.zip"
$nupic_dir = "nupic"

# Utility function to unzip files
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Unzip
{
    param([string]$zipfile, [string]$outpath)

    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipfile, $outpath)
}

# Utility function to zip files
function ZipFiles( $zipfilename, $sourcedir )
{
   Add-Type -Assembly System.IO.Compression.FileSystem
   $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
   [System.IO.Compression.ZipFile]::CreateFromDirectory($sourcedir,
        $zipfilename, $compressionLevel, $false)
}

if ($cleanup){
    Write-Host "==> Uninstalling Python ..."
    Start-Process  -Wait -FilePath msiexec -ArgumentList /x, $python_msi, /passive, /norestart

    Write-Host "==> Cleaning up files and directories ..."

    Remove-Item -Force -ErrorAction Ignore $script_path/$python_msi
    Remove-Item -Force -ErrorAction Ignore $script_path/$get_pip
    Remove-Item -Force -ErrorAction Ignore $script_path/$nupic_zip
    Remove-Item -Force -ErrorAction Ignore $script_path/$portable_python_dir -Recurse
    Remove-Item -Force -ErrorAction Ignore $script_path/$wheelhouse_dir -Recurse
    Remove-Item -Force -ErrorAction Ignore $script_path/$nupic_dir -Recurse

    New-Item $script_path/$portable_python_dir -type Directory | Out-Null
    New-Item $script_path/$wheelhouse_dir -type Directory | Out-Null
}

Write-Host "==> Downloading Python ..."
Invoke-WebRequest -Uri $python_msi_url -OutFile $script_path\$python_msi

Write-Host "==> Installing Python ..."
Start-Process  -Wait -FilePath msiexec -ArgumentList /a, $python_msi, ALLUSERS=0, TARGETDIR=$script_path\$portable_python_dir, /passive, /norestart

Write-Host "==> Downloading get-pip.py ..."
Invoke-WebRequest -Uri $get_pip_url -OutFile $get_pip

Write-Host "==> Installing pip ..."
Invoke-Expression "$script_path\$portable_python_dir\python.exe $get_pip"

if ($install_nupic) {
    Write-Host "==> Downloading nupic.bindings wheel ..."
    Invoke-WebRequest -Uri $nupic_bindings_whl_url -OutFile $script_path\$wheelhouse_dir\$nupic_bindings_whl

    Write-Host "==> Installing nupic.bindings wheel ..."
    Invoke-Expression "$script_path\$portable_python_dir\Scripts\pip.exe install wheel"
    Invoke-Expression "$script_path\$portable_python_dir\Scripts\pip.exe install $wheelhouse_dir\$nupic_bindings_whl"

    Write-Host "==> Downloading nupic source ..."
    Invoke-WebRequest -Uri $nupic_zip_url -OutFile $script_path\$nupic_zip

    Write-Host "==> Unzipping nupic source ..."
    Unzip $script_path\$nupic_zip $nupic_unzip_path\$nupic_dir

    Write-Host "==> Building nupic wheel ..."
    cd $nupic_unzip_path\$nupic_dir\nupic-$nupic_version
    Invoke-Expression "$script_path\$portable_python_dir\python.exe setup.py bdist_wheel -d $script_path\$wheelhouse_dir"
    cd $script_path

    Write-Host "==> Installing nupic wheel ..."
    Invoke-Expression "$portable_python_dir\Scripts\pip.exe install $wheelhouse_dir\nupic-$nupic_version-py2-none-any.whl"

    Write-Host "==> Testing that nupic and nupic.bindings were succesfully installed ..."
    $test_nupic_bindings_import = "$portable_python_dir\python.exe -c 'import nupic.bindings.math'"
    $test_nupic_import = "$portable_python_dir\python.exe -c 'import nupic.algorithms.anomaly_likelihood'"
    Write-Host $test_nupic_bindings_import
    Write-Host $test_nupic_import
    Invoke-Expression $test_nupic_bindings_import
    Invoke-Expression $test_nupic_import
}

ZipFiles "$script_path\$portable_python_dir.zip" $script_path\$portable_python_dir
