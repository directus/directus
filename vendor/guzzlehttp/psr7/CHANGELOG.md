# CHANGELOG

## 1.4.2 - 2017-03-20

* Reverted BC break to `Uri::resolve` and `Uri::removeDotSegments` by removing 
  calls to `trigger_error` when deprecated methods are invoked.

## 1.4.1 - 2017-02-27

* Reverted BC break by reintroducing behavior to automagically fix a URI with a
  relative path and an authority by adding a leading slash to the path. It's only
  deprecated now.
* Added triggering of silenced deprecation warnings.

## 1.4.0 - 2017-02-21

* Fix `Stream::read` when length parameter <= 0.
* `copy_to_stream` reads bytes in chunks instead of `maxLen` into memory.
* Fix `ServerRequest::getUriFromGlobals` when `Host` header contains port.
* Ensure `ServerRequest::getUriFromGlobals` returns a URI in absolute form.
* Allow `parse_response` to parse a response without delimiting space and reason.
* Ensure each URI modification results in a valid URI according to PSR-7 discussions.
  Invalid modifications will throw an exception instead of returning a wrong URI or
  doing some magic.
  - `(new Uri)->withPath('foo')->withHost('example.com')` will throw an exception
    because the path of a URI with an authority must start with a slash "/" or be empty
  - `(new Uri())->withScheme('http')` will return `'http://localhost'`
* Fix compatibility of URIs with `file` scheme and empty host.
* Added common URI utility methods based on RFC 3986 (see documentation in the readme):
  - `Uri::isDefaultPort`
  - `Uri::isAbsolute`
  - `Uri::isNetworkPathReference`
  - `Uri::isAbsolutePathReference`
  - `Uri::isRelativePathReference`
  - `Uri::isSameDocumentReference`
  - `Uri::composeComponents`
  - `UriNormalizer::normalize`
  - `UriNormalizer::isEquivalent`
  - `UriResolver::relativize`
* Deprecated `Uri::resolve` in favor of `UriResolver::resolve`
* Deprecated `Uri::removeDotSegments` in favor of `UriResolver::removeDotSegments`

## 1.3.1 - 2016-06-25

* Fix `Uri::__toString` for network path references, e.g. `//example.org`.
* Fix missing lowercase normalization for host.
* Fix handling of URI components in case they are `'0'` in a lot of places,
  e.g. as a user info password.
* Fix `Uri::withAddedHeader` to correctly merge headers with different case.
* Fix trimming of header values in `Uri::withAddedHeader`. Header values may
  be surrounded by whitespace which should be ignored according to RFC 7230
  Section 3.2.4. This does not apply to header names.
* Fix `Uri::withAddedHeader` with an array of header values.
* Fix `Uri::resolve` when base path has no slash and handling of fragment.
* Fix handling of encoding in `Uri::with(out)QueryValue` so one can pass the
  key/value both in encoded as well as decoded form to those methods. This is
  consistent with withPath, withQuery etc.
* Fix `ServerRequest::withoutAttribute` when attribute value is null.

## 1.3.0 - 2016-04-13

* Added remaining interfaces needed for full PSR7 compatibility
  (ServerRequestInterface, UploadedFileInterface, etc.).
* Added support for stream_for from scalars.
* Can now extend Uri.
* Fixed a bug in validating request methods by making it more permissive.

## 1.2.3 - 2016-02-18

* Fixed support in `GuzzleHttp\Psr7\CachingStream` for seeking forward on remote
  streams, which can sometimes return fewer bytes than requested with `fread`.
* Fixed handling of gzipped responses with FNAME headers.

## 1.2.2 - 2016-01-22

* Added support for URIs without any authority.
* Added support for HTTP 451 'Unavailable For Legal Reasons.'
* Added support for using '0' as a filename.
* Added support for including non-standard ports in Host headers.

## 1.2.1 - 2015-11-02

* Now supporting negative offsets when seeking to SEEK_END.

## 1.2.0 - 2015-08-15

* Body as `"0"` is now properly added to a response.
* Now allowing forward seeking in CachingStream.
* Now properly parsing HTTP requests that contain proxy targets in
  `parse_request`.
* functions.php is now conditionally required.
* user-info is no longer dropped when resolving URIs.

## 1.1.0 - 2015-06-24

* URIs can now be relative.
* `multipart/form-data` headers are now overridden case-insensitively.
* URI paths no longer encode the following characters because they are allowed
  in URIs: "(", ")", "*", "!", "'"
* A port is no longer added to a URI when the scheme is missing and no port is
  present.

## 1.0.0 - 2015-05-19

Initial release.

Currently unsupported:

- `Psr\Http\Message\ServerRequestInterface`
- `Psr\Http\Message\UploadedFileInterface`
