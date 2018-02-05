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

$filesystem = new Filesystem($adapter);
~~~

The required IAM permissions are:

~~~ json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1420044805001",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:ReplicateObject",
                "s3:DeleteObject"                
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
~~~
