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
    // Initialise the RainBird service
    var metadata = await rainbird.init();
    ```

- `isActive(zone?: number): boolean`

    Returns true if the specified zone is active (i.e. currently running or queued to run). If no zone number is supplied then will check if any zone is active.

    Parameters:
    - `zone`: zone number. Optional

    ```typescript
    // Is Zone 1 currently running or queued to run
    var isZone1Active = rainbird.isActive(1);
    ```

- `isInUse(zone?: number): boolean`

    Returns true if the specified zone is currently running (does not check if it's queued). If no zone number is supplied then will check if any zone is running.

    Parameters:
    - `zone`: zone number. Optional

    ```typescript
    // Is Zone 1 current running?
    var isZone1Running = rainbird.isInUse(1);
    ```

- `remainingDuration(zone?: number): number`

    Returns the amount of time (in seconds) remaining for the specified zone. If no zone number is supplied then will return the total for all active zones.

    Parameters:
    - `zone`: zone number. Optional

    ```typescript
    // Get the remaining time for Zone 1
    var zone1TimeLeft = rainbird.remainingDuration(1);
    ```

- `activateZone(zone: number, duration: number): void`

    Places the specified zone and duration into a queue. The zone will begin running for the specified duration once all other zones ahead in the queue have completed.

    Parameters:
    - `zone`: zone number. Mandatory
    - `duration`: The amount of time (in seconds) for the zone to run. Mandatory.

    ```typescript
    // Active Zone 1 for 10 minutes (600 seconds)
    rainbird.activateZone(1, 600);
    ```    

- `deactivateZone(zone: number): Promise<void>`

    Stops the specified zone or removes it from the queue.

    Parameters:
    - `zone`: zone number. Mandatory

    ```typescript
    // Stop Zone 1 if its running or remove it from the queue
    await rainbird.deactivateZone(1);
    ```

- `deactivateAllZones(): void`

    Stops the currently running zone and removes any others that are in the queue.

    ```typescript
    // Stop all zones
    await rainbird.deactivateAllZones(1);
    ```

- `startProgram(programId: string): Promise<void>`

    Starts the specified RainBird program.

    Parameters:
    - `programId`: The program identifier (letters A - D). Mandatory

    ```typescript
    // Start program A
    await rainbird.startProgram('A');
    ```

- `isProgramRunning(programId: string): boolean | undefined`

    Returns true if the specified program is currently running.

    Parameters:
    - `programId`: The program identifier (letters A - D). Mandatory

    ```typescript
    // Is program A running?
    var isProgramArunning = await rainbird.isProgramRunning('A');
    ```

- `stopIrrigation(): Promise<void>`

    Performs a Stop Irrigation command on the RainBird.

    ```typescript
    // Stop Irrigation
    await rainbird.stopIrrigation();
    ```

- `getIrrigatinDelay(): Promise<number>`

    Returns the Irrigation Delay remaining (in days).

    ```typescript
    // Get Irrigation Delay days remaining
    var delayDaysLeft = await rainbird.getIrrigatinDelay();
    ```

- `setIrrigationDelay(days: number): Promise<void>`

    Set the number of days to delay the irrigation.

    Parameters:
    - `days`: number of days to delay irrigation (1 - 14). Mandatory

    ```typescript
    // Set Irrigation Delay to 5 days
    await rainbird.setIrrigationDelay(5);
    ```

## Properties

- `model: string`

    Returns the model number of the RainBird controller.

    ```typescript
    // Get the RainBird model number
    var model = rainbird.model;
    ```

- `version: string`

    Returns the version of the RainBird controller.

    ```typescript
    // Get the RainBird version number
    var version = rainbird.version;
    ```    

- `serialNumber: string`

    Returns the serial number of the RainBird controller.

    ```typescript
    // Get the RainBird serial number
    var serialNumber = rainbird.serialNumber;
    ```     

- `zones: number[]`

    Returns the available zones of the RainBird controller in an array.

    ```typescript
    // Get the RainBird zones
    var zones = rainbird.zones;
    ```     

- `rainSetPointReached: boolean`

    Returns true if the rain sensor's set point has been reached.

    ```typescript
    // Is the rain sensor's set point reached?
    var setPointReached = rainbird.rainSetPointReached;
    ```    

## Events

- `log`

    Raised when API wants to notify client of a specific log level & message.  

    ```typescript
    // Handle log events
    rainbird.on(EventType.LOG, (level: LogLevel, message: string) => {
        console.log(`${level}: ${message}`);
    });
    ```

- `status`

    Raised when API wants to notify client of a status change

    ```typescript
    // Handle status events
    rainbird.on(EventType.STATUS, () => {
        console.log('RainBird status changed');
    });
    ```

- `rain_sensor_state`

    Raised when API wants to notify client of a change to the rain sensor's state

    ```typescript
    // Handle status events
    rainbird.on(EventType.RAIN_SENSOR_STATE, () => {
        console.log('Rain sensor state has changed');
    });
    ```
