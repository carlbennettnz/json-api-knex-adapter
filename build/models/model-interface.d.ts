import { Resource } from "json-api";
export interface Attr {
    key: string;
    serialize?: (value: any) => any;
    deserialize?: (value: any) => any;
}
export interface Relationship {
    key: string;
    type: string;
    relType?: RelType;
    via?: {
        table: string;
        pk: string;
        fk: string;
    };
}
export interface Model {
    table: string;
    idKey?: string;
    attrs?: (string | Attr)[];
    relationships?: Relationship[];
    transforms?: {
        beforeRender?: (resource: Resource) => Resource | undefined;
        beforeSave?: (resource: Resource) => Resource | undefined;
        beforeDelete?: (resource: Resource) => Resource | undefined;
    };
}
export interface Models {
    [name: string]: Model;
}
export interface StrictAttr extends Attr {
    serialize: (value: any) => any;
    deserialize: (value: any) => any;
}
export interface StrictRelationship extends Relationship {
    relType: RelType;
}
export interface ToManyRelationship extends StrictRelationship {
    via: {
        table: string;
        pk: string;
        fk: string;
    };
}
export interface StrictModel extends Model {
    idKey: string;
    attrs: StrictAttr[];
    relationships: StrictRelationship[];
}
export interface StrictModels extends Models {
    [name: string]: StrictModel;
}
export declare enum RelType {
    ONE_TO_MANY = 0,
    MANY_TO_ONE = 1,
    MANY_TO_MANY = 2,
}
