import chroma from 'chroma-js';

export function monoThemeGenerator(baseColor: string, length: number): string[] {
	const theme: string[] = [baseColor];
	const lab = chroma(baseColor).get('lab') as unknown as [number, number, number];

	// Lighten or darken the next color in the theme
	const getUpdatedLightness = (lightness: number, index: number) =>
		lightness < 0 ? lab[0] + index + 20 : lightness - (index + 10);

	let newLightness = lab[0] - 15;

	// Starts at 1 because the 0-indexed first color in the theme array is the base color
	for (let index = 1; index < length; index++) {
		newLightness = getUpdatedLightness(newLightness, index);
		let proposedColor = chroma.lab(newLightness, lab[1], lab[2]).hex();

		let round = 0;

		// Regenerate a new color if it already exists and retry whenever it is still the same color until a set amount of time
		while (theme.includes(proposedColor)) {
			newLightness = getUpdatedLightness(newLightness, index);

			if (newLightness > 0 && newLightness < 255) {
				proposedColor = chroma.lab(newLightness, lab[1], lab[2]).hex();
			}

			round++;

			if (round > 600) {
				break;
			}
		}

		theme.push(proposedColor);
	}

	return theme;
}
