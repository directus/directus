import { test, expect } from 'vitest';
import { mapObjectDeep } from './map-object-deep';


test('Replace all undefined values with null', () => {
    const obj = { a: { b: { c: undefined } }, b: 'test' };
    const result = mapObjectDeep(obj, (_, value) => (value === undefined ? null : value));
    expect(result).toEqual({ a: { b: { c: null } }, b: 'test' });
});

test('Set all values to "Hi" with a key of "b.c"', () => {
    const obj = { a: { b: { c: undefined } }, b: {a: 'test', c: 'test'}, 'b.c': 'test' };
    const result = mapObjectDeep(obj, (key, value) => (key === 'b.c' ? 'Hi' : value));
    expect(result).toEqual({ a: { b: { c: undefined } }, b: {a: 'test', c: 'Hi'}, 'b.c': 'Hi' });
})