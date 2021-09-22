import { StorageManager } from '@directus/drive';
import { AzureBlobWebServicesStorage } from '../src';

describe('drive', function () {
	it('Instantiate', function () {
		const storage = new StorageManager({
			default: 'azure',
			disks: {
				remote: {
					driver: 'azure',
					config: {
						containerName: 'containerName',
						accountName: 'accountName',
						accountKey: 'accountKey',
						endpoint: 'http://localhost/accountName',
						root: '/',
					},
				},
			},
		});

		storage.registerDriver('azure', AzureBlobWebServicesStorage);

		const disk = storage.disk('remote');
		expect(disk).toBeInstanceOf(AzureBlobWebServicesStorage);
	});
});
