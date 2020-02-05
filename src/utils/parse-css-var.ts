// If the passed color string starts with --, it will be returned wrapped in `var()`, so it can be
// used in CSS.
export default function parseCSSVar(color: string): string {
	if (color.startsWith('--')) return `var(${color})`;
	return color;
}
