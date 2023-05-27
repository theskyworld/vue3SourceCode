export const extend = Object.assign;

export const isObject = value => {
    return value !== null && typeof value === 'object';
}

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

export const hasChanged = (oldVal, newVal) => !Object.is(oldVal, newVal);

export const EMPTY_OBJ = {};