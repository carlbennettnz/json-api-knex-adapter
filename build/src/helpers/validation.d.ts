import { Resource } from 'json-api';
import { StrictModel } from '../models/model-interface';
export declare function validateResources(resources: Resource[], model: StrictModel): void;
export declare function ensureOneToManyRelsAreNotPresent(resources: Resource[], model: StrictModel): void;
