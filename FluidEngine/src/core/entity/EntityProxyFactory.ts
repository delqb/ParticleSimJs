import { ECSEntityId } from "./EntityId";
import { ECSEntityProxy } from "./EntityProxy";

export interface ECSEntityProxyFactory {
    createProxy(entityId: ECSEntityId): ECSEntityProxy;
}