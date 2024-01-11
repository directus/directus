import { numberGenerator, type NumberGenerator } from './number-generator.js';

export interface IndexGenerators {
	table: NumberGenerator;
	column: NumberGenerator;
	parameter: NumberGenerator;
}

export function createIndexGenerators() {
	return {
		table: numberGenerator(),
		column: numberGenerator(),
		parameter: numberGenerator(),
	};
}
