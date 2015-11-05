# Numenta Imbu

> Application to demonstrate HTM NLP functionality on survey data.

>This application is based on Numenta [Unicorn application](https://github.com/numenta/numenta-apps/tree/master/unicorn) and  [Nupic Fluent](https://github.com/numenta/nupic.fluent).

# License

  AGPLv3. See [LICENSE.txt](LICENSE.txt)

## UNDER HEAVY DEVELOPMENT

### Setup

```shell
brew install git node  # darwin
git clone https://github.com/numenta/numenta-apps
cd numenta-apps/imbu
npm install
python setup.py install
```

### nupic.research dependencies (FIXME)

Currently **Fluent** depends on [nupic.research/classification](https://github.com/numenta/nupic.research/tree/master/classification) project. As of this writings you will need to install this dependency manually.

```shell
git clone https://github.com/numenta/nupic.research
export PYTHONPATH=$PYTHONPATH:<path to "nupic.research/classification">
```

#### Cortical.io Setup

1. Get [cortical.io](http://www.cortical.io/) API key from http://www.cortical.io/resources_apikey.html
1. Update `CORTICAL_API_KEY` value with your new API key in [conf/supervisord.conf](conf/supervisord.conf) configuration file.

## Running

Change working directory to `numenta-apps/imbu`:

```shell
cd numenta-apps/imbu
```

Build Web App:

```shell
npm run pack-web
```

Start `nginx`:

```shell
sudo nginx -p . -c conf/nginx-fluent.conf
```

Start `Fluent API` services:

```shell
mkdir -p logs
supervisord -c conf/supervisord.conf
```

Open application from this URL: http://localhost:8080
