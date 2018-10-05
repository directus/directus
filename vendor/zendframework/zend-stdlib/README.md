# zend-stdlib

[![Build Status](https://secure.travis-ci.org/zendframework/zend-stdlib.svg?branch=master)](https://secure.travis-ci.org/zendframework/zend-stdlib)
[![Coverage Status](https://coveralls.io/repos/github/zendframework/zend-stdlib/badge.svg?branch=master)](https://coveralls.io/github/zendframework/zend-stdlib?branch=master)

`Zend\Stdlib` is a set of components that implements general purpose utility
class for different scopes like:

- array utilities functions;
- general messaging systems;
- string wrappers;
- etc.

---

- File issues at https://github.com/zendframework/zend-stdlib/issues
- Documentation is at https://docs.zendframework.com/zend-stdlib/

## Benchmarks

We provide scripts for benchmarking zend-stdlib using the
[PHPBench](https://github.com/phpbench/phpbench) framework; these can be
found in the `benchmark/` directory.

To execute the benchmarks you can run the following command:

```bash
$ vendor/bin/phpbench run --report=aggregate
```
