---
layout: default
permalink: /adapter/sftp/
title: SFTP Adapter
---

# SFTP Adapter

## Installation

~~~ bash
composer require league/flysystem-sftp
~~~

## Usage

~~~ php
use League\Flysystem\Filesystem;
use League\Flysystem\Sftp\SftpAdapter;

$filesystem = new Filesystem(new SftpAdapter([
    'host' => 'example.com',
    'port' => 21,
    'username' => 'username',
    'password' => 'password',
    'privateKey' => 'path/to/or/contents/of/privatekey',
    'root' => '/path/to/root',
    'timeout' => 10,
]));
~~~
