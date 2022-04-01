import { StorageManager } from '@directus/drive';
import { GoogleCloudStorage, GoogleCloudStorageConfig } from '../src';

describe('drive', function () {
	it('Instantiate', function () {
		const storage = new StorageManager({
			default: 'gcs',
			disks: {
				remote: {
					driver: 'gcs',
					config: {
						bucket: 'bucket',
					} as GoogleCloudStorageConfig,
				},
			},
		});

		storage.registerDriver('gcs', GoogleCloudStorage);

		const disk = storage.disk('remote');
		expect(disk).toBeInstanceOf(GoogleCloudStorage);
	});
});
