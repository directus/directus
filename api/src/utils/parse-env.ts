import camelcase from 'camelcase';
import env from '../env';

export default function parseEnv(key: string, splitWord: number) {
	// splitWord 0 = exclude first word on _

	const config = camelcase(
		key.split('_').filter((_, index) => [0, splitWord].includes(index) === false)
	);

	return config;
}
