import { ECSEntityId } from "./EntityId";

export interface ECSEntityResolver {
    getEntityBySymbol(entitySymbol: symbol): ECSEntityId;
}