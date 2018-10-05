--TEST--
phpunit --log-junit php://stdout --report-useless-tests StatusTest ../_files/StatusTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--log-junit';
$_SERVER['argv'][3] = 'php://stdout';
$_SERVER['argv'][4] = '--report-useless-tests';
$_SERVER['argv'][5] = 'StatusTest';
$_SERVER['argv'][6] = __DIR__ . '/../_files/StatusTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.FEISRW                                                             7 / 7 (100%)<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="StatusTest" file="%s/StatusTest.php" tests="4" assertions="2" failures="1" errors="1" time="%s">
    <testcase name="testSuccess" class="StatusTest" file="%s/StatusTest.php" line="%d" assertions="1" time="%s"/>
    <testcase name="testFailure" class="StatusTest" file="%s/StatusTest.php" line="%d" assertions="1" time="%s">
      <failure type="PHPUnit_Framework_ExpectationFailedException">StatusTest::testFailure
Failed asserting that false is true.

%s/StatusTest.php:%s
</failure>
    </testcase>
    <testcase name="testError" class="StatusTest" file="%s/StatusTest.php" line="%d" assertions="0" time="%s">
      <error type="Exception">StatusTest::testError
Exception:%w

%s/StatusTest.php:%d
</error>
    </testcase>
    <testcase name="testWarning" class="StatusTest" file="%s/StatusTest.php" line="%d" assertions="0" time="%s"/>
  </testsuite>
</testsuites>


Time: %s, Memory: %s

There was 1 error:

1) StatusTest::testError
Exception:%w

%s:%d

--

There was 1 warning:

1) StatusTest::testWarning

%s/StatusTest.php:%d

--

There was 1 failure:

1) StatusTest::testFailure
Failed asserting that false is true.

%s/StatusTest.php:%d

ERRORS!
Tests: 7, Assertions: 2, Errors: 1, Failures: 1, Warnings: 1, Skipped: 1, Incomplete: 1, Risky: 1.