const { DynamicProfile } = require("../DynamicProfile");


let profileChanger = new DynamicProfile();
profileChanger.debugging = true;


let id = profileChanger.findIdFromProfileName("Test1")

profileChanger.constructAndSendProfileMessage(id)