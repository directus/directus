import * as drive from '../src';

describe('drive', function () {
	it('Objects should be exported', function () {
		expect(drive.Storage).toBeDefined();
		expect(drive.StorageManager).toBeDefined();
		expect(drive.LocalFileSystemStorage).toBeDefined();
	});
});
