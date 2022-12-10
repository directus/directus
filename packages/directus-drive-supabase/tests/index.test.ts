import { StorageManager } from '@directus/drive';
import { SupabaseStorage, SupabaseStorageConfig } from '../src';
import { describe, it, expect } from 'vitest';

describe('drive', function () {
	it('Instantiate', function () {
		const storage = new StorageManager({
			default: 'supabase',
			disks: {
				remote: {
					driver: 'supabase',
					config: {
						bucket: 'bucket',
						endpoint: 'endpoint',
						secret: 'secret',
					} as SupabaseStorageConfig,
				},
			},
		});

		storage.registerDriver('supabase', SupabaseStorage);

		const disk = storage.disk('remote');
		expect(disk).toBeInstanceOf(SupabaseStorage);
	});
});
