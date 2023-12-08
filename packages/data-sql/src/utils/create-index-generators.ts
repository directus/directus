import { numberGenerator, type NumberGenerator } from './number-generator.js';

export interface IndexGenerators {
	parameter: NumberGenerator;
}

export function createIndexGenerators() {
	return {
		parameter: numberGenerator(),
	};
}
