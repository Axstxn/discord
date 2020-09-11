const Command = require('./Command'),
prefix = '.',
Channel = require('./Channel');
const didYouMean = require('didyoumean2').default;

module.exports = class CommandHandler {
	constructor(Plugger){
		this.DiscordManager = Plugger;
		/*this.commands = [{ command: 'test', name: 'test', description: 'abc123', run(msgData, cleaned){
			msgData.content = `||${cleaned.split('').join('||||')}||`;
		}}];*/
		this.activeCommands = [];
		this.commands = new Map();
		this.regex = new RegExp(`^(${this.activeCommands.map(cmd => cmd.name).join('|')})\\s(.+)`, 'i');
		const helpCmd = new Command;
		helpCmd.setName('help')
			.setDescription('Displays help')
			.setExec(function(msgData, channel, content){
				channel.send(`This is a test message\n**The date is:** ${(new Date).toDateString()}\n**The time is:** ${(new Date).toTimeString()}`);
				return {};
			});
		this.addCommand(helpCmd);
		this._parse;
	}
	handleParser(parser){
		const me = this;
		this._parse = parser.parse;
		window.parser = parser;
		parser.parse = function(channel, content, n, isSend) {
			let msgData = me._parse(channel, content, n, isSend);
			if (isSend !== void 0 || !msgData.content?.trim()?.startsWith(prefix)) return msgData;
			let msg = msgData.content,
				args = msg.trim().substr(prefix.length).split(/\s+/g),
				cmd = args.shift().toLowerCase(),
				cleaned = msg.trim().split(/ /g);
			cleaned.shift();
			cleaned = cleaned.join(' ');
			let x = me.activeCommands.filter(({name}) => name == cmd);
			if (!x.length) return msgData;
			channel = new Channel(me.DiscordManager, channel);
			return x[0].run(msgData, channel, cleaned);
		}
	}
	_handleAutoComplete(auto){
		let ogCompleteOptions = auto.prototype.getAutocompletePrefix,
			me = this;
		window.auto = auto;
		auto.prototype.getAutocompletePrefix = function(a,b,c,d,e,f){
			!this.state.autocompleteOptions.USERCMD && me.addCmdLoader(this);
			let x = ogCompleteOptions.call(this, ...arguments);
			return x
		};
	}
	addCmdLoader(obj){
		let options = obj.state.autocompleteOptions;
		let UserCommands = Object.assign({}, options.COMMAND);
		UserCommands.matches = (prefix, command, n) => {
			return n && ('.' === prefix || null != command.match(this.regex))
		};
		UserCommands.getPlainText = (name, data) => {
			let commands = data.commands,
			integrations = data.integrations;
			return null != commands?.[name] ? '.' + commands[name].command : null != integrations?.[name] ? integrations[name].meta.url : '';
		};
		UserCommands.onSelect = (content, t, data) => {
			let commands = data.commands,
				integrations = data.integrations;
			if (null == commands && null != integrations) {
				let isValidCommand = content.match(this.regex);
				if (null == isValidCommand) return;
			}
		}
		UserCommands.queryResults = content => {
			let P = this.activeCommands;
			function toArray(arr, length) {
				(null == length || length > arr.length) && (length = arr.length);
				for (var index = 0, copied = new Array(length); index < length; index++) copied[index] = arr[index];
				return copied
			}
			var escapedCommand = new RegExp(`^${this.escape(content)}`, "i"),
				matchingCommands = [],
				simular = [];
			(0, this.DiscordManager.react)(P/*Commands array please set this*/).forEach((function (elem) {
				(null == elem.predicate || elem.predicate(e)) && (escapedCommand.test(elem.command) ? matchingCommands.push(elem) : (didYouMean)(content, elem.command.toLowerCase()) && simular.push(elem))
			}));
			var queryResults = [],
				c = function (e) {//6756
					for (var iterator, n = function (cmd) {
							var t = 0;
							if ("undefined" == typeof Symbol || null == cmd[Symbol.iterator]) {
								if (Array.isArray(cmd) || (cmd = function (inputCmd, arrLen) {
										if (!inputCmd) return;
										if ("string" == typeof inputCmd) return toArray(inputCmd, arrLen);
										var objType = Object.prototype.toString.call(inputCmd).slice(8, -1);
										"Object" === objType && inputCmd.constructor && (objType = inputCmd.constructor.name);
										if ("Map" === objType || "Set" === objType) return Array.from(objType);
										if ("Arguments" === objType || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(objType)) return toArray(inputCmd, arrLen)
									}(cmd))) return function () {
									return t >= cmd.length ? {
										done: !0
									} : {
										done: !1,
										value: cmd[t++]
									}
								};
								throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
							}
							return (t = cmd[Symbol.iterator]()).next.bind(t)
						}(e); !(iterator = n()).done;) {
						var r = iterator.value;
						if (!(queryResults.length < /*S.MAX_AUTOCOMPLETE_RESULTS*/10)) break;
						queryResults.push(r);
					}
				};
			return c(matchingCommands), c(simular), {
				commands: queryResults
			}
		}
		options.USERCMD = UserCommands;
		window.opts = options;
	}
	//commands = [];
	//regex = /^(test)\s(.+)/;
	addCommand(command){
		if(!command.name || !(command instanceof Command)) return !1;
		this.commands.set(command.name, command);
		this.regex = new RegExp(`^(${[...this.commands.keys()].join('|')})\\s(.+)`, 'i');
		this.activeCommands = [...this.commands.values()];
		return !0;
	}
}
