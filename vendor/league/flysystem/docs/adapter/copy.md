---
layout: default
permalink: /adapter/copy/
title: Copy.com Adapter
---

# Copy.com Adapter

## Installation

~~~ bash
composer require league/flysystem-copy
~~~

## Usage

~~~ php
use Barracuda\Copy\API;
use League\Flysystem\Filesystem;
use League\Flysystem\Copy\CopyAdapter;

$client = new API($consumerKey, $consumerSecret, $accessToken, $tokenSecret);
$filesystem = new Filesystem(new CopyAdapter($client, 'optional/path/prefix'));
~~~
