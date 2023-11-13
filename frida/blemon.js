if (Java.available) {
    Java.perform(function () {
        var BTGattCB = Java.use("android.bluetooth.BluetoothGattCallback");
        // https://github.com/frida/frida/issues/310#issuecomment-462447292
        BTGattCB.$init.overload().implementation = function () {
            console.log("[+] BluetoothGattCallback constructor called from " + this.$className);
            const NewCB = Java.use(this.$className);
            NewCB.onCharacteristicRead.implementation = function (g, c, s) {
                const retVal = NewCB.onCharacteristicRead.call(this, g, c, s);
                var uuid = c.getUuid();
                console.log(Color.Blue + "[BLE Read   <=]" + Color.Light.Black + " UUID: " + uuid.toString() + Color.Reset + " data: 0x" + bytes2hex(c.getValue()));
                return retVal;
            };
            NewCB.onCharacteristicWrite.implementation = function (g, c, s) {
                const retVal = NewCB.onCharacteristicWrite.call(this, g, c, s);
                var uuid = c.getUuid();
                console.log(Color.Green + "[BLE Write  =>]" + Color.Light.Black + " UUID: " + uuid.toString() + Color.Reset + " data: 0x" + bytes2hex(c.getValue()));
                return retVal;
            };
            NewCB.onCharacteristicChanged.implementation = function (g, c) {
                const retVal = NewCB.onCharacteristicChanged.call(this, g, c);
                var uuid = c.getUuid();
                console.log(Color.Cyan + "[BLE Notify <=]" + Color.Light.Black + " UUID: " + uuid.toString() + Color.Reset + " data: 0x" + bytes2hex(c.getValue()));
                return retVal;
            };
            return this.$init();
        };

    }); // end perform
} else if (ObjC.available) {
    Interceptor.attach(ObjC.classes.CBPeripheral['- writeValue:forCharacteristic:type:'].implementation, {
        onEnter: function (args) {
            var data = new ObjC.Object(args[2]);
            var CBChar = new ObjC.Object(args[3]);
            var dataBytes = Memory.readByteArray(data.bytes(), data.length());
            var buf = new Uint8Array(dataBytes);
            var hexData = `length=${data.length()} bytes=0x${buf2hex(buf)}`;
            console.log(Color.Green + "[BLE Write  =>]" + Color.Light.Black + " UUID: " + CBChar.$ivars['_UUID'] + Color.Reset + " data: " + hexData);
        }
    }); //end Interceptor
	Interceptor.attach(ObjC.classes.CBCharacteristic['- setValue:'].implementation, {
		onEnter: function (args) {
			this.CBChar = new ObjC.Object(args[0]);
		},
		onLeave: function (retval) {
			let CBChar = this.CBChar;
            var data = CBChar.$ivars['_value']
            if (data != null) {
                var buf = data.bytes().readByteArray(data.length());
                data = `length=${data.length()} bytes=0x${buf2hex(buf)}`
            }
            if (CBChar.$ivars['_isNotifying'] === true) {
                console.log(Color.Cyan + "[BLE Notify <=]" + Color.Light.Black + " UUID: " + CBChar.$ivars['_UUID'] + Color.Reset + " data: " + data);
            }
            else {
                console.log(Color.Blue + "[BLE Read   <=]" + Color.Light.Black + " UUID: " + CBChar.$ivars['_UUID'] + Color.Reset + " data: " + data);
            }
        }
    }); //end Interceptor 
};
var Color = {
    Reset: "\x1b[39;49;00m",
    Black: "\x1b[30;01m", Blue: "\x1b[34;01m", Cyan: "\x1b[36;01m", Gray: "\x1b[37;11m",
    Green: "\x1b[32;01m", Purple: "\x1b[35;01m", Red: "\x1b[31;01m", Yellow: "\x1b[33;01m",
    Light: {
        Black: "\x1b[30;11m", Blue: "\x1b[34;11m", Cyan: "\x1b[36;11m", Gray: "\x1b[37;01m",
        Green: "\x1b[32;11m", Purple: "\x1b[35;11m", Red: "\x1b[31;11m", Yellow: "\x1b[33;11m"
    }
};
// thanks: https://awakened1712.github.io/hacking/hacking-frida/
function bytes2hex(array) {
    var result = '';
    for (var i = 0; i < array.length; ++i)
        result += ('0' + (array[i] & 0xFF).toString(16)).slice(-2);
    return result;
};
function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}
function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}