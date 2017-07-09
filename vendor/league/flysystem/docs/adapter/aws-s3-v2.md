---
layout: default
permalink: /adapter/aws-s3-v2/
title: Aws S3 Adapter V2
---

# Aws S3 Adapter - SDK V2

## Installation

~~~ bash
composer require league/flysystem-aws-s3-v2
~~~

## Usage

~~~ php
use Aws\S3\S3Client;
use League\Flysystem\AwsS3v2\AwsS3Adapter;
use League\Flysystem\Filesystem;

$client = S3Client::factory([
    'key'    => '[your key]',
    'secret' => '[your secret]',
    'region' => '[aws-region]',
]);

$adapter = new AwsS3Adapter($client, 'bucket-name', 'optional/path/prefix');

$filesystem = new Filesystem($adapter);
~~~

To enable [reduced redunancy storage](http://aws.amazon.com/s3/details/#RRS) set up your adapter like so:

~~~ php
$adapter = new AwsS3Adapter($client, 'bucket-name', 'optional/path/prefix', [
    'StorageClass'  =>  'REDUCED_REDUNDANCY',
]);
~~~

### Compatible storage protocols

If you're using a storage service which implements the S3 protocols, you can set the `base_url` configuration option when constructing the client.

~~~ php
$client = S3Client::factory([
    'base_url' => 'http://some.other.endpoint',
    // ... other settings
]);
~~~

Known compliant storage providers are:

* [Google Cloud Storage](https://cloud.google.com/storage/docs/migrating#migration-simple)
* Know more? Please submit a PR!
