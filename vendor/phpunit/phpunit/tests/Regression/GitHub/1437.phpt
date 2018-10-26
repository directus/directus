--TEST--
https://github.com/sebastianbergmann/phpunit/issues/1437
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue1437Test';
$_SERVER['argv'][3] = __DIR__ . '/1437/Issue1437Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

F                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 failure:

1) Issue1437Test::testFailure
Failed asserting that false is true.

%sIssue1437Test.php:%i

FAILURES!
Tests: 1, Assertions: 1, Failures: 1.
