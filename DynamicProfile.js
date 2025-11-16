const { USBController } = require("./USBController");




class DynamicProfile{
    USBController

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

        const instances = [...USBController.instances];

        if (instances.length > 0) {
            console.log("Using existing instance");
            this.usbController = instances[0];
        } else {
            console.log("Creating new instance");
            this.usbController = new USBController();
        }

        let bytes = {0:profileId}

        let header = this.usbController.constructHeader();

        let payload = this.usbController.constructPayload(bytes);
        this.usbController.send(header)
        
        setTimeout(() => {
            this.usbController.send(payload);
        }, 30);

    }
    
}

module.exports = {
  DynamicProfile
};


