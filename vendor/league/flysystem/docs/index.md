---
layout: default
permalink: /
title: Introduction
---

# Introduction

<span style="float: left; margin: 0 10px 0 0;">
[![SensioLabsInsight](//insight.sensiolabs.com/projects/9820f1af-2fd0-4ab6-b42a-03e0c821e0af/big.png)](//insight.sensiolabs.com/projects/9820f1af-2fd0-4ab6-b42a-03e0c821e0af)
</span>

[![Author](//img.shields.io/badge/author-@frankdejonge-blue.svg?style=flat-square)](//twitter.com/frankdejonge)
[![Source Code](//img.shields.io/badge/source-thephpleague/flysystem-blue.svg?style=flat-square)](//github.com/thephpleague/flysystem)
[![Latest Version](//img.shields.io/github/tag/thephpleague/flysystem.svg?style=flat-square)](//github.com/thephpleague/flysystem/releases)
[![Software License](//img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](//github.com/thephpleague/flysystem/blob/master/LICENSE)
[![Build Status](//img.shields.io/travis/thephpleague/flysystem/master.svg?style=flat-square)](//travis-ci.org/thephpleague/flysystem)
[![HHVM Status](//img.shields.io/hhvm/league/flysystem.svg?style=flat-square)](//hhvm.h4cc.de/package/league/flysystem)
[![Coverage Status](//img.shields.io/scrutinizer/coverage/g/thephpleague/flysystem.svg?style=flat-square)](//scrutinizer-ci.com/g/thephpleague/flysystem/code-structure)
[![Quality Score](//img.shields.io/scrutinizer/g/thephpleague/flysystem.svg?style=flat-square)](//scrutinizer-ci.com/g/thephpleague/flysystem)
[![Total Downloads](//img.shields.io/packagist/dt/league/flysystem.svg?style=flat-square)](//packagist.org/packages/league/flysystem)
![php 5.4+](//img.shields.io/badge/php-min%205.4-red.svg?style=flat-square)

Flysystem is a filesystem abstraction which allows you to easily swap out a local filesystem for a remote one. Technical debt is reduced as is the chance of vendor lock-in.

## Goals

* Have a generic API for handling common tasks across multiple file storage engines.
* Have consistent output which you can rely on.
* Integrate well with other packages/frameworks.
* Be cacheable.
* Emulate directories in systems that support none, like AwsS3.
* Support third party plugins.
* Make it easy to test your filesystem interactions.
* Support streams for big file handling

## Questions?

Flysystem was created by Frank de Jonge, follow him on Twitter for updates: [@frankdejonge](//twitter.com/frankdejonge).

Please submit issues on [Github](//github.com/thephpleague/flysystem).
