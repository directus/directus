import { StorageManager } from '@directus/drive';
import { AmazonWebServicesS3Storage, AmazonWebServicesS3StorageConfig } from '../src';

describe('drive', function () {
	it('Instantiate', function () {
		const storage = new StorageManager({
			default: 's3',
			disks: {
				remote: {
					driver: 's3',
					config: {
						bucket: 'bucket',
						key: 'key',
						secret: 'secret',
					} as AmazonWebServicesS3StorageConfig,
				},
			},
		});

		storage.registerDriver('s3', AmazonWebServicesS3Storage);

		const disk = storage.disk('remote');
		expect(disk).toBeInstanceOf(AmazonWebServicesS3Storage);
	});
});
