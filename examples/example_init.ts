/*

How to run this example:

1. From the root folder build the library: npm run build
2. Change to the examples directory: cd examples
3. Change the address and password to match your RainBird controller.
4. Build the example: npm run build
5. Run the example: npm start

*/
import { EventType, RainBirdService } from '../dist/index.js'

// Create the RainBird service
const rainbird = new RainBirdService({
  address: '<0.0.0.0>', // Replace with your RainBird controller's IP address
  password: '<password>', // Replace with your RainBird controller's password
  refreshRate: 90,
  showRequestResponse: true,
  syncTime: true,
})

rainbird.on(EventType.LOG, (log) => {
  console.log(`${log.level}: ${log.message}`)
})

const metadata = await rainbird.init()

console.log('RainBird Metadata:', metadata)
