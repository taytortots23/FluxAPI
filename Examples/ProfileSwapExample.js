const { DynamicProfile } = require("../DynamicProfile");


let profileChanger = new DynamicProfile();

profileChanger.connectToKeyboard();

profileChanger.constructAndSendProfileMessage(2)