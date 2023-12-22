import { join } from 'path';
import { useEnv } from '../../env.js';

export const getExtensionsPath = () => {
	const env = useEnv();

	if (env['EXTENSIONS_LOCATION']) {
		return join(env['TEMP_PATH'], 'extensions');
	}

	return env['EXTENSIONS_PATH'];
};
