import { Component, Vec2 } from "../engine/FluidECS";

export type ResolutionComponent = Component & {
    resolution: Vec2;
}

export type PositionComponent = Component & {
    position: Vec2;
    rotation: number;
}

export type TargetPositionComponent = Component & {
    targetPosition: Vec2;
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

export type WorldComponent = Component & {
    resolution: Vec2;
    borderWidth: number;
    backgroundColor: string;
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

export type ProjectileComponent = Component & {
    generation: number;
    deathTime: number;
}

export type FireControlComponent = Component & {
    fireIntent: boolean;
}

export type ProjectileSourceComponent = Component & {
    muzzleSpeed: number;
    lastFireTime: number;
    projectileScale: number;
}

export type CursorTranslateComponent = Component & {
    cursorTranslate: Vec2;
}

export type ParticleStatsComponent = Component & {
    position: Vec2;
    velocity: Vec2;
    acceleration: Vec2;
    computedAcceleration: number;
    computedSpeed: number;
}

export type ScaleComponent = Component & {
    scale: Vec2;
};

export type SpriteComponent = Component & {
    texture: HTMLImageElement;
    zIndex: number;
};

export type RenderCenterComponent = Component & {
    renderDistance: number;
}
