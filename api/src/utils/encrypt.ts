import crypto from 'node:crypto';

export const encrypt = (plainText: string, key: string): string => {
	// Ensure the key is exactly 32 bytes for AES-256
	const keyBuf = createAesKey(key);

	// Generate a 12-byte IV for GCM and keep base64 string for storage
	const ivBuf = crypto.randomBytes(12);
	const iv = ivBuf.toString('base64');

	const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, ivBuf);
	let cipherText = cipher.update(plainText, 'utf8', 'base64');
	cipherText += cipher.final('base64');
	const tag = cipher.getAuthTag().toString('base64');

	return `${iv}||${cipherText}||${tag}`;
};

export const decrypt = (encryptedText: string, key: string): string => {
	// Ensure the key is exactly 32 bytes for AES-256
	const keyBuf = createAesKey(key);

	const [iv, cipherText, tag] = encryptedText.split('||');

	if (iv === undefined || iv === '') throw new Error('No iv in encrypted string');
	if (cipherText === undefined) throw new Error('No cipherText in encrypted string');
	if (tag === undefined || tag === '') throw new Error('No tag in encrypted string');

	const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(tag, 'base64'));

	let plaintext = decipher.update(cipherText, 'base64', 'utf8');
	plaintext += decipher.final('utf8');

	return plaintext;
};

export const createAesKey = (key: string): Buffer => {
	// Grow by repetition until we have at least 32 bytes
	let result = Buffer.from(key, 'utf8');

	while (result.byteLength < 32) {
		result = Buffer.concat([result, Buffer.from(key, 'utf8')]);
	}

	// If longer than 32 bytes, truncate on byte boundaries
	if (result.byteLength > 32) {
		return result.subarray(0, 32);
	}

	return result;
}
