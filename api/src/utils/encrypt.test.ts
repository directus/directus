import { decrypt, encrypt } from './encrypt.js';
import { describe, expect, it } from 'vitest';

const isBase64 = (s: string) => /^[A-Za-z0-9+/]+={0,2}$/.test(s);

describe('encrypt/decrypt (AES-256-GCM with scrypt KDF, v1 envelope)', () => {
	it('round-trips plaintext with the same key', async () => {
		const key = 'super-secret-key';
		const plaintext = 'Hello, world! 👋';
		const out = await encrypt(plaintext, key);
		const decrypted = await decrypt(out, key);
		expect(decrypted).toBe(plaintext);
	});

	it('produces versioned envelope with KDF params and base64 fields', async () => {
		const key = 'k'.repeat(10);
		const plaintext = 'data';
		const out = await encrypt(plaintext, key);
		const parts = out.split('||');
		expect(parts.length).toBeGreaterThanOrEqual(9);
		const v = parts[0]!;
		const kdf = parts[1]!;
		const N = parts[2]!;
		const r = parts[3]!;
		const p = parts[4]!;
		const saltB64 = parts[5]!;
		const ivB64 = parts[6]!;
		const cipherText = parts[7]!;
		const tagB64 = parts[8]!;
		expect(v).toBe('1');
		expect(kdf).toBe('scrypt');
		expect(Number.isFinite(Number(N))).toBe(true);
		expect(Number.isFinite(Number(r))).toBe(true);
		expect(Number.isFinite(Number(p))).toBe(true);
		expect(isBase64(saltB64)).toBe(true);
		expect(isBase64(ivB64)).toBe(true);
		expect(isBase64(cipherText)).toBe(true);
		expect(isBase64(tagB64)).toBe(true);
	});

	it('uses a random IV so encrypting the same input twice yields different outputs', async () => {
		const key = 'repeatable-key';
		const plaintext = 'same input';
		const a = await encrypt(plaintext, key);
		const b = await encrypt(plaintext, key);
		expect(a).not.toBe(b);
		// Still decrypts to the same plaintext
		expect(await decrypt(a, key)).toBe(plaintext);
		expect(await decrypt(b, key)).toBe(plaintext);
	});

	it('throws when decrypting with the wrong key', async () => {
		const key = 'correct-key';
		const wrong = 'incorrect-key';
		const plaintext = 'top secret';
		const out = await encrypt(plaintext, key);
		await expect(decrypt(out, wrong)).rejects.toThrow();
	});

	it('throws when the tag is tampered with', async () => {
		const key = 'another-key';
		const plaintext = 'payload';
		const out = await encrypt(plaintext, key);
		const parts = out.split('||');
		const iv = parts[6]!;
		const cipherText = parts[7]!;
		const tag = parts[8]!;
		// Flip a character in the tag (keep valid base64 padding)
		const tamperedTag = tag.replace(/[A-Za-z0-9]/, (c: string) => (c === 'A' ? 'B' : 'A'));

		const tampered = [parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], iv, cipherText, tamperedTag].join(
			'||',
		);

		await expect(decrypt(tampered, key)).rejects.toThrow();
	});

	it('handles empty plaintext', async () => {
		const key = 'empty-key';
		const plaintext = '';
		const out = await encrypt(plaintext, key);
		const decrypted = await decrypt(out, key);
		expect(decrypted).toBe('');
	});
});

describe('decrypt error handling', () => {
	it('throws on invalid encrypted payload (too few parts)', async () => {
		await expect(decrypt('only||two', 'key')).rejects.toThrow('Invalid encrypted payload');
	});

	it('throws on unsupported version', async () => {
		const key = 'k';
		const out = await encrypt('data', key);
		const parts = out.split('||');
		parts[0] = '999';
		const mutated = parts.join('||');
		await expect(decrypt(mutated, key)).rejects.toThrow('Unsupported version: 999');
	});

	it('throws on unsupported kdf', async () => {
		const key = 'k';
		const out = await encrypt('data', key);
		const parts = out.split('||');
		parts[1] = 'pbkdf2';
		const mutated = parts.join('||');
		await expect(decrypt(mutated, key)).rejects.toThrow('Unsupported kdf: pbkdf2');
	});

	it('throws when salt is missing (empty)', async () => {
		const key = 'k';
		const out = await encrypt('data', key);
		const parts = out.split('||');
		parts[5] = '';
		const mutated = parts.join('||');
		await expect(decrypt(mutated, key)).rejects.toThrow('No salt in encrypted string');
	});

	it('throws when iv is missing (empty)', async () => {
		const key = 'k';
		const out = await encrypt('data', key);
		const parts = out.split('||');
		parts[6] = '';
		const mutated = parts.join('||');
		await expect(decrypt(mutated, key)).rejects.toThrow('No iv in encrypted string');
	});

	it('throws when tag is missing (empty)', async () => {
		const key = 'k';
		const out = await encrypt('data', key);
		const parts = out.split('||');
		parts[8] = '';
		const mutated = parts.join('||');
		await expect(decrypt(mutated, key)).rejects.toThrow('No tag in encrypted string');
	});
});
