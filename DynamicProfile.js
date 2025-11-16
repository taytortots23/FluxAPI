const usb = require("usb");


class DynamicProfile{

    VENDOR = 0x3761;
    PRODUCT = 0x4015;

    dev = usb.findByIds(this.VENDOR, this.PRODUCT);
    epIn;
    epOut;

    iface;

    header;
    payload;

    debugging = false;

    constructor(){
        this.connectToKeyboard();

        process.stdin.resume();
        process.on("SIGINT",(code)=>{
            console.log("Program eneded, closing connection")
            try {
                // Stop the IN endpoint polling
                this.epIn.stopPoll(() => {
                    console.log("Stopped IN endpoint polling");

                    // Release the interface
                    this.iface.release(true, (err) => {
                        if (err) console.error("Error releasing interface:", err);

                        // Close the device safely
                        this.dev.close();
                        console.log("Device closed");
                        process.exit(0);
                    });
                });
            } catch (e) {
                console.error("Error closing device:", e);
                process.exit(1);
            }
            process.exit(0);
        })
    }

    connectToKeyboard(){
        if (!this.dev) throw new Error("Device not found");
        this.dev.open();

        // Interface 1 = vendor interface (bulk in/out)
        this.iface = this.dev.interfaces[1];

        try { iface.detachKernelDriver(); } catch {}
        this.iface.claim();

        this.epOut = this.iface.endpoints.find(ep => ep.direction === "out");
        this.epIn  = this.iface.endpoints.find(ep => ep.direction === "in");

        // Start listening
        this.epIn.startPoll(1, 64);
        this.epIn.on("data", (data) => {
           if(this.debugging) console.log("IN:", Buffer.from(data));
        });
        this.epIn.on("error", (e) => console.error("IN ERR:", e));
    }

    constructAndSendProfileMessage(profileId){
        if(typeof(profileId)!="number") throw "Profile ID must be a number";

        this.header = Buffer.alloc(64);
        this.payload = Buffer.alloc(64);

        this.header[0] = 0x6A;
        this.header[1] = 0x01;
        this.header[5] = 0x04;

        this.payload[0] = profileId;
        this.send(this.header)
        
        setTimeout(() => {
            this.send(this.payload);
        }, 30);

    }
    

    send(buf) {
        this.epOut.transfer(buf, (err) => {
            //errno:4 is stall, ie nothing to send. Not actual error
            if (err&&err.errno!=4) console.error("OUT ERR:", err);
            else console.log("Sent profile change");
            if(this.debugging) console.log("OUT sent:", buf);
        });
}

}

module.exports = {
  DynamicProfile
};


