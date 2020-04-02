/**
 * Check if the specified variable is an object and nothing else
 * 
 * @param v Variable to check
 * @returns Boolean
 */
export function isObject(v: any): boolean {
    return Object.prototype.toString.call(v) === '[object Object]';
}

/**
 * Check if the specified variable is empty
 * 
 * @param v Variable to check
 * @returns Boolean
 */
export function isEmpty(v: object | any[]): boolean {
    return !Object.keys(v).length;
}
