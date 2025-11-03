import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, createAesKey } from './encrypt.js';

const isBase64 = (s: string) => /^[A-Za-z0-9+/]+={0,2}$/.test(s);

describe('createAesKey', () => {
	it('returns a Buffer of exactly 32 bytes for short keys by repeating and truncating', () => {
		const key = 'secret'; // 6 bytes
		const buf = createAesKey(key);
		expect(Buffer.isBuffer(buf)).toBe(true);
		expect(buf.byteLength).toBe(32);
		// starts with original bytes
		expect(buf.subarray(0, Buffer.byteLength(key, 'utf8')).toString('utf8')).toBe(key);
	});

	it('returns the same 32-byte content when already 32 bytes', () => {
		const key = 'a'.repeat(32);
		const buf = createAesKey(key);
		expect(buf.byteLength).toBe(32);
		expect(buf.toString('utf8')).toBe(key);
	});

	it('truncates to 32 bytes when result would exceed 32', () => {
		const key = 'x'.repeat(17); // repeating would yield 34 bytes; should truncate to 32
		const buf = createAesKey(key);
		expect(buf.byteLength).toBe(32);
		expect(buf.toString('utf8')).toBe('x'.repeat(32));
	});
});

describe('encrypt/decrypt (AES-256-GCM)', () => {
	it('round-trips plaintext with the same key', () => {
		const key = 'super-secret-key';
		const plaintext = 'Hello, world! 👋';
		const out = encrypt(plaintext, key);
		const decrypted = decrypt(out, key);
		expect(decrypted).toBe(plaintext);
	});

	it('produces base64 iv, ciphertext, and tag fields', () => {
		const key = 'k'.repeat(10);
		const plaintext = 'data';
		const out = encrypt(plaintext, key);
		const parts = out.split('||');
		expect(parts).toHaveLength(3);
		const iv = parts[0]!;
		const cipherText = parts[1]!;
		const tag = parts[2]!;
		expect(isBase64(iv)).toBe(true);
		expect(isBase64(cipherText)).toBe(true);
		expect(isBase64(tag)).toBe(true);
	});

	it('uses a random IV so encrypting the same input twice yields different outputs', () => {
		const key = 'repeatable-key';
		const plaintext = 'same input';
		const a = encrypt(plaintext, key);
		const b = encrypt(plaintext, key);
		expect(a).not.toBe(b);
		// Still decrypts to the same plaintext
		expect(decrypt(a, key)).toBe(plaintext);
		expect(decrypt(b, key)).toBe(plaintext);
	});

	it('throws when decrypting with the wrong key', () => {
		const key = 'correct-key';
		const wrong = 'incorrect-key';
		const plaintext = 'top secret';
		const out = encrypt(plaintext, key);
		expect(() => decrypt(out, wrong)).toThrow();
	});

	it('throws when the tag is tampered with', () => {
		const key = 'another-key';
		const plaintext = 'payload';
		const out = encrypt(plaintext, key);
		const parts = out.split('||');
		const iv = parts[0]!;
		const cipherText = parts[1]!;
		const tag = parts[2]!;
		// Flip a character in the tag (keep valid base64 padding)
		const tamperedTag = tag.replace(/[A-Za-z0-9]/, (c: string) => (c === 'A' ? 'B' : 'A'));
		const tampered = `${iv}||${cipherText}||${tamperedTag}`;
		expect(() => decrypt(tampered, key)).toThrow();
	});

	it('handles empty plaintext', () => {
		const key = 'empty-key';
		const plaintext = '';
		const out = encrypt(plaintext, key);
		const decrypted = decrypt(out, key);
		expect(decrypted).toBe('');
	});
});
