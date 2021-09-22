import { generateJoi } from '.';
import AnySchema from 'joi';

describe('generateJoi', () => {
	it('', () => {
		const mockFilters = { filter: {} };

		expect(generateJoi(mockFilters)).toBeInstanceOf(AnySchema);
	});
});
