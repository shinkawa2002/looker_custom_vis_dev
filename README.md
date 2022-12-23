**A Note on Support**

The visualizations provided in this repository are intended to serve as examples. Looker's support team does not troubleshoot issues relating to these example visualizations or your custom visualization code. Supported visualizations are downloadable through the [Looker Marketplace](https://docs.looker.com/data-modeling/marketplace). 

----

# Looker Visualization API Examples [![Build Status](https://travis-ci.org/looker/visualization-api-examples.svg?branch=master)](https://travis-ci.org/looker/visualization-api-examples)

[Looker](https://looker.com/)'s Visualization API provides a simple JavaScript interface to creating powerful, customizable visualizations that seamlessly integrate into your data applications. :bar_chart: :chart_with_downwards_trend: :chart_with_upwards_trend:

### [Getting Started Guide &rarr;](docs/getting_started.md)

### [Visualization API Reference &rarr;](docs/api_reference.md)

### [View Examples Library &rarr;](src/examples)

# Getting Started

1. [Ensure you have Yarn installed.](https://yarnpkg.com)
2. Run `yarn`
3. :boom: start creating!

# Commands

* `yarn build:development` - Compiles the code in `/src` to `/dist` via webpack
* `yarn start` - Runs web server with self-cetrificate to serve custom visualization via port 8081 from local.
* `yarn build:production` - Compilles and optimize the code in `/src` to `/stable` via webpack


----

