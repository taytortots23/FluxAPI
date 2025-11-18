const { FileManager } = require("../Managers/FileManager");

const fileManager = new FileManager();

let number = fileManager.getApperanceNumberFromName("Pale Blue Dot");
fileManager.prepDataForExporting(number)

fileManager.exportApperanceToZip("Test.zip");