export declare function recordsToCollection(records: any, type: any, model: any, fields?: never[]): any;
export declare function recordToResource(record: any, type: any, model: any, fields?: never[]): any;
export declare function resourceToRecord(resource: any, model: any, {stringifyObjects}?: {
    stringifyObjects?: boolean;
}): {
    primary: {};
    linksFn: (primaryId: any) => {};
};
