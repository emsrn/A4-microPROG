//% weight=100 color=#0fbc11 icon="\uf085" block="A4 microPROG"
namespace a4_microPROG{

    const I2C_ADDR = 0x33

    let initialized = false
    let lastDirection = [0, 0, 0, 0]
    let globalBrightness = 255

    function init() {
        if (!initialized) {
            initialized = true
            basic.pause(100)
        }
    }

    function writeReg(reg: number, data: Buffer) {
        let buf = pins.createBuffer(data.length + 1)
        buf[0] = reg
        for (let i = 0; i < data.length; i++) {
            buf[i + 1] = data[i]
        }
        pins.i2cWriteBuffer(I2C_ADDR, buf)
    }

    function readReg(reg: number, len: number): Buffer {
        pins.i2cWriteNumber(I2C_ADDR, reg, NumberFormat.UInt8BE)
        return pins.i2cReadBuffer(I2C_ADDR, len)
    }

    // =========================
    // SYSTEM
    // =========================

    /**
     * Return battery level in percentage
     */
    //% block="battery level (\\%)"
    //% group="System"
    export function getBattery(): number {
        init()
        return readReg(0x87, 1)[0]
    }

    // =========================
    // MOTORS
    // =========================

    /**
     * Sets motor's direction and speed
     * @param motor motor chosen eg: M1
     * @param dir motor's direction eg: clockwise 
     * @param speed motor's speed in % eg: 50
     */
    //% block="run %motor direction %dir speed %speed \\%"
    //% motor.defl="M1"
    //% dir.defl="clockwise"
    //% speed.defl="50"
    //% speed.min=0 speed.max=100
    //% group="Motors"
    export function motorRun(motor: MotorID, dir: MotorDirection, speed: number) {

        init()

        speed = Math.clamp(0, 100, speed)
        let duty = Math.map(speed, 0, 100, 0, 4095)

        let base = 0x04 + motor * 4

        // stop avant inversion
        if (lastDirection[motor] != dir) {
            writeReg(base, pins.createBuffer(2))
            writeReg(base + 2, pins.createBuffer(2))
            basic.pause(50)
        }

        let buf = pins.createBuffer(2)
        buf[0] = (duty >> 8) & 0xFF
        buf[1] = duty & 0xFF

        if (dir == MotorDirection.CW) {
            writeReg(base, buf)
            writeReg(base + 2, pins.createBuffer(2))
        } else {
            writeReg(base + 2, buf)
            writeReg(base, pins.createBuffer(2))
        }

        lastDirection[motor] = dir
    }

    /**
     * Stops motor chosen
     * @param motor motor chosen eg: M1
     */
    //% block="stop %motor"
    //% group="Motors"
    export function motorStop(motor: MotorID) {
        init()
        let base = 0x04 + motor * 4
        writeReg(base, pins.createBuffer(2))
        writeReg(base + 2, pins.createBuffer(2))
    }

    /**
     * Stops all motors 
     */
    //% block="stop all motors"
    //% group="Motors"
    export function stopAllMotors() {
        init()
        for (let i = 0; i < 4; i++) {
            motorStop(i)
        }
    }

    // =========================
    // SERVOS
    // =========================

    /**
     * Sets servo angle 
     * @param servo servo chosen 
     * @param angle angle in degrees between 0 and 180 
     */
    //% block="set servo %s angle %angle"
    //% angle.min=0 angle.max=180
    //% group="Servos"
    export function setServoAngle(s: Servo, angle: number) {
        init()

        angle = Math.clamp(0, 180, angle)
        let period = 500 + angle * 11

        let buf = pins.createBuffer(2)
        buf[0] = (period >> 8) & 0xFF
        buf[1] = period & 0xFF

        writeReg(0x18 + s * 2, buf)
    }

    // =========================
    // RGB LED
    // =========================

    let rgb0R = 0
    let rgb0G = 0
    let rgb0B = 0
    let rgb1R = 0
    let rgb1G = 0
    let rgb1B = 0

    function writeRgbValues(r0: number, g0: number, b0: number, r1: number, g1: number, b1: number) {
        init()

        rgb0R = Math.clamp(0, 255, r0)
        rgb0G = Math.clamp(0, 255, g0)
        rgb0B = Math.clamp(0, 255, b0)

        rgb1R = Math.clamp(0, 255, r1)
        rgb1G = Math.clamp(0, 255, g1)
        rgb1B = Math.clamp(0, 255, b1)

        let buf = pins.createBuffer(8)

        buf[0] = 1
        buf[1] = globalBrightness

        buf[2] = rgb0R
        buf[3] = rgb0G
        buf[4] = rgb0B

        buf[5] = rgb1R
        buf[6] = rgb1G
        buf[7] = rgb1B

        writeReg(0x90, buf)
    }

    function colorToRgb(color: RGBColor): number[] {
        switch (color) {
            case RGBColor.Red: return [255, 0, 0]
            case RGBColor.Green: return [0, 255, 0]
            case RGBColor.Blue: return [0, 0, 255]
            case RGBColor.Yellow: return [255, 255, 0]
            case RGBColor.Cyan: return [0, 255, 255]
            case RGBColor.Magenta: return [255, 0, 255]
            case RGBColor.White: return [255, 255, 255]
            case RGBColor.Off:
            default: return [0, 0, 0]
        }
    }

    /**
     * Sets LEDs 0 and 1 color 
     * @param color0 led 0 color 
     * @param color1 led 1 color 
     */
    //% block="set RGB0 to %color0 and RGB1 to %color1"
    //% inlineInputMode=inline
    //% group="RGB"
    export function setDualRGBColors(color0: RGBColor, color1: RGBColor) {
        let c0 = colorToRgb(color0)
        let c1 = colorToRgb(color1)
        writeRgbValues(c0[0], c0[1], c0[2], c1[0], c1[1], c1[2])
    }

    /**
     * Sets LEDs 0 and 1 color by setting RGB values 
     * @param r0 red channel for led RGB0
     * @param g0 green channel for led RGB0
     * @param b0 blue channel for led RGB0
     * @param r1 red channel for led RGB1
     * @param g1 green channel for led RGB1
     * @param b1 blue channel for led RGB1
     */
    //% block="set RGB0 to R %r0 G %g0 B %b0 and RGB1 to R %r1 G %g1 B %b1"
    //% r0.min=0 r0.max=255
    //% g0.min=0 g0.max=255
    //% b0.min=0 b0.max=255
    //% r1.min=0 r1.max=255
    //% g1.min=0 g1.max=255
    //% b1.min=0 b1.max=255
    //% inlineInputMode=inline
    //% group="RGB"
    export function setDualRGB(r0: number, g0: number, b0: number, r1: number, g1: number, b1: number) {
        writeRgbValues(r0, g0, b0, r1, g1, b1)
    }

    /**
     * Sets LEDs brightness between 0 and 255 
     * @param b value between 0 and 255
     */
    //% block="set RGB brightness %b"
    //% b.min=0 b.max=255
    //% group="RGB"
    export function setBrightness(b: number) {
        globalBrightness = Math.clamp(0, 255, b)
        writeRgbValues(rgb0R, rgb0G, rgb0B, rgb1R, rgb1G, rgb1B)
    }


    /**
     * Turns off all LEDs 
     */
    //% block="turn off RGB"
    //% group="RGB"
    export function clearRGB() {
        writeRgbValues(0, 0, 0, 0, 0, 0)
    }
    // =========================
    // GPIO (AUTO CONFIG)
    // =========================

    function setAnalogInput(io: IO) {
        writeReg(0x2c + io, pins.createBufferFromArray([2]))
    }

    /**
     * Sets a pin or connector value to either 1 or 0 
     * @param io pin 
     * @param state value eg: 1
     */
    //% block="digital write %io to %state"
    //% group="GPIO"
    export function digitalWrite(io: IO, state: GPIOState) {
        init()
        setDigitalOutput(io)
        writeReg(0x39 + io, pins.createBufferFromArray([state]))
    }

    /**
     * Read the specified pin or connector as either 1 or 0
     * @param io pin
     */
    //% block="read digital %io"
    //% group="GPIO"
    export function readDigital(io: IO): number {

        init()

        setDigitalInput(io)
        basic.pause(10)

        return readReg(0x3f + io, 1)[0]
    }

    /**
     * Read the connector value as analog (between 0 and 1023)
     * @param io pin
     */
    //% block="analog read %io"
    //% group="GPIO"
    export function analogRead(io: IO): number {
        init()

        setAnalogInput(io)

        let buf = readReg(0x45 + io * 3, 3)
        return (buf[1] << 8) | buf[2]
    }

    function setDigitalOutput(io: IO) {
        writeReg(0x2c + io, pins.createBufferFromArray([4]))
    }

    function setDigitalInput(io: IO) {
        writeReg(0x2c + io, pins.createBufferFromArray([5]))
    }

    // =========================
    // SENSOR
    // =========================

    /**
     * Returns distance between an object and the sensor 
     */
    //% block="distance (cm)"
    //% group="Sensors"
    export function distance(): number {

        init()

        writeReg(0x29, pins.createBufferFromArray([1]))
        basic.pause(30)

        let res = readReg(0x29, 3)

        if (res[0] == 2) {
            return (res[1] << 8) | res[2]
        }

        return -1
    }

    // =========================
    // INFRARED IR
    // =========================

    const I2C_IR_TX_STATE = 0x24
    const I2C_IR_RX_STATE = 0x88
    const DATA_ENABLE = 0x01
    const DATA_DISABLE = 0x00

    function clampUInt32(value: number): number {
        value = Math.round(value)

        if (value < 0) {
            return 0
        }

        if (value > 0xFFFFFFFF) {
            return 0xFFFFFFFF
        }

        return value
    }

    function getByte(value: number, divisor: number): number {
        return Math.floor(value / divisor) % 256
    }

    /**
     * Sends a 32-bit infrared code using the onboard IR transmitter.
     * @param data 32-bit IR code to send
     */
    //% block="send IR code %data"
    //% data.defl=0x00FF00FF
    //% group="Infrared"
    export function sendIR(data: number) {
        init()

        data = clampUInt32(data)

        let buf = pins.createBuffer(5)
        buf[0] = DATA_ENABLE
        buf[1] = getByte(data, 0x1000000)
        buf[2] = getByte(data, 0x10000)
        buf[3] = getByte(data, 0x100)
        buf[4] = getByte(data, 0x1)

        writeReg(I2C_IR_TX_STATE, buf)
        basic.pause(20)
    }

    /**
     * Reads the last received 32-bit infrared code.
     * Returns 0 when no IR data is available.
     */
    //% block="read IR code"
    //% group="Infrared"
    export function readIR(): number {
        init()

        let buf = readReg(I2C_IR_RX_STATE, 5)

        if (buf[0] == DATA_DISABLE) {
            return 0
        }

        return buf[1] * 0x1000000 + buf[2] * 0x10000 + buf[3] * 0x100 + buf[4]
    }

    /**
     * Returns true when an infrared code has been received.
     */
    //% block="IR code received"
    //% group="Infrared"
    export function irReceived(): boolean {
        return readIR() != 0
    }
}
