---
layout: default
permalink: /performance/
title: API
---

# Performance

Flysystem aims to be as reliable as possible. In some cases this means doing extra
checks to make sure the outcome will be as expected. For some adapter this means Flysystem
will make extra calls to assert whether or not a file exists. This improves the reliability
but also impacts performance. You can opt out of this behaviour.

~~~ php
use League\Flysystem\Config;
use League\Flysystem\Filesystem;

$local = new Filesystem($localAdapter, new Config([
    'disable_asserts' => true,
]));
~~~

This will disable the asserts which happen before the following calls: write, writeStream, update,
updateStream, copy (2x), and delete.

This functionality is available since `1.0.26`.
