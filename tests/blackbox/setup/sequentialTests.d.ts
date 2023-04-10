export module 'sequentialTests';
export type SequentialTestEntry = {
	testFilePath: string;
};
export const list: {
	before: SequentialTestEntry[];
	after: SequentialTestEntry[];
	only: SequentialTestEntry[];
};
export function getReversedTestIndex(testFilePath: string): number;
