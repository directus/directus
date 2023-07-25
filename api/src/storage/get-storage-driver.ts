import type { Driver } from '@directus/storage';

export const _aliasMap: Record<string, string> = {
	local: '@directus/storage-driver-local',
	s3: '@directus/storage-driver-s3',
	supabase: '@directus/storage-driver-supabase',
	gcs: '@directus/storage-driver-gcs',
	azure: '@directus/storage-driver-azure',
	cloudinary: '@directus/storage-driver-cloudinary',
};

export const getStorageDriver = async (driverName: string): Promise<typeof Driver> => {
	if (driverName in _aliasMap) {
		driverName = _aliasMap[driverName]!;
	} else {
		throw new Error(`Driver "${driverName}" doesn't exist.`);
	}

	return (await import(driverName)).default;
};
