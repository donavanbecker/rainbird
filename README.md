<span align="center">

<a href="https://github.com/donavanbecker/rainbird"><img alt="rainbird" src="https://raw.githubusercontent.com/donavanbecker/rainbird/latest/branding/Rainbird.svg?sanitize=true" width="500px"></a>

# Rainbird

<a href="https://www.npmjs.com/package/rainbird"><img title="npm version" src="https://badgen.net/npm/v/rainbird?icon=npm&label" ></a>
<a href="https://www.npmjs.com/package/rainbird"><img title="npm downloads" src="https://badgen.net/npm/dt/rainbird?label=downloads" ></a>
<a href="https://discord.gg/8fpZA4S"><img title="discord-rainbird" src="https://badgen.net/discord/online-members/8fpZA4S?icon=discord&label=discord" ></a>

<a href="https://paypal.me/donavanbecker"><img title="donavanbecker" src="https://badgen.net/badge/donavanbecker/paypal/yellow" ></a>
<a href="https://paypal.me/Mantorok1"><img title="mantorok1" src="https://badgen.net/badge/mantorok1/paypal/yellow" ></a>

<p>The <a href="https://rainbird.com">RainBird</a> 
library allows you to access your RainBird Controller</a>. 
</p>

</span>

## Installation

To use this library in Node, install it from the command line:
```
npm -save install rainbird
```

## Configuration

```
import { RainBirdService } from 'rainbird';
```
1. `ipaddress`: controller's local IP Address
2. `password`: controller's password
3. `refreshRate`: refreshRate of how often to look for changes, optional.
4. `log`: this is used to pass through for logging
5. `showRequestResponse`: this will show rainbird request logs, boolean,
6. `syncTime`: will sync the machine time to the controller, boolan,

```
const rainbird = new RainBirdService({
        address: ipaddress,
        password: password!,
        refreshRate: refreshRate,
        log: this.log,
        showRequestResponse: showRequestResponse
        syncTime: device.syncTime!,
      });
```

## Collaborators

 - Main developer of the RaindBird API:
      - [mantorok1](https://github.com/mantorok1)

## Compatiable Controllers

Any controller that supports the [RainBird LNK WiFi Module](https://www.rainbird.com/products/lnk-wifi-module) should be compatible. This includes:
- ESP-Me
- ESP-TM2
- ESP-RZXe
- ESP-ME3

## Known Limitations
- Using the RainBird app while the plugin is running can cause connectivity issues.
- The RainBird LNK WiFi Module may not support "Band Steering" and WiFi Channel 13. Try not using these on your router if you are having connectivity issues.
- Some models do not yet have support for displaying the time remaining. If its not working for your model please log a GitHub issue and we will try to add it with your help.
