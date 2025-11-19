const { USBManager } = require("./Managers/USBManager");




class DynamicProfile{
    USBManager

    debugging = false;


    //Todo: Add functionality for more than just windows
    findIdFromProfileName(name){
        let home = require("os").homedir();
        let fluxDirectory = home+"/Documents/flux"

        let profileJson = require(fluxDirectory+"/config/profiles.json")

        for(let profiles = 0; profiles < profileJson.customProfiles.length; profiles++){
            if(profileJson.customProfiles[profiles].name==name){
                return profiles+1;
            }
        }
        return -1;
    }

    constructAndSendProfileMessage(profileId){
        if(typeof(profileId)!="number") throw "Profile ID must be a number";

        const instances = [...USBManager.instances];

        if (instances.length > 0) {
            console.log("Using existing instance");
            this.usbManager = instances[0];
        } else {
            console.log("Creating new instance");
            this.usbManager = new USBManager();
        }

        let bytes = {0:profileId}

        let header = this.usbManager.constructHeader(0x6a);

        let payload = this.usbManager.constructPayload(bytes);
        this.usbManager.send(header)
        
        setTimeout(() => {
            this.usbManager.send(payload);
        }, 30);

    }
    
}

module.exports = {
  DynamicProfile
};


