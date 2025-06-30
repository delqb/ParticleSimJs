import { CoreRuntime } from "@fluid/core/CoreRuntime";
import { FluidCore } from "@fluid/impl/core/FluidCore";

// import { CoreRuntime } from "../../FluidEngine/src/core/CoreRuntime";
console.log(`Launcher has started!`);

async function main() {
    console.log(`Beginning initialization sequence...`);
    try {
        console.log("Bootstrapping Fluid Core...");
        const coreInstance = FluidCore.bootstrap();
        console.log(`Fluid Core has been instantiated!`, coreInstance);
        console.log(`Initializing 'CoreRuntime'...`);
        CoreRuntime.initialize(coreInstance);
        console.log(`'CoreRuntime' has been initialized!`);
    } catch (err) {
        console.error("Core initialization failed:", err);
        return;
    }

    try {
        console.log("Starting Asteroid Journey...");
        await import("./AsteroidJourney");
    } catch (err) {
        console.error("Failed to load AsteroidJourney module:", err);
    }
}

await main();