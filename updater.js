const axios = require("axios").default;
const Utils = require("./utils");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { app, BrowserWindow, ipcMain } = require("electron");

class Updater {

	static update() {
		return new Promise(async(resolve) => {
			try {
				var fileExtension;
				var destFile;
				var currentVersion = require("./package.json").version;
				var appimage = process.env.APPIMAGE;

				if(Utils.getOsName() == "windows") {
					fileExtension = ".exe";
					destFile = Utils.dataDirectory + "/Setup" + fileExtension;
					try {
						if(fs.existsSync(destFile)) {
							fs.rmSync(destFile);
						}
					}
					catch(error) {
						// oh well
						console.log(error);
						resolve(false);
						return;
					}
				}
				else if(Utils.getOsName() == "linux" && appimage) {
					fileExtension = ".AppImage";
					destFile = appimage + ".new";
				}

				if(require("electron-is-dev") || !fileExtension) {
					resolve(false);
					return;
				}

				console.log("Checking for update...");

				var latestRelease = (await axios.get("https://api.github.com/repos/1ProCrafters/ProCrafters-Client/releases/latest")).data;

				if(latestRelease.name == currentVersion) {
					console.log("No updates found");
					resolve(false);
					return;
				}

				var selectedAsset;
				for(var asset of latestRelease.assets) {
					if(asset.name.endsWith(fileExtension)) {
						selectedAsset = asset;
					}
				}

				if(!selectedAsset) {
					resolve(false);
					return;
				}

				console.log("Installing update...");

				await app.whenReady();
				app.on("window-all-closed", (event) => event.preventDefault());

				var window = new BrowserWindow({
					width: 600,
					height: 210,
					icon: __dirname + "/assets/icon.png",
					webPreferences: {
						preload: path.join(__dirname, "/updater-dom.js")
					},
					title: "Updating ProCrafters Client...",
					show: false,
					backgroundColor: "#1e1e1e",
					resizable: false
				});

				window.loadFile("updating.html");
				window.setMenu(null);
				window.show();

				var wasClosed = false;

				window.on("close", () => {
					if(!wasClosed) {
						wasClosed = true;
						resolve(false);
					}
				});

				await Utils.download(selectedAsset.browser_download_url, destFile, -1, (progress) => {
					if(wasClosed) {
						return false;
					}
					window.webContents.send("progress", progress + "%");
					return true;
				});

				wasClosed = true;
				window.close();

				await sleep(1000);

				var command = destFile;

				if(Utils.getOsName() == "linux") {
					fs.renameSync(destFile, appimage);
					fs.chmodSync(appimage, 0o755);
					if(path.basename(appimage).includes(currentVersion)) {
						var newName = path.join(path.dirname(appimage),
								path.basename(appimage).replace(currentVersion, latestRelease.name));
						fs.renameSync(appimage, newName);
						appimage = newName;
					}
					command = appimage;
				}

				if(Utils.getOsName() == "windows") {
					childProcess.execFileSync(command);
				}
				else {
					childProcess.spawn(command);
				}
				resolve(true);
				app.quit();
			}
			catch(error) {
				console.error(error);
				resolve(false);
			}
		});
	}
}

module.exports = Updater;
