import { Component } from "@fluidengine/core";
import { Vec2, Transform } from "@fluidengine/lib/spatial";

export * from "./BoundingBoxComponent";
export * from "./ProjectileComponent";
export * from "./ChunkOccupancyComponent"

export type ResolutionComponent = Component & {
    resolution: Vec2;
}

export type PositionComponent = Component & {
    position: Vec2;
    rotation: number;
}

export type TargetPositionComponent = Component & {
    position: PositionComponent;
}

export type VelocityComponent = Component & {
    velocity: Vec2;
    angular: number;
}

export type AccelerationComponent = Component & {
    acceleration: Vec2;
    angular: number;
}

export type ScreenPointComponent = Component & {
    point: Vec2;
}

export type CameraSpeedFactorComponent = Component & {
    speedFactor: number;
}

export type ViewportBorderWidthComponent = Component & {
    borderWidth: number;
}

export type MovementControlComponent = Component & {
    accelerationInput: Vec2;
    yawInput: number;
}

export type BackgroundGridComponent = Component & {
    gridSize: number;
    gridLineWidth: number;
    gridLineColor: string;
}

export type ComputedSpeedComponent = Component & {
    computedSpeed: number;
}

export type ComputedAccelerationComponent = Component & {
    computedAcceleration: number;
}

export type ParticleComponent = Component & {
    radius: number;
    color: string;
}

export type FireControlComponent = Component & {
    fireIntent: boolean;
}

export type CursorTranslateComponent = Component & {
    cursorTranslate: Vec2;
}

export type ViewportComponent = Component & {
}

export type StatsComponent = Component & {
}

export type RenderCenterComponent = Component & {
    renderDistance: number;
}

export type SpriteComponent = Component & {
    image: HTMLImageElement;
    transform?: Transform;
    zIndex: number;
};
