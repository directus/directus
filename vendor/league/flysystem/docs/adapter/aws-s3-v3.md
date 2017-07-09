---
layout: default
permalink: /adapter/aws-s3-v3/
title: Aws S3 Adapter V3
---

# Aws S3 Adapter - SDK V3

## Installation

~~~ bash
composer require league/flysystem-aws-s3-v3
~~~

## Usage

~~~ php
use Aws\S3\S3Client;
use League\Flysystem\AwsS3v3\AwsS3Adapter;
use League\Flysystem\Filesystem;

$client = S3Client::factory([
    'credentials' => [
        'key'    => 'your-key',
        'secret' => 'your-secret',
    ],
    'region' => 'your-region',
    'version' => 'latest|version',
]);

$adapter = new AwsS3Adapter($client, 'your-bucket-name', 'optional/path/prefix');
~~~
