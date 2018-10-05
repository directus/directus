--TEST--
phpunit --colors=never --coverage-text=php://stdout --disable-coverage-ignore IgnoreCodeCoverageClassTest tests/_files/IgnoreCodeCoverageClassTest.php --whitelist ../../tests/_files/IgnoreCodeCoverageClass.php
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
$_SERVER['argv'][4] = '--disable-coverage-ignore';
$_SERVER['argv'][5] = __DIR__ . '/../_files/IgnoreCodeCoverageClassTest.php';
$_SERVER['argv'][6] = '--whitelist';
$_SERVER['argv'][7] = __DIR__ . '/../_files/IgnoreCodeCoverageClass.php';

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
  Classes: 100.00% (1/1)%w
  Methods: 100.00% (2/2)%w
  Lines:%s

IgnoreCodeCoverageClass
  Methods: 100.00% ( 2/ 2)   Lines: 100.00% (  2/  2)