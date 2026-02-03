import { join } from 'path';
import { useEnv } from '@directus/env';

export const getExtensionsPath = () => {
	const env = useEnv();

	if (env['EXTENSIONS_LOCATION']) {
		return join(env['TEMP_PATH'] as string, 'extensions');
	}

	return env['EXTENSIONS_PATH'] as string;
};
