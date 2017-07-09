---
layout: default
permalink: /adapter/null-test/
title: Null Adapter
---

# Null Adapter

## Installation

Comes with the main Flysystem package.

## Usage

Acts like `/dev/null`

~~~ php
$adapter = new League\Flysystem\Adapter\NullAdapter;
$filesystem = new League\Flysystem\Filesystem($adapter);
~~~
