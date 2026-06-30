## A4 Gate 

MakeCode extension for the **A4 programming station** based on the **DFR1216 expansion board**, **BBC micro:bit**, and **Gravity LCD display**. 

## Product page and teaching resources 

Product information and educational resources are available on https://www.a4.fr/wiki/index.php?title=Portail_coulissant_(BE-APORT-COUL) 

Website: a4.fr

Product sheet: 

## Purpose 

This extension is designed for an educational programming station used in technology lessons. 

### Hardware required 
* BBC micro:bit 
* DFR1216 expansion board
* modules connected to the pins 

## API overview 


## Example 

```typescript
basic.forever(function () {
    if (a4_microPROG.readDigital(IO.C0) == 1) {
        a4_microPROG.motorRun(MotorID.M1, MotorDirection.CW, 50)
        a4_microPROG.setBrightness(255)
    }
})
````

## License 

MIT

## Supported targets 
* for PXT/microbit
