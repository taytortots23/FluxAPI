class FileManager{
    static instances = new Set();

    fluxDirectory;
    apperance;
    media;

    exportMedia;
    exportApperance;

    path = require('path');
    fs = require('fs');
    
    archiver = require('archiver');
    unzipper = require('unzipper')





    constructor(){
        if(FileManager.instances.length!=undefined) throw "FileManager already exists, please use existing instance"
        FileManager.instances.add(this);

        switch (process.platform) {
            case "win32":
                let home = require("os").homedir();
                this.fluxDirectory = home+"/Documents/flux"
                break;
        
            default:
                throw "Unable to detect operating system, please contact developer"
        }

        this.apperance = require(this.fluxDirectory+"/config/appearance.json")
        this.media = require(this.fluxDirectory+"/config/media.json")
        // console.log(this.apperance)
    }


    getApperanceNumberFromName(name){
        let customThemes = this.apperance.customThemes;

        for(let theme = 0; theme < customThemes.length; theme++){
            if(customThemes[theme].name == name){
                return theme;
            }
        }
        return null;
    }

    makeDirectory(pathToCreate){
        this.fs.mkdirSync(pathToCreate, { recursive: true });
    }

    deleteDirectory(pathToDestroy){
        this.fs.rmSync(pathToDestroy, { recursive: true })
    }

    prepDataForExporting(apperanceNumber){
        this.exportApperance = this.apperance.customThemes[apperanceNumber]
        

        const dir = this.path.join("./ExportedTheme", this.exportApperance.name);
        this.makeDirectory(dir)

        for(let y = 0; y<this.media.files.length; y++){
            if(this.exportApperance.backgroundImagePath == this.media.files[y].name){
                this.exportMedia = this.media.files[y]
            }
        }

        const imgSrc = this.path.join(this.fluxDirectory,"config", "media", this.exportApperance.backgroundImagePath);
        const imgDest = this.path.join("./ExportedTheme", this.exportApperance.name, this.exportApperance.backgroundImagePath);

        this.fs.copyFileSync(imgSrc, imgDest);


        let exportPath = this.path.join("./ExportedTheme", this.exportApperance.name, "export.json");
        let mediaPath = this.path.join("./ExportedTheme", this.exportApperance.name, "mediaExport.json");

        this.fs.writeFileSync(exportPath, JSON.stringify(this.exportApperance, null, 2), "utf8");
        this.fs.writeFileSync(mediaPath, JSON.stringify(this.exportMedia, null, 2), "utf8");
    }

    exportApperanceToZip(zipPath){
        const toZip = this.path.join("./ExportedTheme", this.exportApperance.name)
        const output = this.fs.createWriteStream(zipPath);

        const archive = this.archiver('zip', { zlib: { level: 9 } }); // level 9 = max compression

        output.on('close', () => {

        });
        archive.on('error', (err) => {
        throw err;
        });

        archive.pipe(output);

        archive.directory(toZip, false);

        archive.finalize();

        //Wait for zipping to finalize, then cleanup created data
        setTimeout(() => {
        this.deleteDirectory(toZip)
            
        }, 300);
    }

    importApperanceFromZip(importPath){
        const {name, ext } = this.path.parse(importPath);

        if (ext.toLowerCase() !== '.zip') throw "Must be a zip file";

        let zipPath = this.path.resolve(importPath)
        const extractPath = this.path.resolve('./ImportedTheme', name);


        this.fs.createReadStream(zipPath)
        .pipe(this.unzipper.Extract({ path: extractPath }))
        .on('close', () => {

            let jsonPath = this.path.join(extractPath,"export.json")
            let newJson = require(jsonPath);
            let mediaJson = require(this.path.join(extractPath,"mediaExport.json"))

            newJson.id = this.apperance.nextCustomThemeId;
            this.apperance.nextCustomThemeId++;
            this.apperance.customThemes.push(newJson)
            this.media.files.push(mediaJson);

            this.fs.writeFileSync(this.fluxDirectory+"/config/appearance.json", JSON.stringify(this.apperance, null, 2), "utf8");
            this.fs.writeFileSync(this.fluxDirectory+"/config/media.json", JSON.stringify(this.media, null, 2), "utf8");
            const dest1 = this.path.join(this.fluxDirectory,"config", "media","thumbnails", newJson.backgroundImagePath);
            const dest = this.path.join(this.fluxDirectory,"config", "media", newJson.backgroundImagePath);
            const src = this.path.join(extractPath,newJson.backgroundImagePath);
            
            this.fs.copyFileSync(src, dest);
            this.fs.copyFileSync(src, dest1);

            this.deleteDirectory(extractPath)


        })
        .on('error', (err) => {

        });
    }


}

module.exports = {
    FileManager
}