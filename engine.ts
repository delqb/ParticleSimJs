export type Vector2 = { x: number, y: number };
export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}