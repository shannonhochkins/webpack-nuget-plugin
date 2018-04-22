[![npm version](https://badge.fury.io/js/webpack-nuget-plugin.svg)](https://badge.fury.io/js/webpack-nuget-plugin)
[![npm](https://img.shields.io/npm/dt/webpack-nuget-plugin.svg)]()
# Webpack Nuget Plugin

This plugin allows you to run nuget restore at a specific times using the Webpack compilation hooks. This plugin is shipped with the Nuget.exe (v3.4.4.1321)so we don't have to automatically locate it, however you can also point to a different one using the configuration options.

_This plugin was built for Windows 10 and Windows Server 2012 - it is not tested in any other OS and most likely will have issues. Written in Node v9 for webpack 4, webpack 3 won't work as they've changed the hook functionality (can work with very little work)_


1. [Installation](#installation)
2. [Setup Basic](#setup-basic)
3. [Setup Advanced](#setup-advanced)
4. [Custom Run Hook](#custom-run-hook)
5. [Custom Logger](#custom-logger)

_
## Installation

`npm install webpack-nuget-plugin`

## Setup Basic

Simplest configuration a nuget commands which will run when webpack has finished compilation will happen by using the runHook, (you can also change _when_ the `runHook` method) In `webpack.config.js`:

By default it will run in 'restore' mode, you can change this by using the `args` configuration options:

```js
const WebpackNugetPlugin = require('webpack-nuget-plugin');

module.exports = {
    ...
    ...
    plugins: [
        new WebpackNugetPlugin({
            solutionPath: 'path/to/project.sln'
        })
    ],
    ...
}
```

## Setup Advanced

Extended functionality/configuration and all their defaults, this outlines the possiblity with hooks, console, runHook and the other options that are possible for this plugin.

```js
const WebpackNugetPlugin = require('webpack-nuget-plugin');

module.exports = {
    ...
    ...
    plugins: [
        new WebpackNugetPlugin({
            // reference nuget.exe or overwrite
            nugetPath : path.resolve(__dirname, './nuget.exe'),
            // the solution path to run nuget restore on
            solutionPath : undefined,
            // can use mono if needed (will only use this if it's provided)
            monoPath: null,
            // default arguments
            args : ['restore'],
            // can pass additional arguments to the nuget exe as it's executed
            // http://docs.nuget.org/docs/reference/command-line-reference
            additionalArgs: [],
            // custom callbacks to the output console
			outputConsole : {
				log : console.log,
				error: console.error
            },
            // custom hook to be able to run the restore at an alternate time instead of compile time
            // @see Custom runHook method examples below
			runHook(compiler, run) {
				compiler.hooks.compile.tap('WebpackNuget', run);
            },
            hooks: {
                // will call just before the nuget.exe file is executed
                onStart: (data) => {},
                // will call whenever the plugin spits out any output
                onData: (data) => {},
                // will call whenever there's an issue thrown by the plugin
                onError: (data) => {},
                // will call when the plugin has successfully completed
                onDone: (data) => {}
            }
        })
    ],
    ...
}
```

### Custom Run Hook
By default this plugin will run before a new compilation is created, there's a wide range of [hooks available from Webpack](https://webpack.js.org/api/compiler-hooks/), By default we use 'compile'.

```js
const WebpackNugetPlugin = require('webpack-nuget-plugin');

module.exports = {
    ...
    ...
    plugins: [
        new WebpackNugetPlugin({
            // the solution path to run nuget restore on
            solutionPath : 'path/to/solution.sln',
			runHook(compiler, run) {
                // compiler.hooks.compile.tap('WebpackNuget', run);
                // instead of running before compilition, now we're running after compilation
                // just make sure you understand the tap libarary the webpack's core hook functionality
                // is build from: https://github.com/webpack/tapable
                compiler.hooks.compilation.tap('WebpackNuget', run);
            }
        })
    ],
    ...
}
```

### Custom Logger
If you want to stop the plugin logging out to the console, or replace it with your own logger:

```js
const WebpackNugetPlugin = require('webpack-nuget-plugin');

module.exports = {
    ...
    ...
    plugins: [
        new WebpackNugetPlugin({
            solutionPath : `path/to/solution.sln`,
            outputConsole: {
                log(data) {
                    // data is an object, containing a type, msg and extra data like what project is sending the output, 
                    // or where abouts in the chain is it throwing the output
                    console.log(data.msg);
                },
                error(data) {
                    // data is an object, containing a type, msg and extra data like what project is sending the output, 
                    // or where abouts in the chain is it throwing the output
                    process.exit(0);
                }
            }
        })
    ],
  ...
}
```

### Development

If you want to contribute or extend this plugin, clone the repository and run npm install, then there's only two scripts: npm run build, npm run watch.
There's no tests (yet), make your changes in src and the output lib will update.