This is the umbrella project for all of the components that make up the
Numenta product-line.

## Installation

All python packages include a setuptools-compatible
setup.py with which the package may be installed.  For example, to install
in developer mode (recommended), you may run the following commands:

    pushd <project>
    python setup.py develop --install-dir=<site-packages in $PYTHONPATH> --script-dir=<somewhere in $PATH>
    popd

Or, if you prefer pip:

    pip install --editable --user <project>

You can see coverage across multiple projects as follows:

    py.test --cov nta.utils --cov htmengine --cov taurus taurus/tests/unit htmengine/tests/unit nta.utils/tests/unit


## Licenses

Each code directory defined below contains its own `LICENSE.txt` file and defines program dependencies within a `DEPENDENCIES.md` file.


## Main Products


### Grok

See http://numenta.com/grok. 

### [`/grok`](grok)

AWS/Cloudwatch integration for HTM Engine.

**Languages**: Python, JavaScript, HTML

### [`/grok-mobile`](grok-mobile)

Grok mobile client.

**Languages**: Java


### Grok for Stocks

Code name: _**Taurus**_. Application for tracking company data.

#### [`/taurus`](taurus)

Server-side code for Taurus.

**Languages**: Python

#### [`/taurus-mobile`](taurus-mobile)

Grok for Stocks mobile client.

**Languages**: Java

#### [`/taurus.metric_collectors`](taurus.metric_collectors)

Custom metric collectors for Grok for Stocks data providers.

**Languages**: Python

#### [`/taurus.monitoring`](taurus.monitoring)

Monitoring scripts and related utilities for monitoring Grok for Stocks 
(Code name: Taurus).

**Languages**: Python

## Support Code

#### [`/nta.utils`](nta.utils)

Shared python package with common utility functions for boilerplate
configuration, logging, and other common operations.

**Languages**: Python

#### [`/htmengine`](htmengine)

HTM Engine Framework upon which Grok and Grok for Stocks are built.
Implements basic infrastructure for receiving data and running models, including
support for custom metrics.

**Languages**: Python

#### [`/mobile-core`](mobile-core)

Shared library used in taurus-mobile and grok-mobile mobile applications.

**Languages**: Java
