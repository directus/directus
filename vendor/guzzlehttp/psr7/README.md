# PSR-7 Message Implementation

This repository contains a full [PSR-7](http://www.php-fig.org/psr/psr-7/)
message implementation, several stream decorators, and some helpful
functionality like query string parsing.


[![Build Status](https://travis-ci.org/guzzle/psr7.svg?branch=master)](https://travis-ci.org/guzzle/psr7)


# Stream implementation

This package comes with a number of stream implementations and stream
decorators.


## AppendStream

`GuzzleHttp\Psr7\AppendStream`

Reads from multiple streams, one after the other.

```php
use GuzzleHttp\Psr7;

$a = Psr7\stream_for('abc, ');
$b = Psr7\stream_for('123.');
$composed = new Psr7\AppendStream([$a, $b]);

$composed->addStream(Psr7\stream_for(' Above all listen to me'));

echo $composed; // abc, 123. Above all listen to me.
```


## BufferStream

`GuzzleHttp\Psr7\BufferStream`

Provides a buffer stream that can be written to fill a buffer, and read
from to remove bytes from the buffer.

This stream returns a "hwm" metadata value that tells upstream consumers
what the configured high water mark of the stream is, or the maximum
preferred size of the buffer.

```php
use GuzzleHttp\Psr7;

// When more than 1024 bytes are in the buffer, it will begin returning
// false to writes. This is an indication that writers should slow down.
$buffer = new Psr7\BufferStream(1024);
```


## CachingStream

The CachingStream is used to allow seeking over previously read bytes on
non-seekable streams. This can be useful when transferring a non-seekable
entity body fails due to needing to rewind the stream (for example, resulting
from a redirect). Data that is read from the remote stream will be buffered in
a PHP temp stream so that previously read bytes are cached first in memory,
then on disk.

```php
use GuzzleHttp\Psr7;

$original = Psr7\stream_for(fopen('http://www.google.com', 'r'));
$stream = new Psr7\CachingStream($original);

$stream->read(1024);
echo $stream->tell();
// 1024

$stream->seek(0);
echo $stream->tell();
// 0
```


## DroppingStream

`GuzzleHttp\Psr7\DroppingStream`

Stream decorator that begins dropping data once the size of the underlying
stream becomes too full.

```php
use GuzzleHttp\Psr7;

// Create an empty stream
$stream = Psr7\stream_for();

// Start dropping data when the stream has more than 10 bytes
$dropping = new Psr7\DroppingStream($stream, 10);

$dropping->write('01234567890123456789');
echo $stream; // 0123456789
```


## FnStream

`GuzzleHttp\Psr7\FnStream`

Compose stream implementations based on a hash of functions.

Allows for easy testing and extension of a provided stream without needing
to create a concrete class for a simple extension point.

```php

use GuzzleHttp\Psr7;

$stream = Psr7\stream_for('hi');
$fnStream = Psr7\FnStream::decorate($stream, [
    'rewind' => function () use ($stream) {
        echo 'About to rewind - ';
        $stream->rewind();
        echo 'rewound!';
    }
]);

$fnStream->rewind();
// Outputs: About to rewind - rewound!
```


## InflateStream

`GuzzleHttp\Psr7\InflateStream`

Uses PHP's zlib.inflate filter to inflate deflate or gzipped content.

This stream decorator skips the first 10 bytes of the given stream to remove
the gzip header, converts the provided stream to a PHP stream resource,
then appends the zlib.inflate filter. The stream is then converted back
to a Guzzle stream resource to be used as a Guzzle stream.


## LazyOpenStream

`GuzzleHttp\Psr7\LazyOpenStream`

Lazily reads or writes to a file that is opened only after an IO operation
take place on the stream.

```php
use GuzzleHttp\Psr7;

$stream = new Psr7\LazyOpenStream('/path/to/file', 'r');
// The file has not yet been opened...

echo $stream->read(10);
// The file is opened and read from only when needed.
```


## LimitStream

`GuzzleHttp\Psr7\LimitStream`

LimitStream can be used to read a subset or slice of an existing stream object.
This can be useful for breaking a large file into smaller pieces to be sent in
chunks (e.g. Amazon S3's multipart upload API).

```php
use GuzzleHttp\Psr7;

$original = Psr7\stream_for(fopen('/tmp/test.txt', 'r+'));
echo $original->getSize();
// >>> 1048576

// Limit the size of the body to 1024 bytes and start reading from byte 2048
$stream = new Psr7\LimitStream($original, 1024, 2048);
echo $stream->getSize();
// >>> 1024
echo $stream->tell();
// >>> 0
```


## MultipartStream

`GuzzleHttp\Psr7\MultipartStream`

Stream that when read returns bytes for a streaming multipart or
multipart/form-data stream.


## NoSeekStream

`GuzzleHttp\Psr7\NoSeekStream`

NoSeekStream wraps a stream and does not allow seeking.

```php
use GuzzleHttp\Psr7;

$original = Psr7\stream_for('foo');
$noSeek = new Psr7\NoSeekStream($original);

echo $noSeek->read(3);
// foo
var_export($noSeek->isSeekable());
// false
$noSeek->seek(0);
var_export($noSeek->read(3));
// NULL
```


## PumpStream

`GuzzleHttp\Psr7\PumpStream`

Provides a read only stream that pumps data from a PHP callable.

When invoking the provided callable, the PumpStream will pass the amount of
data requested to read to the callable. The callable can choose to ignore
this value and return fewer or more bytes than requested. Any extra data
returned by the provided callable is buffered internally until drained using
the read() function of the PumpStream. The provided callable MUST return
false when there is no more data to read.


## Implementing stream decorators

Creating a stream decorator is very easy thanks to the
`GuzzleHttp\Psr7\StreamDecoratorTrait`. This trait provides methods that
implement `Psr\Http\Message\StreamInterface` by proxying to an underlying
stream. Just `use` the `StreamDecoratorTrait` and implement your custom
methods.

For example, let's say we wanted to call a specific function each time the last
byte is read from a stream. This could be implemented by overriding the
`read()` method.

```php
use Psr\Http\Message\StreamInterface;
use GuzzleHttp\Psr7\StreamDecoratorTrait;

class EofCallbackStream implements StreamInterface
{
    use StreamDecoratorTrait;

    private $callback;

    public function __construct(StreamInterface $stream, callable $cb)
    {
        $this->stream = $stream;
        $this->callback = $cb;
    }

    public function read($length)
    {
        $result = $this->stream->read($length);

        // Invoke the callback when EOF is hit.
        if ($this->eof()) {
            call_user_func($this->callback);
        }

        return $result;
    }
}
```

This decorator could be added to any existing stream and used like so:

```php
use GuzzleHttp\Psr7;

$original = Psr7\stream_for('foo');

$eofStream = new EofCallbackStream($original, function () {
    echo 'EOF!';
});

$eofStream->read(2);
$eofStream->read(1);
// echoes "EOF!"
$eofStream->seek(0);
$eofStream->read(3);
// echoes "EOF!"
```


## PHP StreamWrapper

You can use the `GuzzleHttp\Psr7\StreamWrapper` class if you need to use a
PSR-7 stream as a PHP stream resource.

Use the `GuzzleHttp\Psr7\StreamWrapper::getResource()` method to create a PHP
stream from a PSR-7 stream.

```php
use GuzzleHttp\Psr7\StreamWrapper;

$stream = GuzzleHttp\Psr7\stream_for('hello!');
$resource = StreamWrapper::getResource($stream);
echo fread($resource, 6); // outputs hello!
```


# Function API

There are various functions available under the `GuzzleHttp\Psr7` namespace.


## `function str`

`function str(MessageInterface $message)`

Returns the string representation of an HTTP message.

```php
$request = new GuzzleHttp\Psr7\Request('GET', 'http://example.com');
echo GuzzleHttp\Psr7\str($request);
```


## `function uri_for`

`function uri_for($uri)`

This function accepts a string or `Psr\Http\Message\UriInterface` and returns a
UriInterface for the given value. If the value is already a `UriInterface`, it
is returned as-is.

```php
$uri = GuzzleHttp\Psr7\uri_for('http://example.com');
assert($uri === GuzzleHttp\Psr7\uri_for($uri));
```


## `function stream_for`

`function stream_for($resource = '', array $options = [])`

Create a new stream based on the input type.

Options is an associative array that can contain the following keys:

* - metadata: Array of custom metadata.
* - size: Size of the stream.

This method accepts the following `$resource` types:

- `Psr\Http\Message\StreamInterface`: Returns the value as-is.
- `string`: Creates a stream object that uses the given string as the contents.
- `resource`: Creates a stream object that wraps the given PHP stream resource.
- `Iterator`: If the provided value implements `Iterator`, then a read-only
  stream object will be created that wraps the given iterable. Each time the
  stream is read from, data from the iterator will fill a buffer and will be
  continuously called until the buffer is equal to the requested read size.
  Subsequent read calls will first read from the buffer and then call `next`
  on the underlying iterator until it is exhausted.
- `object` with `__toString()`: If the object has the `__toString()` method,
  the object will be cast to a string and then a stream will be returned that
  uses the string value.
- `NULL`: When `null` is passed, an empty stream object is returned.
- `callable` When a callable is passed, a read-only stream object will be
  created that invokes the given callable. The callable is invoked with the
  number of suggested bytes to read. The callable can return any number of
  bytes, but MUST return `false` when there is no more data to return. The
  stream object that wraps the callable will invoke the callable until the
  number of requested bytes are available. Any additional bytes will be
  buffered and used in subsequent reads.

```php
$stream = GuzzleHttp\Psr7\stream_for('foo');
$stream = GuzzleHttp\Psr7\stream_for(fopen('/path/to/file', 'r'));

$generator function ($bytes) {
    for ($i = 0; $i < $bytes; $i++) {
        yield ' ';
    }
}

$stream = GuzzleHttp\Psr7\stream_for($generator(100));
```


## `function parse_header`

`function parse_header($header)`

Parse an array of header values containing ";" separated data into an array of
associative arrays representing the header key value pair data of the header.
When a parameter does not contain a value, but just contains a key, this
function will inject a key with a '' string value.


## `function normalize_header`

`function normalize_header($header)`

Converts an array of header values that may contain comma separated headers
into an array of headers with no comma separated values.


## `function modify_request`

`function modify_request(RequestInterface $request, array $changes)`

Clone and modify a request with the given changes. This method is useful for
reducing the number of clones needed to mutate a message.

The changes can be one of:

- method: (string) Changes the HTTP method.
- set_headers: (array) Sets the given headers.
- remove_headers: (array) Remove the given headers.
- body: (mixed) Sets the given body.
- uri: (UriInterface) Set the URI.
- query: (string) Set the query string value of the URI.
- version: (string) Set the protocol version.


## `function rewind_body`

`function rewind_body(MessageInterface $message)`

Attempts to rewind a message body and throws an exception on failure. The body
of the message will only be rewound if a call to `tell()` returns a value other
than `0`.


## `function try_fopen`

`function try_fopen($filename, $mode)`

Safely opens a PHP stream resource using a filename.

When fopen fails, PHP normally raises a warning. This function adds an error
handler that checks for errors and throws an exception instead.


## `function copy_to_string`

`function copy_to_string(StreamInterface $stream, $maxLen = -1)`

Copy the contents of a stream into a string until the given number of bytes
have been read.


## `function copy_to_stream`

`function copy_to_stream(StreamInterface $source, StreamInterface $dest, $maxLen = -1)`

Copy the contents of a stream into another stream until the given number of
bytes have been read.


## `function hash`

`function hash(StreamInterface $stream, $algo, $rawOutput = false)`

Calculate a hash of a Stream. This method reads the entire stream to calculate
a rolling hash (based on PHP's hash_init functions).


## `function readline`

`function readline(StreamInterface $stream, $maxLength = null)`

Read a line from the stream up to the maximum allowed buffer length.


## `function parse_request`

`function parse_request($message)`

Parses a request message string into a request object.


## `function parse_response`

`function parse_response($message)`

Parses a response message string into a response object.


## `function parse_query`

`function parse_query($str, $urlEncoding = true)`

Parse a query string into an associative array.

If multiple values are found for the same key, the value of that key value pair
will become an array. This function does not parse nested PHP style arrays into
an associative array (e.g., `foo[a]=1&foo[b]=2` will be parsed into
`['foo[a]' => '1', 'foo[b]' => '2']`).


## `function build_query`

`function build_query(array $params, $encoding = PHP_QUERY_RFC3986)`

Build a query string from an array of key value pairs.

This function can use the return value of parse_query() to build a query string.
This function does not modify the provided keys when an array is encountered
(like http_build_query would).


## `function mimetype_from_filename`

`function mimetype_from_filename($filename)`

Determines the mimetype of a file by looking at its extension.


## `function mimetype_from_extension`

`function mimetype_from_extension($extension)`

Maps a file extensions to a mimetype.


# Additional URI Methods

Aside from the standard `Psr\Http\Message\UriInterface` implementation in form of the `GuzzleHttp\Psr7\Uri` class,
this library also provides additional functionality when working with URIs as static methods.

## URI Types

An instance of `Psr\Http\Message\UriInterface` can either be an absolute URI or a relative reference.
An absolute URI has a scheme. A relative reference is used to express a URI relative to another URI,
the base URI. Relative references can be divided into several forms according to
[RFC 3986 Section 4.2](https://tools.ietf.org/html/rfc3986#section-4.2):

- network-path references, e.g. `//example.com/path`
- absolute-path references, e.g. `/path`
- relative-path references, e.g. `subpath`

The following methods can be used to identify the type of the URI.

### `GuzzleHttp\Psr7\Uri::isAbsolute`

`public static function isAbsolute(UriInterface $uri): bool`

Whether the URI is absolute, i.e. it has a scheme.

### `GuzzleHttp\Psr7\Uri::isNetworkPathReference`

`public static function isNetworkPathReference(UriInterface $uri): bool`

Whether the URI is a network-path reference. A relative reference that begins with two slash characters is
termed an network-path reference.

### `GuzzleHttp\Psr7\Uri::isAbsolutePathReference`

`public static function isAbsolutePathReference(UriInterface $uri): bool`

Whether the URI is a absolute-path reference. A relative reference that begins with a single slash character is
termed an absolute-path reference.

### `GuzzleHttp\Psr7\Uri::isRelativePathReference`

`public static function isRelativePathReference(UriInterface $uri): bool`

Whether the URI is a relative-path reference. A relative reference that does not begin with a slash character is
termed a relative-path reference.

### `GuzzleHttp\Psr7\Uri::isSameDocumentReference`

`public static function isSameDocumentReference(UriInterface $uri, UriInterface $base = null): bool`

Whether the URI is a same-document reference. A same-document reference refers to a URI that is, aside from its
fragment component, identical to the base URI. When no base URI is given, only an empty URI reference
(apart from its fragment) is considered a same-document reference.

## URI Components

Additional methods to work with URI components.

### `GuzzleHttp\Psr7\Uri::isDefaultPort`

`public static function isDefaultPort(UriInterface $uri): bool`

Whether the URI has the default port of the current scheme. `Psr\Http\Message\UriInterface::getPort` may return null
or the standard port. This method can be used independently of the implementation.

### `GuzzleHttp\Psr7\Uri::composeComponents`

`public static function composeComponents($scheme, $authority, $path, $query, $fragment): string`

Composes a URI reference string from its various components according to
[RFC 3986 Section 5.3](https://tools.ietf.org/html/rfc3986#section-5.3). Usually this method does not need to be called
manually but instead is used indirectly via `Psr\Http\Message\UriInterface::__toString`.

### `GuzzleHttp\Psr7\Uri::fromParts`

`public static function fromParts(array $parts): UriInterface`

Creates a URI from a hash of [`parse_url`](http://php.net/manual/en/function.parse-url.php) components.


### `GuzzleHttp\Psr7\Uri::withQueryValue`

`public static function withQueryValue(UriInterface $uri, $key, $value): UriInterface`

Creates a new URI with a specific query string value. Any existing query string values that exactly match the
provided key are removed and replaced with the given key value pair. A value of null will set the query string
key without a value, e.g. "key" instead of "key=value".


### `GuzzleHttp\Psr7\Uri::withoutQueryValue`

`public static function withoutQueryValue(UriInterface $uri, $key): UriInterface`

Creates a new URI with a specific query string value removed. Any existing query string values that exactly match the
provided key are removed.

## Reference Resolution

`GuzzleHttp\Psr7\UriResolver` provides methods to resolve a URI reference in the context of a base URI according
to [RFC 3986 Section 5](https://tools.ietf.org/html/rfc3986#section-5). This is for example also what web browsers
do when resolving a link in a website based on the current request URI.

### `GuzzleHttp\Psr7\UriResolver::resolve`

`public static function resolve(UriInterface $base, UriInterface $rel): UriInterface`

Converts the relative URI into a new URI that is resolved against the base URI.

### `GuzzleHttp\Psr7\UriResolver::removeDotSegments`

`public static function removeDotSegments(string $path): string`

Removes dot segments from a path and returns the new path according to
[RFC 3986 Section 5.2.4](https://tools.ietf.org/html/rfc3986#section-5.2.4).

### `GuzzleHttp\Psr7\UriResolver::relativize`

`public static function relativize(UriInterface $base, UriInterface $target): UriInterface`

Returns the target URI as a relative reference from the base URI. This method is the counterpart to resolve():

```php
(string) $target === (string) UriResolver::resolve($base, UriResolver::relativize($base, $target))
```

One use-case is to use the current request URI as base URI and then generate relative links in your documents
to reduce the document size or offer self-contained downloadable document archives.

```php
$base = new Uri('http://example.com/a/b/');
echo UriResolver::relativize($base, new Uri('http://example.com/a/b/c'));  // prints 'c'.
echo UriResolver::relativize($base, new Uri('http://example.com/a/x/y'));  // prints '../x/y'.
echo UriResolver::relativize($base, new Uri('http://example.com/a/b/?q')); // prints '?q'.
echo UriResolver::relativize($base, new Uri('http://example.org/a/b/'));   // prints '//example.org/a/b/'.
```

## Normalization and Comparison

`GuzzleHttp\Psr7\UriNormalizer` provides methods to normalize and compare URIs according to
[RFC 3986 Section 6](https://tools.ietf.org/html/rfc3986#section-6).

### `GuzzleHttp\Psr7\UriNormalizer::normalize`

`public static function normalize(UriInterface $uri, $flags = self::PRESERVING_NORMALIZATIONS): UriInterface`

Returns a normalized URI. The scheme and host component are already normalized to lowercase per PSR-7 UriInterface.
This methods adds additional normalizations that can be configured with the `$flags` parameter which is a bitmask
of normalizations to apply. The following normalizations are available:

- `UriNormalizer::PRESERVING_NORMALIZATIONS`

    Default normalizations which only include the ones that preserve semantics.

- `UriNormalizer::CAPITALIZE_PERCENT_ENCODING`

    All letters within a percent-encoding triplet (e.g., "%3A") are case-insensitive, and should be capitalized.

    Example: `http://example.org/a%c2%b1b` → `http://example.org/a%C2%B1b`

- `UriNormalizer::DECODE_UNRESERVED_CHARACTERS`

    Decodes percent-encoded octets of unreserved characters. For consistency, percent-encoded octets in the ranges of
    ALPHA (%41–%5A and %61–%7A), DIGIT (%30–%39), hyphen (%2D), period (%2E), underscore (%5F), or tilde (%7E) should
    not be created by URI producers and, when found in a URI, should be decoded to their corresponding unreserved
    characters by URI normalizers.

    Example: `http://example.org/%7Eusern%61me/` → `http://example.org/~username/`

- `UriNormalizer::CONVERT_EMPTY_PATH`

    Converts the empty path to "/" for http and https URIs.

    Example: `http://example.org` → `http://example.org/`

- `UriNormalizer::REMOVE_DEFAULT_HOST`

    Removes the default host of the given URI scheme from the URI. Only the "file" scheme defines the default host
    "localhost". All of `file:/myfile`, `file:///myfile`, and `file://localhost/myfile` are equivalent according to
    RFC 3986.

    Example: `file://localhost/myfile` → `file:///myfile`

- `UriNormalizer::REMOVE_DEFAULT_PORT`

    Removes the default port of the given URI scheme from the URI.

    Example: `http://example.org:80/` → `http://example.org/`

- `UriNormalizer::REMOVE_DOT_SEGMENTS`

    Removes unnecessary dot-segments. Dot-segments in relative-path references are not removed as it would
    change the semantics of the URI reference.

    Example: `http://example.org/../a/b/../c/./d.html` → `http://example.org/a/c/d.html`

- `UriNormalizer::REMOVE_DUPLICATE_SLASHES`

    Paths which include two or more adjacent slashes are converted to one. Webservers usually ignore duplicate slashes
    and treat those URIs equivalent. But in theory those URIs do not need to be equivalent. So this normalization
    may change the semantics. Encoded slashes (%2F) are not removed.

    Example: `http://example.org//foo///bar.html` → `http://example.org/foo/bar.html`

- `UriNormalizer::SORT_QUERY_PARAMETERS`

    Sort query parameters with their values in alphabetical order. However, the order of parameters in a URI may be
    significant (this is not defined by the standard). So this normalization is not safe and may change the semantics
    of the URI.

    Example: `?lang=en&article=fred` → `?article=fred&lang=en`

### `GuzzleHttp\Psr7\UriNormalizer::isEquivalent`

`public static function isEquivalent(UriInterface $uri1, UriInterface $uri2, $normalizations = self::PRESERVING_NORMALIZATIONS): bool`

Whether two URIs can be considered equivalent. Both URIs are normalized automatically before comparison with the given
`$normalizations` bitmask. The method also accepts relative URI references and returns true when they are equivalent.
This of course assumes they will be resolved against the same base URI. If this is not the case, determination of
equivalence or difference of relative references does not mean anything.
