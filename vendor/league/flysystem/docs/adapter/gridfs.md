---
layout: default
permalink: /adapter/gridfs/
title: GridFS Adapter
---

# GridFS Adapter

## Installation

~~~ bash
composer require league/flysystem-gridfs
~~~

## Usage

~~~ php
use League\Flysystem\GridFS\GridFSAdapter;
use League\Flysystem\Filesystem;

$mongoClient = new MongoClient();
$gridFs = $mongoClient->selectDB('db_name')->getGridFS();

$adapter = new GridFSAdapter($gridFs);
$filesystem = new Filesystem($adapter);
~~~
