import { Storage } from '@directus/drive';

export default class CustomStorage extends Storage {
	/**
	 * Appends content to a file.
	 */
	append(_location, _content) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Copy a file to a location.
	 */
	copy(_src, _dest) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Delete existing file.
	 * The value returned by this method will have a `wasDeleted` property that
	 * can be either a boolean (`true` if a file was deleted, `false` if there was
	 * no file to delete) or `null` (if no information about the file is available).
	 */
	delete(_location) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns the driver.
	 */
	driver() {
		throw new Error('Function not implemented.');
	}
	/**
	 * Determines if a file or folder already exists.
	 */
	exists(_location) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns the file contents as a string.
	 */
	get(_location, _encoding) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns the file contents as a Buffer.
	 */
	getBuffer(_location) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns signed url for an existing file.
	 */
	getSignedUrl(_location, _options) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns file's size and modification date.
	 */
	getStat(_location) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns the stream for the given file.
	 */
	getStream(_location, _range) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Returns url for a given key. Note this method doesn't
	 * validates the existence of file or it's visibility
	 * status.
	 */
	getUrl(_location) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Move file to a new location.
	 */
	move(_src, _dest) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Creates a new file.
	 * This method will create missing directories on the fly.
	 */
	put(_location, _content, _type) {
		throw new Error('Function not implemented.');
	}
	/**
	 * Prepends content to a file.
	 */
	prepend(_location, _content) {
		throw new Error('Function not implemented.');
	}
	/**
	 * List files with a given prefix.
	 */
	flatList(_prefix) {
		throw new Error('Function not implemented.');
	}
}
