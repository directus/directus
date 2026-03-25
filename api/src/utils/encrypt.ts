import crypto from 'node:crypto';
import { promisify } from 'node:util';

const VERSION = '1';
const KDF = 'scrypt';
const SCRYPT_DEFAULTS = { N: 2 ** 14, r: 8, p: 1 } as const; // ~16MB mem, good server default

type ScryptOpts = { N: number; r: number; p: number };

const scryptAsync = promisify(crypto.scrypt) as (
	password: string | Buffer,
	salt: string | Buffer,
	keylen: number,
	options: crypto.ScryptOptions,
) => Promise<Buffer>;

const deriveKey = async (password: string, salt: Buffer, opts: ScryptOpts = SCRYPT_DEFAULTS): Promise<Buffer> => {
	return await scryptAsync(password, salt, 32, opts as crypto.ScryptOptions);
};

export const encrypt = async (plainText: string, password: string): Promise<string> => {
	const salt = crypto.randomBytes(16);
	const keyBuf = await deriveKey(password, salt, SCRYPT_DEFAULTS);

	// Generate a 12-byte IV for GCM and keep base64 string for storage
	const ivBuf = crypto.randomBytes(12);
	const iv = ivBuf.toString('base64');

	const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, ivBuf);
	let cipherText = cipher.update(plainText, 'utf8', 'base64');
	cipherText += cipher.final('base64');
	const tag = cipher.getAuthTag().toString('base64');

	// 1||scrypt||N||r||p||salt||iv||cipherText||tag
	return [
		VERSION,
		KDF,
		SCRYPT_DEFAULTS.N,
		SCRYPT_DEFAULTS.r,
		SCRYPT_DEFAULTS.p,
		salt.toString('base64'),
		iv,
		cipherText,
		tag,
	].join('||');
};

export const decrypt = async (encryptedText: string, password: string): Promise<string> => {
	const parts = encryptedText.split('||');

	if (parts.length < 9) throw new Error('Invalid encrypted payload');
	const [version, kdf, nStr, rStr, pStr, saltB64, ivB64, cipherText, tagB64] = parts;

	if (version !== VERSION) throw new Error(`Unsupported version: ${version}`);
	if (kdf !== KDF) throw new Error(`Unsupported kdf: ${kdf}`);
	if (!saltB64) throw new Error('No salt in encrypted string');
	if (!ivB64) throw new Error('No iv in encrypted string');
	if (cipherText === undefined) throw new Error('No cipherText in encrypted string');
	if (!tagB64) throw new Error('No tag in encrypted string');

	const opts: ScryptOpts = {
		N: Number(nStr) || SCRYPT_DEFAULTS.N,
		r: Number(rStr) || SCRYPT_DEFAULTS.r,
		p: Number(pStr) || SCRYPT_DEFAULTS.p,
	};

	const salt = Buffer.from(saltB64, 'base64');
	const keyBuf = await deriveKey(password, salt, opts);
	const iv = Buffer.from(ivB64, 'base64');
	const tag = Buffer.from(tagB64, 'base64');

	const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
	decipher.setAuthTag(tag);

	let plaintext = decipher.update(cipherText, 'base64', 'utf8');
	plaintext += decipher.final('utf8');

	return plaintext;
};
