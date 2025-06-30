import { ECSNodeIndex } from "@fluid/core/node/NodeIndex";
import { ECSSystemOrchestrator } from "@fluid/core/system/SystemOrchestrator";
import { ECSSystemPhase } from "@fluid/core/system/SystemPhase";
import { OrderedList } from "@fluid/core/util/OrderedList";
import { OrderedArrayList } from "@fluid/lib/structures/OrderedArrayList";

export class FluidSystemOrchestrator implements ECSSystemOrchestrator {

    private readonly phaseList: OrderedList<ECSSystemPhase> = new OrderedArrayList(); //Store phases in proper order

    hasPhase(phase: ECSSystemPhase): boolean {
        return this.phaseList.has(phase);
    }

    addPhase(phase: ECSSystemPhase, phaseOrder: number): void {
        if (this.phaseList.has(phase)) {
            throw new Error(`Failed to add phase '${phase.getName()}': phase has already been added.`);
        }
        this.phaseList.insert(phase, phaseOrder);
    }

    pushPhase(phase: ECSSystemPhase): void {
        this.addPhase(phase, this.phaseList.getSize());
    }

    pushPhases(...phases: ECSSystemPhase[]): void {
        phases.forEach(phase => this.pushPhase(phase));
    }

    removePhase(phase: ECSSystemPhase): void {
        if (!this.phaseList.has(phase)) {
            throw new Error(`Failed to remove phase '${phase.getName()}': phase has not been added.`);
        }
        this.phaseList.remove(phase);
    }

    getPhases(): Iterable<ECSSystemPhase> {
        return this.phaseList.getAll();
    }

    update(nodeIndex: ECSNodeIndex): void {
        for (const phase of this.phaseList.getAll()) {
            try {
                phase.update(nodeIndex);
            } catch (error) {
                console.error(`Failed to complete phase update '${phase.getName()}':\n${error}`);
            }
        }
    }
}