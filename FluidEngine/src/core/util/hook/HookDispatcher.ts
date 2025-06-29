export interface HookDispatcher<T> {
    addHook(hook: T): void;
    removeHook(hook: T): void;
    invokeHooks(fn: (hook: T) => void): void;
    hookList(): readonly T[];
}
