export interface RGB<T> {
	r: T;
	g: T;
	b: T;
}

export interface HSL<T> {
	h: T;
	s: T;
	l: T;
}

export function isNullish(obj: RGB<string | null> | HSL<string | null>): boolean {
	return Object.values(obj).every((e) => e === null);
}

export function isEmptyStringIsh(obj: RGB<string | null> | HSL<string | null>): boolean {
	return Object.values(obj).every((e) => e === '');
}

export function componentToHex(c: number): string {
	if (c > 255) return 'ff';
	return c.toString(16).padStart(2, '0').toUpperCase();
}

export function toNum(x: string | number | null): number {
	if (typeof x === 'string') {
		const res = parseInt(x, 10);
		return isNaN(res) ? 0 : res;
	} else return x || 0;
}

export function rgbToHex(rgb: RGB<string | null>): string | null {
	if (isNullish(rgb)) return null;
	if (isEmptyStringIsh(rgb)) return '';
	const r = componentToHex(toNum(rgb.r));
	const g = componentToHex(toNum(rgb.g));
	const b = componentToHex(toNum(rgb.b));
	return `#${r}${g}${b}`;
}

export function isHex(hex: string): boolean {
	return /^#(([a-f\d]{2}){3,4})$/i.test(hex);
}

export function hexToRgb(hex: string | null): RGB<string | null> {
	if (hex === null) return { r: null, g: null, b: null };
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	if (!result) return { r: '', g: '', b: '' };
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	const a = result[4] ? parseInt(result[4], 16) / 255 : 1;
	return { r: r.toString(), g: g.toString(), b: b.toString() };
}

export function hexToHsl(hex: string | null): HSL<string | null> {
	return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL<string | null>): string | null {
	return rgbToHex(hslToRgb(hsl));
}

// r,g,b in [0,255]; h in [0,360); s,l in [0,100]
export function rgbToHsl(rgb: RGB<string | null>): HSL<string | null> {
	if (isNullish(rgb)) return { h: null, s: null, l: null };
	if (isEmptyStringIsh(rgb)) return { h: '', s: '', l: '' };
	let r = toNum(rgb.r);
	let g = toNum(rgb.g);
	let b = toNum(rgb.b);
	// Make r, g, and b fractions of 1
	r /= 255;
	g /= 255;
	b /= 255;

	const a = Math.max(r, g, b),
		n = a - Math.min(r, g, b),
		f = 1 - Math.abs(a + a - n - 1);
	let h = n && (a == r ? (g - b) / n : a == g ? 2 + (b - r) / n : 4 + (r - g) / n);
	h = 60 * (h < 0 ? h + 6 : h);
	let s = f ? n / f : 0;
	let l = (a + a - n) / 2;
	s *= 100;
	l *= 100;

	return {
		h: Math.round(h).toString(),
		s: Math.round(s).toString(),
		l: Math.round(l).toString(),
	};
}

// h in [0, 360); s,l in [0,100]
export function hslToRgb(hsl: HSL<string | null>): RGB<string | null> {
	if (isNullish(hsl)) return { r: null, g: null, b: null };
	if (isEmptyStringIsh(hsl)) return { r: '', g: '', b: '' };
	const h = toNum(hsl.h);
	let s = toNum(hsl.s);
	let l = toNum(hsl.l);
	// Must be fractions of 1
	s /= 100;
	l /= 100;

	const a = s * Math.min(l, 1 - l);
	const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	const r = Math.round(f(0) * 255);
	const g = Math.round(f(8) * 255);
	const b = Math.round(f(4) * 255);
	return { r: r.toString(), g: g.toString(), b: b.toString() };
}

export default {
	componentToHex,
	isHex,
	rgbToHex,
	hexToRgb,
	rgbToHsl,
	hslToRgb,
	hexToHsl,
	hslToHex,
};
