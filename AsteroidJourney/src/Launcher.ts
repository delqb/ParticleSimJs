import { FluidCore } from "@fluid/impl/core/FluidCore";
import { CoreRuntime } from "@fluid/index";

async function main() {
    try {
        const coreInstance = FluidCore.bootstrap();
        CoreRuntime.initialize(coreInstance);
    } catch (err) {
        console.error("Core initialization failed:", err);
        return;
    }

    try {
        await import("./AsteroidJourney");
    } catch (err) {
        console.error("Failed to load AsteroidJourney module:", err);
    }
}

await main();