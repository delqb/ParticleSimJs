import { Core } from "./Core";

export class CoreRuntime {
    private static __instance: Core | null = null;

    static initialize(instance: Core): void {
        if (CoreRuntime.__instance) {
            throw new Error("Core is already initialized.");
        }
        CoreRuntime.__instance = instance;
    }

    static getInstance(): Core {
        if (!CoreRuntime.__instance) {
            throw new Error("Core is not initialized.");
        }
        return CoreRuntime.__instance;
    }

    static nullifyInstance(): void {
        if (!CoreRuntime.__instance) {
            throw new Error("Core is not initialized; instance is already nullified.");
        }
        CoreRuntime.__instance = null;
    }
}