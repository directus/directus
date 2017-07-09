---
layout: default
permalink: /creating-an-adapter/
title: Creating an adapter
---

# Creating an adapter

If you want to address a file system, and there's no
adapter available, you'll need to create your own.

## What is an adapter

An adapter can be seen as a plug - it bridges the gap
between initially incompatible API's. The job of the adapter
is to translate requests into calls the file system
understands and re-format responses to comply with
the interface of the generic file system.

An adapter should __NEVER__ be used directly. It should
__ONLY__ be used to create a `League\Flysystem\FilesystemInterface`
implementation instance.

## The main interface to implement

An adapter is required to be an implementation of
`League\Flysystem\AdapterInterface`. This interface
dictates all the methods that need to be implemented.
The interface of an adapter is similar to the
`League\Flysystem\FilesystemInterface`, the method
names are the same, but the response is often different.

Responses from adapters are often arrays containing the
requested value. This is done because many calls to 
file systems return more values than initially requested
by the client. In order to be able to optimize file system
handling, all metadata is returned. For instance, when a
`listContents` call not only returns the paths, but also
timestamps or other related metadata, this information is
not lost. This information is returned through metadata, allowing
caching decorators to pick it up, and store for further use.

### Response values

key         | description              | type
----------- | ------------------------ | -----------
type        | `file` or `dir`          | `string`
path        | path to the file or dir  | `string`
contents    | file contents            | `string`
stream      | file contents            | `resource`
visibility  | `public` or `private`    | `string`
timestamp   | modified time            | `integer`

## Sharing the wealth

Have you created an adapter? Be sure to let us know!
Either create an issue on the GitHub repository, or
send a PR adding a link to the README. Contributions
are always very welcome.
