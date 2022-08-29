const getRandomString = () => Math.random().toString(36).substring(2, 15);

const testEnv = {
	NUMBER: '1234',
	NUMBER_CAST_AS_STRING: 'string:1234',
	REGEX: 'regex:\\.example\\.com$',
	CSV: 'one,two,three,four',
	CSV_CAST_AS_STRING: 'string:one,two,three,four',
	MULTIPLE: 'array:string:https://example.com,regex:\\.example2\\.com$',
	CACHE_REDIS_PASSWORD: `${getRandomString()},${getRandomString()}`,
	MESSENGER_REDIS_PASSWORD: `${getRandomString()},${getRandomString()}`,
	RATE_LIMITER_REDIS_PASSWORD: `${getRandomString()},${getRandomString()}`,
};

describe('env processed values', () => {
	const originalEnv = process.env;
	let env: Record<string, any>;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...testEnv };
		env = jest.requireActual('../src/env').default;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	test('Number value should be a number', () => {
		expect(env.NUMBER).toStrictEqual(1234);
	});

	test('Number value casted as string should be a string', () => {
		expect(env.NUMBER_CAST_AS_STRING).toStrictEqual('1234');
	});

	test('Value casted as regex', () => {
		expect(env.REGEX).toBeInstanceOf(RegExp);
	});

	test('CSV value should be an array', () => {
		expect(env.CSV).toStrictEqual(['one', 'two', 'three', 'four']);
	});

	test('CSV value casted as string should be a string', () => {
		expect(env.CSV_CAST_AS_STRING).toStrictEqual('one,two,three,four');
	});

	test('Multiple type cast', () => {
		expect(env.MULTIPLE).toStrictEqual(['https://example.com', /\.example2\.com$/]);
	});

	test('*_REDIS_PASSWORD with a comma must be a string', () => {
		expect(env.CACHE_REDIS_PASSWORD).toStrictEqual(testEnv.CACHE_REDIS_PASSWORD);
		expect(env.MESSENGER_REDIS_PASSWORD).toStrictEqual(testEnv.MESSENGER_REDIS_PASSWORD);
		expect(env.RATE_LIMITER_REDIS_PASSWORD).toStrictEqual(testEnv.RATE_LIMITER_REDIS_PASSWORD);
	});
});
