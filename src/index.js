
import {execFile} from'child_process';
import deep from 'deep-extend';
import path from 'path';


export default class Nuget {
	constructor(options) {
        // make sure were definitely an object
        options = options || {};
		const DEFAULTS = {
            // reference nuget
            nugetPath : path.resolve(__dirname, './nuget.exe'),
            // the solution path
            solutionPath : undefined,
            // can use mono if needed
            monoPath: null,
            // default arguments
            args : ['restore'],
            // can pass additional arguments to the nuget exe package
            additionalArgs: [],
            // custom callbacks to the output console
			outputConsole : {
				log : console.log,
				error: console.error
            },
            // custom hook to be able to run the restore at an alternate time instead of compile time
			runRestore(compiler, run) {
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
        };
        // if we need to know 
		this.hasCustomOutputLog = options.outputConsole && typeof options.outputConsole.log === 'function';
        this.hasCustomOutputError = options.outputConsole && typeof options.outputConsole.error === 'function';
		this.options = deep(DEFAULTS, options);
		if (!this.options.solutionPath) this.error({
			type : 'error',
			options: this.options,
			msg : `options.solutionPath must be specified.`
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
	error(data) {
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
	log(data) {
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
	apply(compiler) {		
		this.options.runRestore(compiler, () => {
			this.restore(this.options)			
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
    runHook(name, output) {
        try {
            this.options.hooks[name](output);
        } catch(e) {
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
	async restore() {        
        try {
            const output = await this.nuget();            
            if (output.msg.trim()) this.log({
                type : 'log',
                options: this.options,
                msg : output.msg
            });
            this.runHook('onDone', output);
        } catch(e) {            
            // couldn't run nuget
            return this.error({
                type : 'error',
                msg : e,
                options: this.options,
                e
            })
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


	nuget() {
        const output = {
            type : 'log',
            options: this.options,
            msg : `Restoring Nuget packages.`
        }
        this.runHook('onStart', output);
        this.log(output);
        if (!this.options.args || !this.options.args.length) this.error({
            type : 'error',
            msg : `options.args is a required argument and must contain at least one argument. Default should be ['restore']`
        })
		let cmdArgs = this.options.args,
			targetFile = this.options.nugetPath;
		if (this.options.additionalArgs && this.options.additionalArgs.length) cmdArgs = cmdArgs.concat(this.options.additionalArgs);
		if (this.options.monoPath && this.options.monoPath.length > 0) {
			targetFile = monoPath;
			cmdArgs.unshift(nugetPath);
		}
        cmdArgs.push(this.options.solutionPath);		
        this.log({
            type : 'log',
            msg : `Restoring with solution: ${this.options.solutionPath}`
        });
		return new Promise((resolve, reject) => {            
			return execFile(targetFile, cmdArgs, (error, stdout, stderror) => {
				// only log this out if there's output in the stdout, but not error, error will log itself later
				if (stderror.trim() && !error) reject({
					type : 'error',
					options: this.options,
					error,
					msg :`Nuget standard error: ${stderror}`
				});
				if (error) reject({
					msg: error, 
					type : 'error',
					options: this.options
				});
				if (resolve) resolve({
					msg: stdout, 
					type : 'log',
					options: this.options
				});
			});
		});
	};
}

