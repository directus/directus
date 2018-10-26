Webmozart Assert
================

[![Build Status](https://travis-ci.org/webmozart/assert.svg?branch=master)](https://travis-ci.org/webmozart/assert)
[![Build status](https://ci.appveyor.com/api/projects/status/lyg83bcsisrr94se/branch/master?svg=true)](https://ci.appveyor.com/project/webmozart/assert/branch/master)
[![Latest Stable Version](https://poser.pugx.org/webmozart/assert/v/stable.svg)](https://packagist.org/packages/webmozart/assert)
[![Total Downloads](https://poser.pugx.org/webmozart/assert/downloads.svg)](https://packagist.org/packages/webmozart/assert)
[![Dependency Status](https://www.versioneye.com/php/webmozart:assert/1.2.0/badge.svg)](https://www.versioneye.com/php/webmozart:assert/1.2.0)

Latest release: [1.2.0](https://packagist.org/packages/webmozart/assert#1.2.0)

PHP >= 5.3.9

This library contains efficient assertions to test the input and output of
your methods. With these assertions, you can greatly reduce the amount of coding
needed to write a safe implementation.

All assertions in the [`Assert`] class throw an `\InvalidArgumentException` if 
they fail.

FAQ
---

**What's the difference to [beberlei/assert]?**

This library is heavily inspired by Benjamin Eberlei's wonderful [assert package],
but fixes a usability issue with error messages that can't be fixed there without
breaking backwards compatibility.

This package features usable error messages by default. However, you can also 
easily write custom error messages:

```
Assert::string($path, 'The path is expected to be a string. Got: %s');
```

In [beberlei/assert], the ordering of the `%s` placeholders is different for 
every assertion. This package, on the contrary, provides consistent placeholder 
ordering for all assertions:

* `%s`: The tested value as string, e.g. `"/foo/bar"`.
* `%2$s`, `%3$s`, ...: Additional assertion-specific values, e.g. the
  minimum/maximum length, allowed values, etc.
  
Check the source code of the assertions to find out details about the additional
available placeholders.

Installation
------------

Use [Composer] to install the package:

```
$ composer require webmozart/assert
```

Example
-------

```php
use Webmozart\Assert\Assert;

class Employee
{
    public function __construct($id)
    {
        Assert::integer($id, 'The employee ID must be an integer. Got: %s');
        Assert::greaterThan($id, 0, 'The employee ID must be a positive integer. Got: %s');
    }
}
```

If you create an employee with an invalid ID, an exception is thrown:

```php
new Employee('foobar');
// => InvalidArgumentException: 
//    The employee ID must be an integer. Got: string

new Employee(-10);
// => InvalidArgumentException: 
//    The employee ID must be a positive integer. Got: -10
```

Assertions
----------

The [`Assert`] class provides the following assertions:

### Type Assertions

Method                                                   | Description
-------------------------------------------------------- | --------------------------------------------------
`string($value, $message = '')`                          | Check that a value is a string
`stringNotEmpty($value, $message = '')`                  | Check that a value is a non-empty string
`integer($value, $message = '')`                         | Check that a value is an integer
`integerish($value, $message = '')`                      | Check that a value casts to an integer
`float($value, $message = '')`                           | Check that a value is a float
`numeric($value, $message = '')`                         | Check that a value is numeric
`natural($value, $message= ''')`                         | Check that a value is a non-negative integer
`boolean($value, $message = '')`                         | Check that a value is a boolean
`scalar($value, $message = '')`                          | Check that a value is a scalar
`object($value, $message = '')`                          | Check that a value is an object
`resource($value, $type = null, $message = '')`          | Check that a value is a resource
`isCallable($value, $message = '')`                      | Check that a value is a callable
`isArray($value, $message = '')`                         | Check that a value is an array
`isTraversable($value, $message = '')`  (deprecated)     | Check that a value is an array or a `\Traversable`
`isIterable($value, $message = '')`                      | Check that a value is an array or a `\Traversable`
`isCountable($value, $message = '')`                     | Check that a value is an array or a `\Countable`
`isInstanceOf($value, $class, $message = '')`            | Check that a value is an `instanceof` a class
`isInstanceOfAny($value, array $classes, $message = '')` | Check that a value is an `instanceof` a at least one class on the array of classes
`notInstanceOf($value, $class, $message = '')`           | Check that a value is not an `instanceof` a class
`isArrayAccessible($value, $message = '')`               | Check that a value can be accessed as an array

### Comparison Assertions

Method                                          | Description
----------------------------------------------- | --------------------------------------------------
`true($value, $message = '')`                   | Check that a value is `true`
`false($value, $message = '')`                  | Check that a value is `false`
`null($value, $message = '')`                   | Check that a value is `null`
`notNull($value, $message = '')`                | Check that a value is not `null`
`isEmpty($value, $message = '')`                | Check that a value is `empty()`
`notEmpty($value, $message = '')`               | Check that a value is not `empty()`
`eq($value, $value2, $message = '')`            | Check that a value equals another (`==`)
`notEq($value, $value2, $message = '')`         | Check that a value does not equal another (`!=`)
`same($value, $value2, $message = '')`          | Check that a value is identical to another (`===`)
`notSame($value, $value2, $message = '')`       | Check that a value is not identical to another (`!==`)
`greaterThan($value, $value2, $message = '')`   | Check that a value is greater than another
`greaterThanEq($value, $value2, $message = '')` | Check that a value is greater than or equal to another
`lessThan($value, $value2, $message = '')`      | Check that a value is less than another
`lessThanEq($value, $value2, $message = '')`    | Check that a value is less than or equal to another
`range($value, $min, $max, $message = '')`      | Check that a value is within a range
`oneOf($value, array $values, $message = '')`   | Check that a value is one of a list of values

### String Assertions

You should check that a value is a string with `Assert::string()` before making
any of the following assertions.

Method                                              | Description
--------------------------------------------------- | -----------------------------------------------------------------
`contains($value, $subString, $message = '')`       | Check that a string contains a substring
`notContains($value, $subString, $message = '')`    | Check that a string does not contains a substring
`startsWith($value, $prefix, $message = '')`        | Check that a string has a prefix
`startsWithLetter($value, $message = '')`           | Check that a string starts with a letter
`endsWith($value, $suffix, $message = '')`          | Check that a string has a suffix
`regex($value, $pattern, $message = '')`            | Check that a string matches a regular expression
`alpha($value, $message = '')`                      | Check that a string contains letters only
`digits($value, $message = '')`                     | Check that a string contains digits only
`alnum($value, $message = '')`                      | Check that a string contains letters and digits only
`lower($value, $message = '')`                      | Check that a string contains lowercase characters only
`upper($value, $message = '')`                      | Check that a string contains uppercase characters only
`length($value, $length, $message = '')`            | Check that a string has a certain number of characters
`minLength($value, $min, $message = '')`            | Check that a string has at least a certain number of characters
`maxLength($value, $max, $message = '')`            | Check that a string has at most a certain number of characters
`lengthBetween($value, $min, $max, $message = '')`  | Check that a string has a length in the given range
`uuid($value, $message = '')`                       | Check that a string is a valid UUID
`notWhitespaceOnly($value, $message = '')`          | Check that a string contains at least one non-whitespace character

### File Assertions

Method                              | Description
----------------------------------- | --------------------------------------------------
`fileExists($value, $message = '')` | Check that a value is an existing path
`file($value, $message = '')`       | Check that a value is an existing file
`directory($value, $message = '')`  | Check that a value is an existing directory
`readable($value, $message = '')`   | Check that a value is a readable path
`writable($value, $message = '')`   | Check that a value is a writable path

### Object Assertions

Method                                                | Description
----------------------------------------------------- | --------------------------------------------------
`classExists($value, $message = '')`                  | Check that a value is an existing class name
`subclassOf($value, $class, $message = '')`           | Check that a class is a subclass of another
`implementsInterface($value, $class, $message = '')`  | Check that a class implements an interface
`propertyExists($value, $property, $message = '')`    | Check that a property exists in a class/object
`propertyNotExists($value, $property, $message = '')` | Check that a property does not exist in a class/object
`methodExists($value, $method, $message = '')`        | Check that a method exists in a class/object
`methodNotExists($value, $method, $message = '')`     | Check that a method does not exist in a class/object

### Array Assertions

Method                                             | Description
-------------------------------------------------- | ------------------------------------------------------------------
`keyExists($array, $key, $message = '')`           | Check that a key exists in an array
`keyNotExists($array, $key, $message = '')`        | Check that a key does not exist in an array
`count($array, $number, $message = '')`            | Check that an array contains a specific number of elements
`minCount($array, $min, $message = '')`            | Check that an array contains at least a certain number of elements
`maxCount($array, $max, $message = '')`            | Check that an array contains at most a certain number of elements
`countBetween($array, $min, $max, $message = '')`  | Check that an array has a count in the given range

### Function Assertions

Method                                      | Description
------------------------------------------- | -----------------------------------------------------------------------------------------------------
`throws($closure, $class, $message = '')`   | Check that a function throws a certain exception. Subclasses of the exception class will be accepted.

### Collection Assertions

All of the above assertions can be prefixed with `all*()` to test the contents
of an array or a `\Traversable`:

```php
Assert::allIsInstanceOf($employees, 'Acme\Employee');
```

### Nullable Assertions

All of the above assertions can be prefixed with `nullOr*()` to run the
assertion only if it the value is not `null`:

```php
Assert::nullOrString($middleName, 'The middle name must be a string or null. Got: %s');
```

Authors
-------

* [Bernhard Schussek] a.k.a. [@webmozart]
* [The Community Contributors]

Contribute
----------

Contributions to the package are always welcome!

* Report any bugs or issues you find on the [issue tracker].
* You can grab the source code at the package's [Git repository].

Support
-------

If you are having problems, send a mail to bschussek@gmail.com or shout out to
[@webmozart] on Twitter.

License
-------

All contents of this package are licensed under the [MIT license].

[beberlei/assert]: https://github.com/beberlei/assert
[assert package]: https://github.com/beberlei/assert
[Composer]: https://getcomposer.org
[Bernhard Schussek]: http://webmozarts.com
[The Community Contributors]: https://github.com/webmozart/assert/graphs/contributors
[issue tracker]: https://github.com/webmozart/assert/issues
[Git repository]: https://github.com/webmozart/assert
[@webmozart]: https://twitter.com/webmozart
[MIT license]: LICENSE
[`Assert`]: src/Assert.php
