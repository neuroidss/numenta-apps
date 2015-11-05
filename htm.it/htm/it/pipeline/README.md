### Running the Pipeline
The pipeline can be run end-to-end via the driver script, or each individual step can be run independently.

#### Prerequisites
- Ensure the products repository dir is exported in PRODUCTS variable
- Run `$PRODUCTS/install-htm-it.sh <PREFIX>` where `<PREFIX>` conforms to the Python prefix scheme described at https://docs.python.org/2/install/#how-installation-works
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables must be set
- Set `HTM_IT_HOME` to `$PRODUCTS/htm-it` to use your existing checkout
- When running locally, make to sure to set "BUILD_WORKSPACE" to one level above your
  products repository to avoid unnecessary cloning.  For example, if you cloned Products to ~/numenta/repositories/products, you would use:

    `export BUILD_WORKSPACE=~/numenta/repositories`
    ```
    e.g. numenta
            |
            |- repositories
                  |- products
                  |- nupic
    ```
- If pipeline does not find "BUILD_WORKSPACE" it will create one for you inside `WORKSPACE` as follows:
  `${WORKSPACE}/<guid/BUILD_NUMBER>`
- If neither `BUILD_WORKSPACE` nor `WORKSPACE` are defined, the pipeline will raise an exception
- Tools accept parameters through command line. Also, parameters can be specified with .json which can be passed as command line parameter(--pipeline-json). Each tool writes phase status in given .json file. Use --help option for each tool for more details for parameters.


#### Execution via driver
```bash
    ./htm-it-pipeline --trigger-pipeline htm-it --htm-it-remote <git-remote> --htm-it-branch <branch-name>
      --sha <commit-sha-for-trigger-pipeline> --release-version <htm-it-version-number> --log <log-level>
```
##### Example
```bash
    ./htm-it-pipeline --trigger-pipeline htm-it --htm-it-remote git@github.com:<github_username>/applications.git
      --htm-it-branch pipeline-development  --sha 7f1c852c719ed6b8de4f8cda42f3e9a583564066 --release-version 1.0 --log debug
```
- Pass parameter via .json file
```
     python build.py --pipeline-json pipeline.json --log debug
```
  Find sample json products/htm.it/htm/it/pipeline/src/pipeline.json.template

  **NOTE**: Currently, only the individual tools accept pipeline JSON files.  The overall pipeline execution relies on the full set of parameters.
