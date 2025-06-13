export interface SystemPhase {
    key: string;
    order: number;
    preUpdate?(): void;
    postUpdate?(): void;
}