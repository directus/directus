--TEST--
phpunit --colors=never --coverage-text=php://stdout IgnoreCodeCoverageClassTest ../_files/IgnoreCodeCoverageClassTest.php --whitelist ../../tests/_files/IgnoreCodeCoverageClass.php
--SKIPIF--
<?php
if (!extension_loaded('xdebug')) {
    print 'skip: Extension xdebug is required.';
}
?>
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--colors=never';
$_SERVER['argv'][3] = '--coverage-text=php://stdout';
$_SERVER['argv'][4] = __DIR__ . '/../_files/IgnoreCodeCoverageClassTest.php';
$_SERVER['argv'][5] = '--whitelist';
$_SERVER['argv'][6] = __DIR__ . '/../_files/IgnoreCodeCoverageClass.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

..                                                                  2 / 2 (100%)

Time: %s, Memory: %s

OK (2 tests, 2 assertions)


Code Coverage Report:%w
%s
%w
 Summary:%w
  Classes:%w(0/0)%w
  Methods:%w(0/0)%w
  Lines:%w(0/0)%w