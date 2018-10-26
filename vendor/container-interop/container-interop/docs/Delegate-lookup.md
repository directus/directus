Delegate lookup feature
=======================

This document describes a standard for dependency injection containers.

The goal set by the *delegate lookup* feature is to allow several containers to share entries.
Containers implementing this feature can perform dependency lookups in other containers.

Containers implementing this feature will offer a greater lever of interoperability
with other containers. Implementation of this feature is therefore RECOMMENDED.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in [RFC 2119][].

The word `implementor` in this document is to be interpreted as someone
implementing the delegate lookup feature in a dependency injection-related library or framework.
Users of dependency injections containers (DIC) are referred to as `user`.

[RFC 2119]: http://tools.ietf.org/html/rfc2119

1. Vocabulary
-------------

In a dependency injection container, the container is used to fetch entries.
Entries can have dependencies on other entries. Usually, these other entries are fetched by the container.

The *delegate lookup* feature is the ability for a container to fetch dependencies in
another container. In the rest of the document, the word "container" will reference the container
implemented by the implementor. The word "delegate container" will reference the container we are
fetching the dependencies from.

2. Specification
----------------

A container implementing the *delegate lookup* feature:

- MUST implement the [`ContainerInterface`](ContainerInterface.md)
- MUST provide a way to register a delegate container (using a constructor parameter, or a setter,
  or any possible way). The delegate container MUST implement the [`ContainerInterface`](ContainerInterface.md).

When a container is configured to use a delegate container for dependencies:

- Calls to the `get` method should only return an entry if the entry is part of the container.
  If the entry is not part of the container, an exception should be thrown
  (as requested by the [`ContainerInterface`](ContainerInterface.md)).
- Calls to the `has` method should only return `true` if the entry is part of the container.
  If the entry is not part of the container, `false` should be returned.
- If the fetched entry has dependencies, **instead** of performing
  the dependency lookup in the container, the lookup is performed on the *delegate container*.

Important: By default, the dependency lookups SHOULD be performed on the delegate container **only**, not on the container itself.

It is however allowed for containers to provide exception cases for special entries, and a way to lookup
into the same container (or another container) instead of the delegate container.

3. Package / Interface
----------------------

This feature is not tied to any code, interface or package.
