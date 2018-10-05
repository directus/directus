--TEST--
phpunit --log-json php://stdout BankAccountTest ../_files/BankAccountTest.php
--SKIPIF--
<?php
if (!defined('JSON_PRETTY_PRINT')) {
    print 'skip: JSON_PRETTY_PRINT is required';
} elseif (json_encode([], JSON_PRETTY_PRINT) != '[]') {
    print 'skip: Does not have PHP #66021 (Blank line inside empty JSON array/object)';
}
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--log-json';
$_SERVER['argv'][3] = 'php://stdout';
$_SERVER['argv'][4] = 'BankAccountTest';
$_SERVER['argv'][5] = __DIR__ . '/../_files/BankAccountTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Warning:       Deprecated JSON test listener used

{
    "event": "suiteStart",
    "suite": "BankAccountTest",
    "tests": 3
}{
    "event": "testStart",
    "suite": "BankAccountTest",
    "test": "BankAccountTest::testBalanceIsInitiallyZero"
}.{
    "event": "test",
    "suite": "BankAccountTest",
    "test": "BankAccountTest::testBalanceIsInitiallyZero",
    "status": "pass",
    "time": %f,
    "trace": [],
    "message": "",
    "output": ""
}{
    "event": "testStart",
    "suite": "BankAccountTest",
    "test": "BankAccountTest::testBalanceCannotBecomeNegative"
}.{
    "event": "test",
    "suite": "BankAccountTest",
    "test": "BankAccountTest::testBalanceCannotBecomeNegative",
    "status": "pass",
    "time": %f,
    "trace": [],
    "message": "",
    "output": ""
}{
    "event": "testStart",
    "suite": "BankAccountTest",
    "test": "BankAccountTest::testBalanceCannotBecomeNegative2"
}.                                                                 3 / 3 (100%){
    "event": "test",
    "suite": "BankAccountTest",
    "test": "BankAccountTest::testBalanceCannotBecomeNegative2",
    "status": "pass",
    "time": %f,
    "trace": [],
    "message": "",
    "output": ""
}

Time: %s, Memory: %s

OK (3 tests, 3 assertions)
