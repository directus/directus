---
layout: default
permalink: /upgrade-to-1.0.0/
title: Upgrade to 1.0.0
---

# Upgrade to 1.0.0

While version 1.0.0 is largely backwards compatible from earlier versions in every 
day usage, some parts require a different boostrapping.

## Relocated Adapters

In order to have better dependency management, and to remove some of the
version contstraints, some of the adapters have been moved out of the main
repository. These adapters are:

* [AwsS3: AWS SDK V2 Adapter](/adapter/aws-s3-v2/)
* [AwsS3V3: AWS SDK V3 Adapter](/adapter/aws-s3-v3/)
* [Dropbox](/adapter/dropbox/)
* [Rackspace](/adapter/rackspace/)
* [GridFS](/adapter/gridfs/)
* [Sftp](/adapter/sftp/)
* [WebDAV](/adapter/webdav/)
* [ZipArchive](/adapter/zip-archive/)

##  Caching

Caching has been removed from the main Filesystem class and is now implemented
as an adapter decorator.

### Version 0.x

~~~ php
$filesystem = new Filesystem($adapter, $cacheAdapter);
~~~

### Version 1.0.0

Install the required adapter decorator:

~~~ bash
composer require league/flysystem-cached-adapter
~~~

And convert the bootstrapping to:

~~~ php
use League\Flysystem\Adapter\Local;
use League\Flysystem\Cached\CachedAdapter;

$decoratedAdapter = new CachedAdapter($adapter, $cacheAdapter);
$filesystem = new Filesystem($decoratedAdapter);
~~~

## Helper Methods

In order to clean up the Filsystem class, some helper functions have been moved to plugins.

* ListWith
* ListPaths
* ListFiles
* GetWithMetadata
* EmptyDir (new)


