import camelcase from 'camelcase';
import env from '../env';

export default function parseEnv(splitWord: number, envType?: string) {
	// splitWord = where to spit the string to exlude any prewords
	const config: any = {};
	const storageConfig: any = { disks: {} };

	for (const [key, value] of Object.entries(env)) {
		if (envType === 'storage') {
			if (key.startsWith('STORAGE') === false) continue;
			if (key === 'STORAGE_LOCATIONS') continue;
			if (key.endsWith('PUBLIC_URL')) continue;

			const disk = key.split('_')[1].toLowerCase();
			if (!storageConfig.disks[disk]) storageConfig.disks[disk] = { config: {} };

			if (key.endsWith('DRIVER')) {
				storageConfig.disks[disk].driver = value;
				continue;
			}
			storageConfig.disks[disk].config[configCamel(key, splitWord)] = value;
		}
		if (envType === 'redis') {
			if (key.startsWith('REDIS')) {
				config[configCamel(key, splitWord)] = value;
			}
		} else {
			config[configCamel(key, splitWord)] = value;
		}
	}
	if (envType === 'storage') {
		return storageConfig;
	}

	return config;
}

function configCamel(key: string, sWord: number) {
	return camelcase(key.split('_').filter((_, index) => [0, sWord].includes(index) === false));
}
