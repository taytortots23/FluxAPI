const usb = require("usb");

class USBController{
    
    static instances = new Set();

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
        USBController.instances.add(this);
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

    destroy() {
        MyClass.instances.delete(this);
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

    constructHeader(){
        this.header = Buffer.alloc(64);

        this.header[0] = 0x6A;
        this.header[1] = 0x01;
        this.header[5] = 0x04;

        return this.header;
    }

    constructPayload(byteInputs){
        this.payload = Buffer.alloc(64);
        let byteLocations = Object.keys(byteInputs);

        for(let bytes = 0; bytes<byteLocations.length; bytes++){
            this.payload[byteLocations[bytes]]=byteInputs[byteLocations[bytes]];
        }
        return this.payload

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
  USBController
};