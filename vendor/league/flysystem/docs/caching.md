---
layout: default
permalink: /caching/
title: Caching
---

# Caching

File system I/O is slow, so Flysystem uses cached file system meta-data to boost performance. When your application needs to scale you can also choose to use a (shared) persistent caching solution for this.
Or enable a per request caching (recommended).

## Installing the adapter cache decorator

~~~bash
composer require league/flysystem-cached-adapter
~~~

This package supplies an Adapter decorator which acts as a caching proxy.

The CachedAdapter (the decorator) caches anything but the file contents. This keeps the cache small enough to be beneficial and covers all the file system inspection operations.

## Memory Caching

The easiest way to boost the performance of Flysystem is to add Memory caching.
This type of caching will cache everything in the lifetime of the current process (cli-job or http-request).
Setting it up is easy:

~~~ php
use League\Flysystem\Filesystem;
use League\Flysystem\Adapter\Local as Adapter;
use League\Flysystem\Cached\CachedAdapter;
use League\Flysystem\Cached\Storage\Memory as MemoryStore;

// Create the adapter
$localAdapter = new Local('/path/to/root');

// Create the cache store
$cacheStore = new MemoryStore();

// Decorate the adapter
$adapter = new CachedAdapter($localAdapter, $cacheStore);

// And use that to create the file system
$filesystem = new Filesystem($adapter);
~~~

You can now use the file system as you would have before, but caching will be done for you on the fly.

## Persistent Caching

The following examples demonstrate how you can setup persistent meta-data caching:

## Predis Caching Setup

~~~ php
use League\Flysystem\Filesystem;
use League\Flysystem\Adapter\Local as Adapter;
use League\Flysystem\Cached\CachedAdapter;
use League\Flysystem\Cached\Storage\Predis as PredisStore;

$adapter = new CachedAdapter(new Adapter(__DIR__.'/path/to/root'), new PredisStore);
$filesystem = new Filesystem($adapter);

// Or supply a client
$client = new Predis\Client;
$adapter = new CachedAdapter(new Adapter(__DIR__.'/path/to/root'), new PredisStore($client));
$filesystem = new Filesystem($adapter);
~~~

## Memcached Caching Setup

~~~ php
use League\Flysystem\Filesystem;
use League\Flysystem\Adapter\Local as Adapter;
use League\Flysystem\Cached\CachedAdapter;
use League\Flysystem\Cached\Storage\Memcached as MemcachedStore;

$memcached = new Memcached;
$memcached->addServer('localhost', 11211);

$adapter = new CachedAdapter(
    new Adapter(__DIR__.'/path/to/root'),
    new MemcachedStore($memcached, 'storageKey', 300)
);
$filesystem = new Filesystem($adapter);
// Storage Key and expire time are optional
~~~

## Adapter Caching Setup

~~~ php
use Dropbox\Client;
use League\Flysystem\Filesystem;
use League\Flysystem\Adapter\Dropbox;
use League\Flysystem\Adapter\Local;
use League\Flysystem\Cached\CachedAdapter;
use League\Flysystem\Cached\Storage\Adapter;

$client = new Client('token', 'app');
$dropbox = new Dropbox($client, 'prefix');

$local = new Local('path');
$cache = new Adapter($local, 'file', 300);
$adapter = new CachedAdapter($dropbox, $cache);
$filesystem = new Filesystem($adapter);
~~~

## Stash Caching Setup

~~~ php
use Stash\Pool;
use League\Flysystem\Adapter\Local as Adapter;
use League\Flysystem\Cached\CachedAdapter;
use League\Flysystem\Cached\Storage\Stash as StashStore;

$pool = new Pool();
// you can optionally pass a driver (recommended, default: in-memory driver)

$cache = new StashStore($pool, 'storageKey', 300);
// Storage Key and expire time are optional

$adapter = new CachedAdapter(new Adapter(__DIR__.'/path/to/root'), $cache);
$filesystem = new Filesystem($adapter);
~~~

For list of drivers and configuration options check their [documentation](http://www.stashphp.com/Drivers.html).
