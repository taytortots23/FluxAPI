const { DynamicProfile } = require("../DynamicProfile");


let profileChanger = new DynamicProfile();
profileChanger.debugging = true;

profileChanger.constructAndSendProfileMessage(2)