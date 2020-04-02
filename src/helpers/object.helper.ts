export function isObject(v: any): boolean {
    return v.constructor === Object;
}

export function isEmpty(v: Object | Array<any>): boolean {
    return !Object.keys(v).length;
}
