# API Guide

This guide describes the methods, properties & events of the RainBird service.

## Methods

- `RainBirdService({
    address: string,
    password: string,
    refreshRate?: number,
    showRequestResponse: boolean,
    syncTime: boolean})`

    Instantiates the RainBirdService class.

    Parameters:
    - `address`: controller's local IP Address. Mandatory
    - `password`: controller's password. Mandatory
    - `refreshRate`: how often to request status from controller (in secords). Optional. Default is 0 (never check)
    - `showRequestResponse`: include requests & responses in log events. Mandatory
    - `syncTime`: sync the machine time to the controller. Mandatory

    ```typescript
    import { RainBirdService, LogLevel, EventType } from 'RainBird';

    // Create the RainBird service
    const rainbird = new RainBirdService({
        address: '10.0.0.123',
        password: 'mypassword',
        refreshRate: 90,
        showRequestResponse: true,
        syncTime: true,
    });
    ```

- `init(): Promise<RainBirdMetaData>`

    Performs various initialisations for the service. This is typically done once immediately after instantiating the service. It performs the following:
    - Retrieves the RainBird's model, version, serial number & available zones
    - Checks that its in the correct state to be controlled
    - Sets up the status & sync time jobs
    - Returns various metadata about the RainBird

    ```typescript
    var metadata = await rainbird.init();
    ```

- `isActive(zone?: number): boolean`
- `isInUse(zone?: number): boolean`
- `remainingDuration(zone?: number): number`
- `activateZone(zone: number, duration: number): void`
- `deactivateZone(zone: number): Promise<void>`
- `deactivateAllZones(): void`
- `enableZone(zone: number, enabled: boolean): void`
- `startProgram(programId: string): Promise<void>`
- `isProgramRunning(programId: string): boolean | undefined`
- `stopIrrigation(): Promise<void>`
- `getIrrigatinDelay(): Promise<number>`
- `setIrrigationDelay(days: number): Promise<void>`

## Properties

- `model: string`
- `version: string`
- `serialNumber: string`
- `zones: number[]`
- `rainSetPointReached: boolean`

## Events

- `log`

    ```typescript
    // Handle log events
    rainbird.on(EventType.LOG, (level: LogLevel, message: string) => {
        console.log(`${level}: ${message}`);
    });
    ```

- `status`
- `zone_enable`
- `rain_sensor_state`
