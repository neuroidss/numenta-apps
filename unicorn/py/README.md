# Numenta Unicorn: Backend Model Runner

This directory is for ModelRunner and Support (Python / C++).
It's functionality is exposed to the user via GUI and Model Management code.

See: `requirements.txt`


## Example usage

To generate mock data and feed it to the model runner, run:

```
python unicorn_backend/mock_data_generator.py | \
python unicorn_backend/model_runner.py \
  --model "1" \
  --stats '{"max": 10, "min": 0}'
```

This will output the model output to stdout.

Optionally, you may override the parameters in the model by way of the
`--replaceParam` CLI argument.  For example:

```
python unicorn_backend/model_runner.py \
  --model "1" \
  --stats '{"max": 10, "min": 0}' \
  --replaceParam modelConfig/modelParams/spParams/spVerbosity 1
```

See `python unicorn_backend/model_runner.py --help` for full details on
command line options.

Note that simply running `python unicorn_backend/mock_data_generator.py` will
just generate the data input. When you pipe the two scripts together
(`mock_data_generator.py` to `model_runner.py`) this will feed the data input
to the model runner via stdout and in turn, it outputs the model results to
stdout.

## Tests

- Run unit AND integration tests

  ```
  python setup.py test
  ```

- Run unit tests only

  ```
  python setup.py test -a unit
  ```

- Run integration tests only

  ```
  python setup.py test -a integration
  ```

- Run a specific test

  ```
  python setup.py test -a "-k <matching term>"
  ```

- Help on additional functionality

  ```
  python setup.py test -a "--help"
  ```
