---
layout: default
permalink: /adapter/ftp/
title: FTP Adapter
---

# FTP Adapter

## Installation

Comes with the main Flysystem package.

## Usage

~~~ php
use League\Flysystem\Filesystem;
use League\Flysystem\Adapter\Ftp as Adapter;

$filesystem = new Filesystem(new Adapter([
    'host' => 'ftp.example.com',
    'username' => 'username',
    'password' => 'password',

    /** optional config settings */
    'port' => 21,
    'root' => '/path/to/root',
    'passive' => true,
    'ssl' => true,
    'timeout' => 30,
]));
~~~
