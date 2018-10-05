# ContainerInterface Meta Document

## Introduction

This document describes the process and discussions that lead to the `ContainerInterface`.
Its goal is to explain the reasons behind each decision.

## Goal

The goal set by `ContainerInterface` is to standardize how frameworks and libraries make use of a
container to obtain objects and parameters.

By standardizing such a behavior, frameworks and libraries using the `ContainerInterface`
could work with any compatible container.
That would allow end users to choose their own container based on their own preferences.

It is important to distinguish the two usages of a container:

- configuring entries
- fetching entries

Most of the time, those two sides are not used by the same party.
While it is often end users who tend to configure entries, it is generally the framework that fetch
entries to build the application.

This is why this interface focuses only on how entries can be fetched from a container.

## Interface name

The interface name has been thoroughly discussed and was decided by a vote.

The list of options considered with their respective votes are:

- `ContainerInterface`: +8
- `ProviderInterface`: +2
- `LocatorInterface`: 0
- `ReadableContainerInterface`: -5
- `ServiceLocatorInterface`: -6
- `ObjectFactory`: -6
- `ObjectStore`: -8
- `ConsumerInterface`: -9

[Full results of the vote](https://github.com/container-interop/container-interop/wiki/%231-interface-name:-Vote)

The complete discussion can be read in [the issue #1](https://github.com/container-interop/container-interop/issues/1).

## Interface methods

The choice of which methods the interface would contain was made after a statistical analysis of existing containers.
The results of this analysis are available [in this document](https://gist.github.com/mnapoli/6159681).

The summary of the analysis showed that:

- all containers offer a method to get an entry by its id
- a large majority name such method `get()`
- for all containers, the `get()` method has 1 mandatory parameter of type string
- some containers have an optional additional argument for `get()`, but it doesn't have the same purpose between containers
- a large majority of the containers offer a method to test if it can return an entry by its id
- a majority name such method `has()`
- for all containers offering `has()`, the method has exactly 1 parameter of type string
- a large majority of the containers throw an exception rather than returning null when an entry is not found in `get()`
- a large majority of the containers don't implement `ArrayAccess`

The question of whether to include methods to define entries has been discussed in
[issue #1](https://github.com/container-interop/container-interop/issues/1).
It has been judged that such methods do not belong in the interface described here because it is out of its scope
(see the "Goal" section).

As a result, the `ContainerInterface` contains two methods:

- `get()`, returning anything, with one mandatory string parameter. Should throw an exception if the entry is not found.
- `has()`, returning a boolean, with one mandatory string parameter.

### Number of parameters in `get()` method

While `ContainerInterface` only defines one mandatory parameter in `get()`, it is not incompatible with
existing containers that have additional optional parameters. PHP allows an implementation to offer more parameters
as long as they are optional, because the implementation *does* satisfy the interface.

This issue has been discussed in [issue #6](https://github.com/container-interop/container-interop/issues/6).

### Type of the `$id` parameter

The type of the `$id` parameter in `get()` and `has()` has been discussed in
[issue #6](https://github.com/container-interop/container-interop/issues/6).
While `string` is used in all the containers that were analyzed, it was suggested that allowing
anything (such as objects) could allow containers to offer a more advanced query API.

An example given was to use the container as an object builder. The `$id` parameter would then be an
object that would describe how to create an instance.

The conclusion of the discussion was that this was beyond the scope of getting entries from a container without
knowing how the container provided them, and it was more fit for a factory.

## Contributors

Are listed here all people that contributed in the discussions or votes, by alphabetical order:

- [Amy Stephen](https://github.com/AmyStephen)
- [David Négrier](https://github.com/moufmouf)
- [Don Gilbert](https://github.com/dongilbert)
- [Jason Judge](https://github.com/judgej)
- [Jeremy Lindblom](https://github.com/jeremeamia)
- [Marco Pivetta](https://github.com/Ocramius)
- [Matthieu Napoli](https://github.com/mnapoli)
- [Paul M. Jones](https://github.com/pmjones)
- [Stephan Hochdörfer](https://github.com/shochdoerfer)
- [Taylor Otwell](https://github.com/taylorotwell)

## Relevant links

- [`ContainerInterface.php`](https://github.com/container-interop/container-interop/blob/master/src/Interop/Container/ContainerInterface.php)
- [List of all issues](https://github.com/container-interop/container-interop/issues?labels=ContainerInterface&milestone=&page=1&state=closed)
- [Vote for the interface name](https://github.com/container-interop/container-interop/wiki/%231-interface-name:-Vote)
