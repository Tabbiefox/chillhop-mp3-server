export function isObject(v: any): boolean {
    return Object.prototype.toString.call(v) === '[object Object]';
}

export function isEmpty(v: object | any[]): boolean {
    return !Object.keys(v).length;
}
