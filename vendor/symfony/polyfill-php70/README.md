Symfony Polyfill / Php70
========================

This component provides features unavailable in releases prior to PHP 7.0:

- [`intdiv`](https://php.net/intdiv)
- [`preg_replace_callback_array`](https://php.net/preg_replace_callback_array)
- [`error_clear_last`](https://php.net/error_clear_last)
- `random_bytes` and `random_int` (from [paragonie/random_compat](https://github.com/paragonie/random_compat))
- [`*Error` throwable classes](https://php.net/Error)
- [`PHP_INT_MIN`](https://php.net/reserved.constants#constant.php-int-min)
- `SessionUpdateTimestampHandlerInterface`

More information can be found in the
[main Polyfill README](https://github.com/symfony/polyfill/blob/master/README.md).

Compatibility notes
===================

To write portable code between PHP5 and PHP7, some care must be taken:
- `\*Error` exceptions must be caught before `\Exception`;
- after calling `error_clear_last()`, the result of `$e = error_get_last()` must be
  verified using `isset($e['message'][0])` instead of `null !== $e`.

License
=======

This library is released under the [MIT license](LICENSE).
