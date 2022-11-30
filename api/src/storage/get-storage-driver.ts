import { LocalFileSystemStorage } from '@directus/drive';
import { AzureBlobWebServicesStorage } from '@directus/drive-azure';
import { GoogleCloudStorage } from '@directus/drive-gcs';
import { AmazonWebServicesS3Storage } from '@directus/drive-s3';
import { CloudinaryStorage } from '@directus/drive-cloudinary';

export const getStorageDriver = (driver: string) => {
	switch (driver) {
		case 'local':
			return LocalFileSystemStorage;
		case 's3':
			return AmazonWebServicesS3Storage;
		case 'gcs':
			return GoogleCloudStorage;
		case 'azure':
			return AzureBlobWebServicesStorage;
		case 'cloudinary':
			return CloudinaryStorage;
	}
};
