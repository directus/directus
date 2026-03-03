import { describe, expect, it } from 'vitest';
import { noproto, parseJSON } from './parse-json.js';

describe('parseJSON', () => {
	it('parses valid JSON object', () => {
		expect(parseJSON('{"key": "value"}')).toEqual({ key: 'value' });
	});

	it('parses valid JSON array', () => {
		expect(parseJSON('[1, 2, 3]')).toEqual([1, 2, 3]);
	});

	it('parses JSON with nested objects', () => {
		const input = '{"outer": {"inner": "value"}}';
		expect(parseJSON(input)).toEqual({ outer: { inner: 'value' } });
	});

	it('parses JSON string value', () => {
		expect(parseJSON('"hello"')).toBe('hello');
	});

	it('parses JSON number value', () => {
		expect(parseJSON('42')).toBe(42);
	});

	it('parses JSON boolean values', () => {
		expect(parseJSON('true')).toBe(true);
		expect(parseJSON('false')).toBe(false);
	});

	it('parses JSON null value', () => {
		expect(parseJSON('null')).toBe(null);
	});

	it('throws on invalid JSON', () => {
		expect(() => parseJSON('invalid')).toThrow();
	});

	it('throws on empty string', () => {
		expect(() => parseJSON('')).toThrow();
	});

	it('strips __proto__ property from parsed JSON', () => {
		const malicious = '{"__proto__": {"polluted": true}, "safe": "value"}';
		const result = parseJSON(malicious);
		expect(result.safe).toBe('value');
		// The __proto__ key is stripped, so it won't be an own property
		expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
		// Verify prototype pollution didn't occur
		expect(({} as any).polluted).toBeUndefined();
	});

	it('strips nested __proto__ properties', () => {
		const malicious = '{"outer": {"__proto__": {"polluted": true}}}';
		const result = parseJSON(malicious);
		// The __proto__ key is stripped from nested objects
		expect(Object.prototype.hasOwnProperty.call(result.outer, '__proto__')).toBe(false);
	});

	it('handles JSON without __proto__ using fast path', () => {
		const safe = '{"key": "value", "nested": {"inner": 1}}';
		expect(parseJSON(safe)).toEqual({ key: 'value', nested: { inner: 1 } });
	});

	it('handles __proto__ as part of another key name', () => {
		const input = '{"my__proto__key": "value"}';
		const result = parseJSON(input);
		expect(result.my__proto__key).toBe('value');
	});
});

describe('noproto', () => {
	it('returns value for non-__proto__ keys', () => {
		expect(noproto('key', 'value')).toBe('value');
	});

	it('returns undefined for __proto__ key', () => {
		expect(noproto('__proto__', 'value')).toBeUndefined();
	});

	it('returns value for keys containing __proto__ as substring', () => {
		expect(noproto('my__proto__key', 'value')).toBe('value');
	});

	it('handles various value types', () => {
		expect(noproto('key', 123)).toBe(123);
		expect(noproto('key', null)).toBe(null);
		expect(noproto('key', { nested: true })).toEqual({ nested: true });
		expect(noproto('key', [1, 2, 3])).toEqual([1, 2, 3]);
	});
});
