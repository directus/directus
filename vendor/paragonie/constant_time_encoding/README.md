# Constant-Time Encoding

[![Build Status](https://travis-ci.org/paragonie/constant_time_encoding.svg?branch=master)](https://travis-ci.org/paragonie/constant_time_encoding)
[![Latest Stable Version](https://poser.pugx.org/paragonie/constant_time_encoding/v/stable)](https://packagist.org/packages/paragonie/constant_time_encoding)
[![Latest Unstable Version](https://poser.pugx.org/paragonie/constant_time_encoding/v/unstable)](https://packagist.org/packages/paragonie/constant_time_encoding)
[![License](https://poser.pugx.org/paragonie/constant_time_encoding/license)](https://packagist.org/packages/paragonie/constant_time_encoding)
[![Downloads](https://img.shields.io/packagist/dt/paragonie/constant_time_encoding.svg)](https://packagist.org/packages/paragonie/constant_time_encoding)

Based on the [constant-time base64 implementation made by Steve "Sc00bz" Thomas](https://github.com/Sc00bz/ConstTimeEncoding),
this library aims to offer character encoding functions that do not leak
information about what you are encoding/decoding via processor cache 
misses. Further reading on [cache-timing attacks](http://blog.ircmaxell.com/2014/11/its-all-about-time.html).

Our fork offers the following enchancements:

* `mbstring.func_overload` resistance
* Unit tests
* Composer- and Packagist-ready
* Base16 encoding
* Base32 encoding
* Uses `pack()` and `unpack()` instead of `chr()` and `ord()`

## PHP Version Requirements

Version 2 of this library should work on **PHP 7** or newer. For PHP 5
support, see [the v1.x branch](https://github.com/paragonie/constant_time_encoding/tree/v1.x).

If you are adding this as a dependency to a project intended to work on both PHP 5 and PHP 7, please set the required version to `^1|^2` instead of just `^1` or `^2`.

## How to Install

```sh
composer require paragonie/constant_time_encoding
```

## How to Use

```php
use \ParagonIE\ConstantTime\Encoding;

// possibly (if applicable): 
// require 'vendor/autoload.php';

$data = random_bytes(32);
echo Encoding::base64Encode($data), "\n";
echo Encoding::base32EncodeUpper($data), "\n";
echo Encoding::base32Encode($data), "\n";
echo Encoding::hexEncode($data), "\n";
echo Encoding::hexEncodeUpper($data), "\n";
```

Example output:
 
```
1VilPkeVqirlPifk5scbzcTTbMT2clp+Zkyv9VFFasE=
2VMKKPSHSWVCVZJ6E7SONRY3ZXCNG3GE6ZZFU7TGJSX7KUKFNLAQ====
2vmkkpshswvcvzj6e7sonry3zxcng3ge6zzfu7tgjsx7kukfnlaq====
d558a53e4795aa2ae53e27e4e6c71bcdc4d36cc4f6725a7e664caff551456ac1
D558A53E4795AA2AE53E27E4E6C71BDCC4D36CC4F6725A7E664CAFF551456AC1
```

If you only need a particular variant, you can just reference the 
required class like so:

```php
use \ParagonIE\ConstantTime\Base64;
use \ParagonIE\ConstantTime\Base32;

$data = random_bytes(32);
echo Base64::encode($data), "\n";
echo Base32::encode($data), "\n";
```

Example output:

```
1VilPkeVqirlPifk5scbzcTTbMT2clp+Zkyv9VFFasE=
2vmkkpshswvcvzj6e7sonry3zxcng3ge6zzfu7tgjsx7kukfnlaq====
```

## Support Contracts

If your company uses this library in their products or services, you may be
interested in [purchasing a support contract from Paragon Initiative Enterprises](https://paragonie.com/enterprise).
