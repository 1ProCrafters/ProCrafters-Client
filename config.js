const fs = require("fs");
const Utils = require("./utils");

class Config {

	static data = {
		maxMemory: 2048,
		optifine: Utils.getOsName() != "osx",
		minecraftFolder: "<use default>",
		autoUpdate: true
	};
	static file;

	static init(base) {
		Config.file = base + "/config.json";
	}

	static load() {
		if(fs.existsSync(Config.file)) {
			Config.data = JSON.parse(fs.readFileSync(Config.file, "UTF-8"));
			if(!Config.data.minecraftFolder) {
				Config.data.minecraftFolder = "<use default>";
			}
			if(Config.data.autoUpdate == undefined) {
				Config.data.autoUpdate = true;
			}
		}
	}

	static save() {
		fs.writeFileSync(Config.file, JSON.stringify(Config.data));
	}

	static getGameDirectory(defaultDirectory) {
		if(Config.data.minecraftFolder != "<use default>") {
			return Config.data.minecraftFolder;
		}

		return defaultDirectory;
	}

}

module.exports = Config;
