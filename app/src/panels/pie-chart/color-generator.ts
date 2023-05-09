import chroma from 'chroma-js';

export const monoThemeGenerator = (baseColor: string, length: number): string[] => {
	const theme: string[] = [baseColor];
	const lab = chroma(baseColor).get('lab') as unknown as [number, number, number];

	let newL = lab[0] - 15;

	for (let index = 1; index < length; index++) {
		updateLightness(index);
		let proposedColor = chroma.lab(newL, lab[1], lab[2]).hex();

		let round = 0;

		while (theme.includes(proposedColor)) {
			updateLightness(index);

			if (newL > 0 && newL < 255) {
				proposedColor = chroma.lab(newL, lab[1], lab[2]).hex();
			}

			round++;

			if (round > 600) {
				break;
			}
		}

		theme.push(proposedColor);
	}

	return theme;

	function updateLightness(index: number) {
		newL = newL < 0 ? lab[0] + index + 20 : newL - (index + 10);
	}
};
