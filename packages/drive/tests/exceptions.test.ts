import {
	AuthorizationRequired,
	DriverNotSupported,
	InvalidConfig,
	MethodNotSupported,
	NoSuchBucket,
	PermissionMissing,
	UnknownException,
	WrongKeyPath,
} from '../src/exceptions';

describe('AuthorizationRequired', function () {
	it('sets the raw exception object', function () {
		try {
			throw new AuthorizationRequired(new Error('test'), '/some/path');
		} catch (err) {
			expect(err.raw).toBeDefined();
			expect(err.raw.message).toBe('test');
		}
	});
});

describe('DriverNotSupported', function () {
	it('driver should be set', function () {
		try {
			throw DriverNotSupported.driver('alibaba');
		} catch (err) {
			expect(err.driver).toBeDefined();
			expect(err.driver).toBe('alibaba');
		}
	});
});

describe('DriverNotSupported', function () {
	it('driver should be set', function () {
		try {
			throw DriverNotSupported.driver('alibaba');
		} catch (err) {
			expect(err.driver).toBeDefined();
			expect(err.driver).toBe('alibaba');
		}
	});
});

describe('InvalidConfig', function () {
	it('missingDiskName', function () {
		const err = InvalidConfig.missingDiskName();
		expect(err.status).toBe(500);
		expect(err.code).toBe('E_INVALID_CONFIG');
	});

	it('missingDiskConfig', function () {
		const err = InvalidConfig.missingDiskConfig('disk_name');
		expect(err.status).toBe(500);
		expect(err.code).toBe('E_INVALID_CONFIG');
	});

	it('missingDiskDriver', function () {
		const err = InvalidConfig.missingDiskDriver('disk_name');
		expect(err.status).toBe(500);
		expect(err.code).toBe('E_INVALID_CONFIG');
	});

	it('duplicateDiskName', function () {
		const err = InvalidConfig.duplicateDiskName('disk_name');
		expect(err.status).toBe(500);
		expect(err.code).toBe('E_INVALID_CONFIG');
	});
});

describe('MethodNotSupported', function () {
	it('constructor', function () {
		const err = new MethodNotSupported('method', 'driver');
		expect(err.status).toBe(500);
		expect(err.code).toBe('E_METHOD_NOT_SUPPORTED');
	});
});

describe('NoSuchBucket', function () {
	it('constructor', function () {
		try {
			throw new NoSuchBucket(new Error('test'), 'bucket');
		} catch (err) {
			expect(err.raw).toBeDefined();
			expect(err.raw.message).toBe('test');
			expect(err.status).toBe(500);
			expect(err.code).toBe('E_NO_SUCH_BUCKET');
		}
	});
});

describe('PermissionMissing', function () {
	it('constructor', function () {
		try {
			throw new PermissionMissing(new Error('test'), 'bucket');
		} catch (err) {
			expect(err.raw).toBeDefined();
			expect(err.raw.message).toBe('test');
			expect(err.status).toBe(500);
			expect(err.code).toBe('E_PERMISSION_MISSING');
		}
	});
});

describe('UnknownException', function () {
	it('constructor', function () {
		try {
			throw new UnknownException(new Error('test'), 'ERR_CODE', __filename);
		} catch (err) {
			expect(err.raw).toBeDefined();
			expect(err.raw.message).toBe('test');
			expect(err.message).toContain(__filename);
			expect(err.message).toContain('ERR_CODE');
			expect(err.status).toBe(500);
			expect(err.code).toBe('E_UNKNOWN');
		}
	});
});

describe('WrongKeyPath ', function () {
	it('constructor', function () {
		try {
			throw new WrongKeyPath(new Error('test'), 'some/path');
		} catch (err) {
			expect(err.raw).toBeDefined();
			expect(err.raw.message).toBe('test');
			expect(err.message).toContain('some/path');
			expect(err.status).toBe(500);
			expect(err.code).toBe('E_WRONG_KEY_PATH');
		}
	});
});
