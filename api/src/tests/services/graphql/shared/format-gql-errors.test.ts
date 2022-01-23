import { BaseException } from '@directus/shared/exceptions';
import { GraphQLError } from 'graphql';
import { formatGQLError } from '../../../../services/graphql/shared/format-gql-error';

describe('formatGQLError', () => {
	// Are these tests worth anything besides the hundo coverage?
	const baseException = [
		new BaseException('Test Error', 404, 'This is a test'),
		new BaseException('Sever Error', 500, 'This is a test'),
	];
	const graphQlError = new GraphQLError('Test Error', undefined, undefined, undefined, undefined, baseException[0]);

	it('returns the formatted first error in the array', () => {
		expect(formatGQLError(baseException)).toStrictEqual(graphQlError);
	});
	it('returns the formatted error', () => {
		expect(formatGQLError(baseException[0])).toStrictEqual(graphQlError);
	});
});
