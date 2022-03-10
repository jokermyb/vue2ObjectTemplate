export function is(val, type) {
  return toString.call(val) === `[object ${type}]`;
}
export function isString(val) {
  return is(val, 'String');
}
export function isObject(val) {
  return val !== null && is(val, 'Object');
}
export function isFunction(val) {
  return typeof val === 'function';
}