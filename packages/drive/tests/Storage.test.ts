import Storage from '../src/Storage';

describe('Storage Class', () => {
	it('throws on all methods', async () => {
		class DumbStorage extends Storage {}

		const driver = new DumbStorage();

		expect(() => driver.append('location', 'content')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method append is not supported for the driver DumbStorage'
		);
		expect(() => driver.copy('src', 'desyt')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method copy is not supported for the driver DumbStorage'
		);
		expect(() => driver.delete('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method delete is not supported for the driver DumbStorage'
		);
		expect(() => driver.driver()).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method driver is not supported for the driver DumbStorage'
		);
		expect(() => driver.exists('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method exists is not supported for the driver DumbStorage'
		);
		expect(() => driver.get('location', 'encoding')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method get is not supported for the driver DumbStorage'
		);
		expect(() => driver.getBuffer('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method getBuffer is not supported for the driver DumbStorage'
		);
		expect(() => driver.getSignedUrl('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method getSignedUrl is not supported for the driver DumbStorage'
		);
		expect(() => driver.getStat('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method getStat is not supported for the driver DumbStorage'
		);
		expect(() => driver.getStream('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method getStream is not supported for the driver DumbStorage'
		);
		expect(() => driver.getUrl('location')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method getUrl is not supported for the driver DumbStorage'
		);
		expect(() => driver.move('src', 'dst')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method move is not supported for the driver DumbStorage'
		);
		expect(() => driver.put('location', 'content')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method put is not supported for the driver DumbStorage'
		);
		expect(() => driver.prepend('location', 'content')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method prepend is not supported for the driver DumbStorage'
		);
		expect(() => driver.flatList('prefix')).toThrow(
			'E_METHOD_NOT_SUPPORTED: Method flatList is not supported for the driver DumbStorage'
		);
	});
});
