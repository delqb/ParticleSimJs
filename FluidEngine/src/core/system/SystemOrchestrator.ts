import { ECSNodeIndex } from "../node/NodeIndex";
import { ECSSystemPhase } from "./SystemPhase";

export interface ECSSystemOrchestrator {
    hasPhase(phase: ECSSystemPhase): boolean;
    addPhase(phase: ECSSystemPhase, phaseOrder: number): void;
    pushPhase(phase: ECSSystemPhase): void;
    pushPhases(...phases: ECSSystemPhase[]): void
    removePhase(phase: ECSSystemPhase): void;
    getPhases(): Iterable<ECSSystemPhase>;
    update(nodeIndex: ECSNodeIndex): void;
}