import bytes from 'bytes';

export default function handler(value: number): string {
	return bytes(value, { decimalPlaces: 0 });
}
