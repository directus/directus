import { StorageManager } from '@directus/drive';
import { SupabaseStorage, SupabaseStorageConfig } from '../src';

describe('drive', function () {
	it('Instantiate', function () {
		const storage = new StorageManager({
			default: 'supabase',
			disks: {
				remote: {
					driver: 'supabase',
					config: {
						supabaseUrl: 'url',
						supabaseKey: 'key',
						bucket: 'bucket',
					} as SupabaseStorageConfig,
				},
			},
		});

		storage.registerDriver('supabase', SupabaseStorage);

		const disk = storage.disk('remote');
		expect(disk).toBeInstanceOf(SupabaseStorage);
	});
});
