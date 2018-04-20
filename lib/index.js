'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _child_process = require('child_process');

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Nuget = function () {
    function Nuget(options) {
        _classCallCheck(this, Nuget);

        // make sure were definitely an object
        options = options || {};
        var DEFAULTS = {
            // reference nuget
            nugetPath: _path2.default.resolve(__dirname, './nuget.exe'),
            // the solution path
            solutionPath: undefined,
            // can use mono if needed
            monoPath: null,
            // can pass additional arguments to the nuget exe package
            additionalArgs: [],
            // custom callbacks to the output console
            outputConsole: {
                log: console.log,
                error: console.error
            },
            // custom hook to be able to run the restore at an alternate time instead of compile time
            runRestore: function runRestore(compiler, run) {
                var $plugin = 'WebpackNuget';
                compiler.hooks.compile.tap($plugin, function (compilation) {
                    run();
                });
            },

            hooks: {
                onStart: function onStart() {},
                onData: function onData() {},
                onError: function onError() {},
                onDone: function onDone() {}
            }
        };
        // if we need to know 
        this.hasCustomOutputLog = options.outputConsole && typeof options.outputConsole.log === 'function';
        this.hasCustomOutputError = options.outputConsole && typeof options.outputConsole.error === 'function';
        this.options = (0, _deepExtend2.default)(DEFAULTS, options);
        if (!this.options.solutionPath) this.error({
            type: 'error',
            options: this.options,
            msg: 'options.solutionPath must be specified.'
        });
    }

    /**
    * @function
    * @name error
    * @description - Will raise an exeception and pass it to the custom function or the console.error
     * @param {object} [data] - The data object to either log out or send to the custom function.
     * @memberof WebpackNuget
     * @returns {undefined} - no return value
    */


    _createClass(Nuget, [{
        key: 'error',
        value: function error(data) {
            if (typeof this.options.outputConsole.error !== 'function') return;
            this.options.outputConsole.error(this.hasCustomOutputError ? data : data.msg);
            this.runHook('onError', data);
            throw new Error(data.msg);
        }

        /**
        * @function
        * @name log
        * @description - Will just simply run a console log or throw the data object to the custom callback function
         * @param {object} [data] - The data object to either log out or send to the custom function.
         * @memberof WebpackNuget
         * @returns {undefined} - no return value
        */

    }, {
        key: 'log',
        value: function log(data) {
            if (typeof this.options.outputConsole.log !== 'function') return;
            this.options.outputConsole.log(this.hasCustomOutputLog ? data : data.msg);
            this.runHook('onData', data);
        }

        /**
         * @function
         * @name apply
         * @description - Standard apply method for the webpack plugin  
            * @param {object} [compiler] - the webpack compiler passed from webpack
            * @returns {undefined} - no return value
         */

    }, {
        key: 'apply',
        value: function apply(compiler) {
            var _this = this;

            this.options.runRestore(compiler, function () {
                _this.restore(_this.options);
            });
        }

        /**
         * @description - Will run the hooks (if present) present on the current group type, there are three hooks available:
         * 
         new WebpackNugetPlugin({
                solutionPath: 'path/to/solution.sln',
                hooks : {
                    onStart() {
                        debugger;
                    },
                    onDone() {
                        debugger;
                    },
                    onData(d) {
                        debugger;
                    },
                    onError() {
                        debugger;
                    }
                },
          })
         * @param {string} [name] - The name of the hook [onStart, onData, onDone, onError]
         * @param {object} [output] - the data to send to the hook
         * @returns {undefined} no return value
         * @memberof WebpackNuget
         */

    }, {
        key: 'runHook',
        value: function runHook(name, output) {
            try {
                this.options.hooks[name](output);
            } catch (e) {
                // hook must not exist or arguments passed were wrong.
            }
        }

        /**
         * @function
         * @name restore
         * @description - Will get missing nuget packages, or skip them if they're already there.
            * @memberof WebpackNuget
            * @returns {undefined} - no return value
         */

    }, {
        key: 'restore',
        value: async function restore() {
            try {
                var output = await this.nuget();
                if (output.msg.trim()) this.log({
                    type: 'log',
                    options: this.options,
                    msg: output.msg
                });
                this.runHook('onDone', output);
            } catch (e) {
                // couldn't run nuget
                return this.error({
                    type: 'error',
                    msg: e,
                    options: this.options,
                    e: e
                });
            }
        }

        /**
         * @description Restoring Nuget packages for the microsoft platform.
         * @function
            * @memberof WebpackNuget
         * @name nuget
         * @description - We can restore our packages by using the nuget executable, we can
         * use execFile and pase it arguments as we need to.
         */

    }, {
        key: 'nuget',
        value: function nuget() {
            var _this2 = this;

            var output = {
                type: 'log',
                options: this.options,
                msg: 'Restoring Nuget packages.'
            };
            this.runHook('onStart', output);
            this.log(output);
            var cmdArgs = ["restore"],
                targetFile = this.options.nugetPath;
            if (this.options.additionalArgs && this.options.additionalArgs.length) cmdArgs = cmdArgs.concat(this.options.additionalArgs);
            if (this.options.monoPath && this.options.monoPath.length > 0) {
                targetFile = monoPath;
                cmdArgs.unshift(nugetPath);
            }
            cmdArgs.push(this.options.solutionPath);
            this.log({
                type: 'log',
                msg: 'Restoring with solution: ' + this.options.solutionPath
            });
            return new Promise(function (resolve, reject) {
                return (0, _child_process.execFile)(targetFile, cmdArgs, function (error, stdout, stderror) {
                    // only log this out if there's output in the stdout, but not error, error will log itself later
                    if (stderror.trim() && !error) reject({
                        type: 'error',
                        options: _this2.options,
                        error: error,
                        msg: 'Nuget standard error: ' + stderror
                    });
                    if (error) reject({
                        msg: error,
                        type: 'error',
                        options: _this2.options
                    });
                    if (resolve) resolve({
                        msg: stdout,
                        type: 'log',
                        options: _this2.options
                    });
                });
            });
        }
    }]);

    return Nuget;
}();

exports.default = Nuget;