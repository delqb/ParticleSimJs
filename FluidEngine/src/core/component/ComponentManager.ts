import {ECSComponentFactory} from "./ComponentFactory";
import {ECSComponentRepository} from "./ComponentRepository";
import {ECSComponentTypeFactory} from "./type/ComponentTypeFactory";
import {ECSComponentTypeRegistry} from "./type/ComponentTypeRegistry";
import {ECSComponentTypeResolver} from "./type/ComponentTypeResolver";

export interface ECSComponentManager {
    getComponentTypeFactory(): ECSComponentTypeFactory;
    getComponentTypeRegistry(): ECSComponentTypeRegistry;
    getComponentTypeResolver(): ECSComponentTypeResolver;
    getComponentFactory(): ECSComponentFactory;
    getComponentRepository(): ECSComponentRepository;
}