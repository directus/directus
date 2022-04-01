export function isHex(hex: string): boolean {
	return /^#(([a-f\d]{2}){3,4})$/i.test(hex);
}

export default {
	isHex,
};
