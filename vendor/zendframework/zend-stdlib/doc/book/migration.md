# Migration Guide

## From v2 to v3

The changes made going from v2 to v3 were:

- Removal of the Hydrator subcomponent.
- Removal of the `CallbackHandler` class.
- Removal of `Zend\Stdlib\Guard\GuardUtils`.

### Hydrators

The biggest single change from version 2 to version 3 is that the hydrator
subcomponent, which was deprecated in v2.7.0, is now removed. This means that if
you were using zend-stdlib principally for the hydrators, you need to convert
your code to use [zend-hydrator](https://github.com/zendframework/zend-hydrator).

This will also mean a multi-step migration. zend-stdlib v3 pre-dates
zend-hydrator v2.1, which will be the first version that supports zend-stdlib v3
and zend-servicemanager v3. If you are using Composer, the migration should be
seamless:

- Remove your zend-stdlib dependency:

  ```bash
  $ composer remove zendframework/zend-stdlib
  ```

- Update to use zend-hydrator:

  ```bash
  $ composer require zendframework/zend-hydrator
  ```

When zend-hydrator updates to newer versions of zend-stdlib and
zend-servicemanager, you will either automatically get those versions, or you
can tell composer to use those specific versions:

```bash
$ composer require "zendframework/zend-stdlib:^3.0"
```

### CallbackHandler

`Zend\Stdlib\CallbackHandler` primarily existed for legacy purposes; it was
created before the `callable` typehint existed, so that we could typehint PHP
callables. It also provided some minimal features around lazy-loading callables
from instantiable classes, but these features were rarely used, and better
approaches already exist for handling such functinality in zend-servicemanager
and zend-expressive.

As such, the class was marked deprecated in v2.7.0, and removed for v3.0.0.

### GuardUtils

Version 3 removes `Zend\Stdlib\Guard\GuardUtils`. This abstract class existed to
provide the functionality of the various traits also present in that
subcomponent, for consumers on versions of PHP earlier than 5.4. Since the
minimum required version is now PHP 5.5, the class is unnecessary. If you were
using it previously, compose the related traits instead.
