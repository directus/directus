---
layout: default
permalink: /core-concepts/
title: Core Concepts
---

# Core Concepts

In order to better understand how and why Flysystem works
the way it does, several concepts require some explanation.

## Overview

* [Adapters](#adapters)
* [Relative Paths](#relative-paths)
* [Files first](#files-first)

## Adapters

The main entry point for the file system API is the
FilesystemInterface. When working with file systems, this is
the class you'll want to be talking to.

Flysystem works the way it does because of its use of the 
adapter pattern. The inconsistencies of the different file 
systems are eliminated in these adapters.

While adapters have a public interface (publicly accessible
methods), they should be considered __internal__.

## Relative Paths

Portability is a very important concept within Flysystem. In order
to roll out this aspect to the fullest, all paths in Flysystem are
relative. File system root paths, whether remote or local, are viewed
as endpoints. Because of this, file systems are movable independently.
This allows parts of the application file handling to move to other
storage types, while the majority is in a centralized location.

Like the storage type, root paths are an implementation detail. When
root paths are defined as configuration, the stability of your code
improves.

## Files First

Flysystem has a files first approach. Storage systems like AWS S3
are linear file systems, this means the path to a file is used as an
identifier, rather than a representation of all the directories it's
nested in.

This means directories are second class citizens. Because of this,
directories will be automatically created on file systems that require
them when writing files. Not only does this make handling writes a lot
easier, it also ensures a consistent behaviors across all file system
types.
