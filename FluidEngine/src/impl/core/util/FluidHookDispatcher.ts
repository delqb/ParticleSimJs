import { HookDispatcher } from "@fluidengine/core/util/hook/HookDispatcher";

export class FluidHookDispatcher<T> implements HookDispatcher<T> {
    private readonly hooks: T[] = [];

    constructor(
        hooks: T[] = []
    ) {
        hooks.forEach(h => this.addHook(h));
    }

    public addHook(hook: T): void {
        if (this.hooks.includes(hook)) {
            throw new Error(`Cannot add hook: hook is already registered.`);
        }
        this.hooks.push(hook);
    }

    public removeHook(hook: T): void {
        const index = this.hooks.indexOf(hook);
        if (index === -1) {
            throw new Error(`Cannot remove hook: hook is not registered.`);
        }
        this.hooks.splice(index, 1);
    }

    public invokeHooks(fn: (hook: T) => void): void {
        for (const hook of this.hooks) {
            try {
                fn(hook);
            } catch (error) {
                console.error('Hook invocation threw an error:', error);
            }
        }
    }

    public hookList(): readonly T[] {
        return [...this.hooks];
    }
}
