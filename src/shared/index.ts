export const isObject = value => {
    return value !== null && typeof value === 'object';
}

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
