/*！
 * @file pxt-eu-rate/main.ts
 * @brief EuRate microbit motors and sensors makecode library.
 *
 * @copyright	[EuRate](https://github.com/SimoneDavi55/pxt-eu-rate/blob/master/LICENSE), 2023
 * @copyright	MIT License
 *
 * @author [GitHub](https://github.com/SimoneDavi55)
 * @version  V0.0.1
 */
/**
 *EuRate Makecode extension
 */
//% weight=10 color=#DF6721 icon="\uf11b" block="Eu Rate library"
namespace eurate {

    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023


    const BYG_CHA_L = 3071
    const BYG_CHA_H = 1023

    const BYG_CHB_L = 1023
    const BYG_CHB_H = 3071

    const BYG_CHC_L = 4095
    const BYG_CHC_H = 2047

    const BYG_CHD_L = 2047
    const BYG_CHD_H = 4095

    /**
     * The user can choose the step motor model.
     */
    export enum Stepper {
        //% block="42"
        Ste1 = 1,
        //% block="28"
        Ste2 = 2
    }

    /**
     * The enum for boolean choices
     */
    export enum Choices {
        Yes = 1,
        No = -1
    }

    export enum PingUnit {
        //% block="μs"
        MicroSeconds,
        //% block="cm"
        Centimeters,
        //% block="inches"
        Inches
    }

    /**
     * The user can select the 8 steering gear controller.
     */
    export enum Servos {
        S1 = 0x08,
        S2 = 0x07,
        S3 = 0x06,
        S4 = 0x05,
        S5 = 0x04,
        S6 = 0x03,
        S7 = 0x02,
        S8 = 0x01
    }

    /**
     * The user selects the 4-way dc motor.
     */
    export enum Motors {
        M1 = 0x1,
        M2 = 0x2,
        M3 = 0x3,
        M4 = 0x4
    }

    /**
     * The user defines the motor rotation direction.
     */
    export enum Dir {
        //% blockId="CW" block="CW"
        CW = 1,
        //% blockId="CCW" block="CCW"
        CCW = -1,
    }

    /**
     * The user defines the straight line direction.
     */
    export enum TwoDDir {
        //% blockId="FW" block="FW"
        FW = 1,
        //% blockId="BW" block="BW"
        BW = -1,
    }

    export enum DirRot {
        //% blockId="Right" block="Right"
        Right = 1,
        //% blockId="Left" block="Left"
        Left = -1,
    }

    /**
     * The user can select a two-path stepper motor controller.
     */
    export enum Steppers {
        M1_M2 = 0x1,
        M3_M4 = 0x2
    }



    let initialized = false

    function i2cWrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cCmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cRead(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval;//Math.floor(prescaleval + 0.5);
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }


    function setStepper_28(index: number, dir: boolean): void {
        if (index == 1) {
            if (dir) {
                setPwm(4, STP_CHA_L, STP_CHA_H);
                setPwm(6, STP_CHB_L, STP_CHB_H);
                setPwm(5, STP_CHC_L, STP_CHC_H);
                setPwm(7, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(7, STP_CHA_L, STP_CHA_H);
                setPwm(5, STP_CHB_L, STP_CHB_H);
                setPwm(6, STP_CHC_L, STP_CHC_H);
                setPwm(4, STP_CHD_L, STP_CHD_H);
            }
        } else {
            if (dir) {
                setPwm(0, STP_CHA_L, STP_CHA_H);
                setPwm(2, STP_CHB_L, STP_CHB_H);
                setPwm(1, STP_CHC_L, STP_CHC_H);
                setPwm(3, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(3, STP_CHA_L, STP_CHA_H);
                setPwm(1, STP_CHB_L, STP_CHB_H);
                setPwm(2, STP_CHC_L, STP_CHC_H);
                setPwm(0, STP_CHD_L, STP_CHD_H);
            }
        }
    }


    function setStepper_42(index: number, dir: boolean): void {
        if (index == 1) {
            if (dir) {
                setPwm(7, BYG_CHA_L, BYG_CHA_H);
                setPwm(6, BYG_CHB_L, BYG_CHB_H);
                setPwm(5, BYG_CHC_L, BYG_CHC_H);
                setPwm(4, BYG_CHD_L, BYG_CHD_H);
            } else {
                setPwm(7, BYG_CHC_L, BYG_CHC_H);
                setPwm(6, BYG_CHD_L, BYG_CHD_H);
                setPwm(5, BYG_CHA_L, BYG_CHA_H);
                setPwm(4, BYG_CHB_L, BYG_CHB_H);
            }
        } else {
            if (dir) {
                setPwm(3, BYG_CHA_L, BYG_CHA_H);
                setPwm(2, BYG_CHB_L, BYG_CHB_H);
                setPwm(1, BYG_CHC_L, BYG_CHC_H);
                setPwm(0, BYG_CHD_L, BYG_CHD_H);
            } else {
                setPwm(3, BYG_CHC_L, BYG_CHC_H);
                setPwm(2, BYG_CHD_L, BYG_CHD_H);
                setPwm(1, BYG_CHA_L, BYG_CHA_H);
                setPwm(0, BYG_CHB_L, BYG_CHB_H);
            }
        }
    }

    /**
     * Steering gear control function.
     * S1~S8.
     * 0°~180°.
    */
    //% blockId=motor_servo block="Servo|%index|degree|%degree"
    //% weight=100
    //% degree.min=0 degree.max=180
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    export function servo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz
        let v_us = (degree * 1800 / 180 + 600) // 0.6ms ~ 2.4ms
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }

    /**
     * Execute a motor
     * M1~M4.
     * speed(0~255).
    */
    //% weight=90
    //% blockId=motor_MotorRun block="Motor|%index|dir|%Dir|speed|%speed"
    //% speed.min=0 speed.max=255
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function MotorRun(index: Motors, direction: Dir, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16 * direction; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 4 || index <= 0)
            return
        let pn = (4 - index) * 2
        let pp = (4 - index) * 2 + 1
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }

    /**
     * Execute a 42BYGH1861A-C step motor(Degree).
     * M1_M2/M3_M4.
    */
    //% weight=80
    //% blockId=motor_stepperDegree_42 block="Stepper 42|%index|dir|%direction|degree|%degree"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function stepperDegree_42(index: Steppers, direction: Dir, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // let Degree = Math.abs(degree);
        // Degree = Degree * direction;
        //setFreq(100);
        setStepper_42(index, direction > 0);
        if (degree == 0) {
            return;
        }
        let Degree = Math.abs(degree);
        basic.pause((50000 * Degree) / (360 * 100));  //100hz
        if (index == 1) {
            motorStop(1)
            motorStop(2)
        } else {
            motorStop(3)
            motorStop(4)
        }
        //setFreq(50);
    }

    /**
     * Execute a 42BYGH1861A-C step motor(Turn).
     * M1_M2/M3_M4.
    */
    //% weight=70
    //% blockId=motor_stepperTurn_42 block="Stepper 42|%index|dir|%direction|turn|%turn"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function stepperTurn_42(index: Steppers, direction: Dir, turn: number): void {
        if (turn == 0) {
            return;
        }
        let degree = turn * 360;
        stepperDegree_42(index, direction, degree);
    }

    /**
     * Execute a 28BYJ-48 step motor(Degree).
     * M1_M2/M3_M4.
    */
    //% weight=60
    //% blockId=motor_stepperDegree_28 block="Stepper 28|%index|dir|%direction|degree|%degree"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function stepperDegree_28(index: Steppers, direction: Dir, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        if (degree == 0) {
            return;
        }
        let Degree = Math.abs(degree);
        Degree = Degree * direction;
        //setFreq(100);
        setStepper_28(index, Degree > 0);
        Degree = Math.abs(Degree);
        basic.pause((1000 * Degree) / 360);
        if (index == 1) {
            motorStop(1)
            motorStop(2)
        } else {
            motorStop(3)
            motorStop(4)
        }
        //setFreq(50);
    }

    /**
     * Execute a 28BYJ-48 step motor(Turn).
     * M1_M2/M3_M4.
    */
    //% weight=50
    //% blockId=motor_stepperTurn_28 block="Stepper 28|%index|dir|%direction|turn|%turn"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    export function stepperTurn_28(index: Steppers, direction: Dir, turn: number): void {
        if (turn == 0) {
            return;
        }
        let degree = turn * 360;
        stepperDegree_28(index, direction, degree);
    }

    /**
     * Two parallel stepper motors are executed simultaneously(DegreeDual).
    */
    //% weight=40
    //% blockId=motor_stepperDegreeDual_42 block="Dual Stepper %stepper|M1_M2 dir %direction1|degree %degree1|M3_M4 dir %direction2|degree %degree2"
    //% stepper.fieldEditor="gridpicker" stepper.fieldOptions.columns=2
    //% direction1.fieldEditor="gridpicker" direction1.fieldOptions.columns=2
    //% direction2.fieldEditor="gridpicker" direction2.fieldOptions.columns=2
    export function stepperDegreeDual_42(stepper: Stepper, direction1: Dir, degree1: number, direction2: Dir, degree2: number): void {
        if (!initialized) {
            initPCA9685()
        }
        let timeout1 = 0;
        let timeout2 = 0;
        let Degree1 = Math.abs(degree1);
        let Degree2 = Math.abs(degree2);

        if (stepper == 1) {  // 42 stepper
            if (Degree1 == 0 && Degree2 == 0) {
                setStepper_42(0x01, direction1 > 0);
                setStepper_42(0x02, direction2 > 0);
            } else if ((Degree1 == 0) && (Degree2 > 0)) {
                timeout1 = (50000 * Degree2) / (360 * 100)
                setStepper_42(0x01, direction1 > 0);
                setStepper_42(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(3); motorStop(4);
            } else if ((Degree2 == 0) && (Degree1 > 0)) {
                timeout1 = (50000 * Degree1) / (360 * 100)
                setStepper_42(0x01, direction1 > 0);
                setStepper_42(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(1); motorStop(2);
            } else if ((Degree2 > Degree1)) {
                timeout1 = (50000 * Degree1) / (360 * 100)
                timeout2 = (50000 * (Degree2 - Degree1)) / (360 * 100)
                setStepper_42(0x01, direction1 > 0);
                setStepper_42(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(1); motorStop(2);
                basic.pause(timeout2);
                motorStop(3); motorStop(4);
            } else if ((Degree2 < Degree1)) {
                timeout1 = (50000 * Degree2) / (360 * 100)
                timeout2 = (50000 * (Degree1 - Degree2)) / (360 * 100)
                setStepper_42(0x01, direction1 > 0);
                setStepper_42(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(3); motorStop(4);
                basic.pause(timeout2);
                motorStop(1); motorStop(2);
            }
        } else if (stepper == 2) {
            if (Degree1 == 0 && Degree2 == 0) {
                setStepper_28(0x01, direction1 > 0);
                setStepper_28(0x02, direction2 > 0);
            } else if ((Degree1 == 0) && (Degree2 > 0)) {
                timeout1 = (50000 * Degree2) / (360 * 100)
                setStepper_28(0x01, direction1 > 0);
                setStepper_28(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(3); motorStop(4);
            } else if ((Degree2 == 0) && (Degree1 > 0)) {
                timeout1 = (50000 * Degree1) / (360 * 100)
                setStepper_28(0x01, direction1 > 0);
                setStepper_28(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(1); motorStop(2);
            } else if ((Degree2 > Degree1)) {
                timeout1 = (50000 * Degree1) / (360 * 100)
                timeout2 = (50000 * (Degree2 - Degree1)) / (360 * 100)
                setStepper_28(0x01, direction1 > 0);
                setStepper_28(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(1); motorStop(2);
                basic.pause(timeout2);
                motorStop(3); motorStop(4);
            } else if ((Degree2 < Degree1)) {
                timeout1 = (50000 * Degree2) / (360 * 100)
                timeout2 = (50000 * (Degree1 - Degree2)) / (360 * 100)
                setStepper_28(0x01, direction1 > 0);
                setStepper_28(0x02, direction2 > 0);
                basic.pause(timeout1);
                motorStop(3); motorStop(4);
                basic.pause(timeout2);
                motorStop(1); motorStop(2);
            }
        } else {
            //
        }
    }

    /**
     * Two parallel stepper motors are executed simultaneously(Turn).
    */
    //% weight=30
    //% blockId=motor_stepperTurnDual_42 block="Dual Stepper %stepper|M1_M2 dir %direction1|trun %trun1|M3_M4 dir %direction2|trun %trun2"
    //% stepper.fieldEditor="gridpicker" stepper.fieldOptions.columns=2
    //% direction1.fieldEditor="gridpicker" direction1.fieldOptions.columns=2
    //% direction2.fieldEditor="gridpicker" direction2.fieldOptions.columns=2
    export function stepperTurnDual_42(stepper: Stepper, direction1: Dir, trun1: number, direction2: Dir, trun2: number): void {
        if ((trun1 == 0) && (trun2 == 0)) {
            return;
        }
        let degree1 = trun1 * 360;
        let degree2 = trun2 * 360;

        if (stepper == 1) {
            stepperDegreeDual_42(stepper, direction1, degree1, direction2, degree2);
        } else if (stepper == 2) {
            stepperDegreeDual_42(stepper, direction1, degree1, direction2, degree2);
        } else {

        }

    }

    /**
     * Stop the dc motor.
    */
    //% weight=20
    //% blockId=motor_motorStop block="Motor stop|%index"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    export function motorStop(index: Motors) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }

    /**
     * Stop all motors
    */
    //% weight=100
    //% blockId=motor_motorStopAll block="Motor Stop All"
    export function motorStopAll(): void {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }


    /**
    * Start all motors
    * MotorRun(index: Motors, direction: Dir, speed: number):
    */
    //% weight=10
    //% blockId=motor_motorsStart block="Motors Start All|%Dir|%speed"
    export function MotorsStart(direction: Dir, speed: number): void {
        for (let idx = 1; idx <= 4; idx++) {
            MotorRun(idx, direction, speed);
        }
    }

    /**
    * Rotate Right
    * MotorRun(index: Motors, direction: Dir, speed: number):
    */
    //% weight=100
    //% blockId=motor_RobotRotateRight block="Robot Rotate Right|speed %speed"
    export function RotateRight(speed: number): void {
        motorStopAll();
        MotorRun(1, -1, speed); //Right Back
        MotorRun(2, 1, speed); //Left Back
        MotorRun(3, -1, speed); // Right Front
        MotorRun(4, 1, speed); // Left Front

    }

    /**
    * Rotate Left
    * MotorRun(index: Motors, direction: Dir, speed: number):
    */
    //% weight=100
    //% blockId=motor_RobotRotateLeft block="Robot Rotate Left|speed %speed"
    export function RotateLeft(speed: number): void {
        motorStopAll();
        MotorRun(1, 1, speed); //Right Back
        MotorRun(2, -1, speed); //Left Back
        MotorRun(3, 1, speed); // Right Front
        MotorRun(4, -1, speed); // Left Front
    }

    /**
    * Send a ping and get the echo time (in microseconds) as a result
    * @param trig tigger pin
    * @param echo echo pin
    * @param unit desired conversion unit
    * @param maxCmDistance maximum distance in centimeters (default is 500)
    */
    //% weight=1
    //% blockId=sonar_ping block="ping trig %trig|echo %echo|unit %unit"
    export function ping(trig: DigitalPin, echo: DigitalPin, unit: PingUnit, maxCmDistance = 500): number {
        // send pulse
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        switch (unit) {
            case PingUnit.Centimeters: return Math.idiv(d, 58);
            case PingUnit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
    }

    /**
    * Move the robot in a specified direction on a straigh line for a certain duration (in microseconds) with a defined speed
    * @param speed speed
    * @param direction direction 
    * @param duration duration in microseconds
    */
    //% weight=90
    //% blockId=motor_RobotMove block="Robot Move |speed (0-255) %speed|direction %Dir|duration ms %duration"
    export function Move(speed: number, direction: TwoDDir, duration: number, maxVelocity = 255, minVelocity = 1): void {
        motorStopAll();
        if (speed < minVelocity) { speed = minVelocity; } else if (speed > maxVelocity) { speed = maxVelocity; } //check boundries
        let d;
        if (direction === TwoDDir.FW) {
            d = Dir.CW;
        } else if (direction === TwoDDir.BW) {
            d = Dir.CCW;
        }

        MotorRun(1, d, speed); //Right Back
        MotorRun(2, d, speed); //Left Back
        MotorRun(3, d, speed); // Right Front
        MotorRun(4, d, speed); // Left Front
        basic.pause(duration);
        motorStopAll();
    }

    /**
    * Return the value of distance in cm
    * @param trigpin tigger pin
    * @param echopin echo pin
    */
    //% inlineInputMode=external
    //% weight=100
    //% blockId=us_sensor block="US Sensor |ping trig %trigpin|echo %echopin"
    export function UsSensor(trigpin: DigitalPin, echopin: DigitalPin): number {
        pins.digitalWritePin(trigpin, 0)
        control.waitMicros(2)
        pins.digitalWritePin(trigpin, 1)
        control.waitMicros(10)
        pins.digitalWritePin(trigpin, 0)
        return Math.idiv(pins.pulseIn(echopin, PulseValue.High), 58)
    }

    /**
    * Return true if the sensor detects something
    * @param pin the pin for the sensor
    */
    //% inlineInputMode=external
    //% weight=100
    //% blockId=ir_sensor_boolean block="IR Sensor |pin digital %pin"
    export function IrSensor(pin: DigitalPin) : boolean {
       let value = pins.digitalReadPin(pin)
       return value == 0;
    }

    /**
    * Return 1 or 0 if the sensor detects something
    * @param pin the pin for the sensor
    */
    //% inlineInputMode=external
    //% weight=95
    //% blockId=ir_sensor_dvalue block="IR Sensor Digital Value |pin %pin"
    export function IrSensorDigital(pin: DigitalPin): number {
        let value = pins.digitalReadPin(pin)
        return value;
    }

    interface InterfaceSensorRange {
        sensor: AnalogPin;
        threshold: number;
    }

    class ClassSensorRange implements InterfaceSensorRange {
        public sensor: AnalogPin = AnalogPin.P5;
        public threshold: number = 1;

        public build(sensorValue: AnalogPin, thresholdValue:number) {
            this.sensor = sensorValue;
            this.threshold = thresholdValue;
        }

        public findsSomethingInRange(registeredValue : number) : boolean{
            let rangeInScale = (registeredValue * 1023) / 30;
            let thresholdInScale = (this.threshold * 1023) / 30;
            if (rangeInScale<thresholdInScale)
                return true;
                else return false;
        }

        public get Sensor() {
            return this.sensor;
        }

        public get Threshold() {
            return this.threshold;
        }

        public set Sensor(value) {
            this.sensor = value;
        }

        public set Threshold(value) {
            this.threshold = value;
        }
    }

  
    /**
    * Set high the specified digital pin if the sensor finds something 
    * @param pinInput the pin for the sensor
    * @param pinOutput the pin for the sensor
    */
    //% inlineInputMode=external
    //% blockId=ir_sensor_trigger 
    //% block="IR Sensor trigger |pin sensor %pinInput|pin output %pinOutput"
    export function irSensorTrigger(pinInput: DigitalPin, pinOutput: DigitalPin) : void {
        if (eurate.IrSensor(pinInput)) {
            pins.digitalWritePin(pinOutput, 1);
        } else {
            pins.digitalWritePin(pinOutput, 0);
        }
    }

    /**
   * The robot moves forward until it encounters an wall in front and then turns in the direction with the most free space available 
   * @param trigpin the trig pin for the us sensor
   * @param echopin the echo pin for the us sensor
   * @param angle the range in degrees for the servo rotation to scan the are in front of the robot
   * @param speed the speed of the motors
   * @param distance the threshold distance with which the robot is meant to turn
   * @param servopin the pin of the servomotor
   * @param seconds the second for which the robot must turn
   * @param rangeLA the range of rotation of the servo motor when action "look around" is performed
   */
    //% inlineInputMode=external
    //% weight=100
    //% blockId= labyrinth_navigator_us
    //% block="Labyrinth navigator with US sensor|trigpin US %trigpin|echopin US %echopin|angle range front US %angle|motors speed  %speed|threshold in cm from US  %distance|pin servo %servopin|seconds to turn %seconds|degree range to look around %rangeLA"
    export function LavNabUS(trigpin: DigitalPin, echopin: DigitalPin, angle: number, speed: number, distance: number, servopin: Servos, seconds: number, rangeLA:number) : void {
        
        //motorStopAll();
        if (angle > 250) angle = 255;
        else if (angle < 0) angle = 0;

        if (angle > 180) angle = 180;
        else if (angle < 2) angle = 2;

        if (angle % 2 != 0) angle++;

        let max = 90 + angle/2;
        let min = 90 - angle/2;

        let index = min;
        if (index == min) {
            while (index < max) {
                eurate.servo(servopin, index)
                index++;
            }
        } else if (index == max) {
            while (index > min) {
                eurate.servo(servopin, index)
                index--;
            }
        }
        
        let us = eurate.UsSensor(
            trigpin,
            echopin
        )
        if (us <= distance) {
            motorStopAll();
            index=90;

            if (rangeLA>180) rangeLA = 180;
            else if (rangeLA<2) rangeLA = 2;

            if (rangeLA % 2 != 0) rangeLA++;
            
            lookAround(servopin, trigpin, echopin, speed, index, seconds, rangeLA)
        } else {
            Forward(speed);
        }
    }

    function Forward(speed: number): void {
        eurate.MotorRun(eurate.Motors.M1, eurate.Dir.CW, speed)
        eurate.MotorRun(eurate.Motors.M2, eurate.Dir.CW, speed)
        eurate.MotorRun(eurate.Motors.M3, eurate.Dir.CW, speed)
        eurate.MotorRun(eurate.Motors.M4, eurate.Dir.CW, speed)
    }

    function lookAround(servopin: Servos, 
                        trigpin: DigitalPin, 
                        echopin: DigitalPin, 
                        speed: number, 
                        index: number,
                        seconds:number,
                        rangeLA:number) : void{
        let left = lookLeft(servopin, trigpin, echopin, index, rangeLA);
        let right = lookRight(servopin, trigpin, echopin, index, rangeLA)

        if (left > right) {
            TurnLeftRobotForSeconds(speed, seconds)
        } else if (right > left) {
            TurnLeftRobotForSeconds(speed, seconds)
        } else if (right==left) {
            BackUp(speed, seconds);
        }
    }

    function BackUp(speed: number, seconds: number) : void {
        speed = speed/2
        eurate.MotorRun(eurate.Motors.M1, eurate.Dir.CCW, speed)
        eurate.MotorRun(eurate.Motors.M2, eurate.Dir.CCW, speed)
        eurate.MotorRun(eurate.Motors.M3, eurate.Dir.CCW, speed)
        eurate.MotorRun(eurate.Motors.M4, eurate.Dir.CCW, speed)
        basic.pause(seconds * 1000);
    }

    function TurnRightRobot(speed: number): void {
        eurate.MotorRun(eurate.Motors.M1, eurate.Dir.CCW, speed)
        eurate.MotorRun(eurate.Motors.M2, eurate.Dir.CW, speed)
        eurate.MotorRun(eurate.Motors.M3, eurate.Dir.CCW, speed)
        eurate.MotorRun(eurate.Motors.M4, eurate.Dir.CW, speed)
    }

    function TurnRightRobotForSeconds(speed: number, seconds: number): void {
        TurnRightRobot(speed)
        basic.pause(seconds * 1000);
    }

    function TurnLeftRobot(speed: number) : void {
        eurate.MotorRun(eurate.Motors.M1, eurate.Dir.CW, speed)
        eurate.MotorRun(eurate.Motors.M2, eurate.Dir.CCW, speed)
        eurate.MotorRun(eurate.Motors.M3, eurate.Dir.CW, speed)
        eurate.MotorRun(eurate.Motors.M4, eurate.Dir.CCW, speed)
    }

    function TurnLeftRobotForSeconds(speed: number, seconds: number): void {
        TurnLeftRobot(speed)
        basic.pause(seconds * 1000);
    }

    function lookLeft(servopin: Servos, trigpin: DigitalPin, echopin: DigitalPin, index: number, rangeLA:number) : number{
        let min = 90 - rangeLA;

        let mid = 90;

        let max = 90 + rangeLA;
        while (index > min) {
            eurate.servo(servopin, index)
            basic.pause(5)
            index--
        }
        let us = eurate.UsSensor(
            trigpin,
            echopin
        )
        //basic.showNumber(us)
        while (index < mid) {
            eurate.servo(servopin, index)
            basic.pause(5)
            index++
        }
        
        return us
    }

    function lookRight(servopin: Servos, trigpin: DigitalPin, echopin: DigitalPin, index: number, rangeLA: number): number {
        let min = 90 - rangeLA;

        let mid = 90;

        let max = 90 + rangeLA;
        while (index < max) {
            eurate.servo(servopin, index)
            basic.pause(5)
            index++
        } 
        let us = eurate.UsSensor(
            trigpin,
            echopin
        )
        //basic.showNumber(us)
        while (index > mid) {
            eurate.servo(servopin, index)
            basic.pause(5)
            index--
        } 
        return us
    }

    /**
    * Turn for a certainamount of seconds in a specified direction
    * @param speed the speed of the motors
    * @param seconds the specified time in seconds to do the action
    * @param direction the direction
    */
    //% inlineInputMode=external
    //% weight=90
    //% blockId= turn_robot
    //% block="Turn robot|motors speed  %speed|seconds %seconds|direction %direction"
    export function Turn(speed: number, seconds: number, direction: DirRot): void {
        if (direction == DirRot.Right) {
            TurnRightRobotForSeconds(speed, seconds)
        } else if (direction == DirRot.Left) {
            TurnLeftRobotForSeconds(speed, seconds)
        }
    }

    /**
    * Follows a line based on the results of the two ir sensors
    * @param pinleft the pin for the left sensor
    * @param pinright the pin for the right sensor
    * @param speed the speed for the motors
    * @param ms the number of milliseconds to wait after starting the motors
    */
    //% inlineInputMode=external
    //% weight=100
    //% blockId= line_follower
    //% block="Line follower with two ir sensors|left ir sensor  %pinleft|right ir sensor %pinright|speed  %speed|value of mS to move motors  %ms"
    export function LineFollower(pinleft: DigitalPin, pinright: DigitalPin, speed: number, ms:number): void {

        let right = eurate.IrSensor(pinright);
        let left = eurate.IrSensor(pinleft)

        if (left && right) {
            basic.showArrow(ArrowNames.North)
            Forward(speed)
            basic.pause(ms)
            motorStopAll()
        } else if (right && !left) {
            basic.showArrow(ArrowNames.East)
            TurnLeftRobot(speed)
            basic.pause(ms)
            motorStopAll()
        } else if (!right && left) {
            basic.showArrow(ArrowNames.West)
            TurnRightRobot(speed)
            basic.pause(ms)
            motorStopAll()
        } else if (!right && !left) {
            basic.showIcon(IconNames.No)
            motorStopAll();
        }
    }

    /**
    * Follows a line based on the results of three ir sensors
    * @param pinleft the pin for the left sensor
    * @param pinright the pin for the right sensor
    * @param pincenter the pin for the center sensor
    * @param speed the speed for the motors
    * @param ms the number of milliseconds to wait after starting the motors
    */
    //% inlineInputMode=external
    //% weight=70
    //% blockId= line_follower_three_s
    //% block="Line follower with three ir sensors|left ir sensor  %pinleft|right ir sensor %pinright|center ir sensor %pincenter|speed  %speed|value of mS to move motors  %ms"
    export function LineFollowerThreeSensors(pinleft: DigitalPin, pinright: DigitalPin, pincenter: DigitalPin, speed: number, ms: number): void {

        let leftV = eurate.IrSensor(pinleft);
        let centerV = eurate.IrSensor(pincenter);
        let rightV = eurate.IrSensor(pinright);

        if (leftV  && !centerV && rightV ) {
            Forward(speed);
            basic.pause(ms)
        } else if (!leftV  && !centerV && !rightV) {
            motorStopAll();
        } else if (leftV && centerV && rightV) {
            motorStopAll();
        } else if (!leftV && !centerV && rightV) {
            TurnLeftRobot(speed);
            basic.pause(ms)
        } else if (leftV && !centerV && !rightV) {
            TurnRightRobot(speed);
            basic.pause(ms)
        } else if (!leftV && centerV && rightV) {
            TurnLeftRobot(speed);
            basic.pause(ms)
        } else if (leftV && centerV && !rightV) {
            TurnRightRobot(speed);
            basic.pause(ms)
        }
    }
}
