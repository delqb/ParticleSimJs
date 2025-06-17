import { Component } from "@fluidengine/core";
import { Transform } from "@fluidengine/lib/spatial";

export type ProjectileComponent = Component & {
    generation: number;
    deathTime: number;
}

export type ProjectileSourceComponent = Component & {
    transform?: Transform;
    muzzleSpeed: number;
    fireRate: number;
    lastFireTime: number;
    projectileSize: number;
    projectileLifeTime: number;
}

export function createProjectileComponent(deathTime: number, { key = "projectile", generation = 1 } = {}): ProjectileComponent {
    return { key, generation, deathTime };
}

export function createProjectileSourceComponent(muzzleSpeed: number, fireRate: number, projectileSize: number, projectileLifeTime: number, { key = "projectileSource", lastFireTime = 0, transform = undefined } = {}): ProjectileSourceComponent {
    return { key, muzzleSpeed, fireRate, lastFireTime, projectileSize, projectileLifeTime, transform };
}