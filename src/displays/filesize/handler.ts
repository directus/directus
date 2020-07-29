import bytes from 'bytes';

export default function handler(value: number) {
	return bytes(value, { decimalPlaces: 0 });
}
