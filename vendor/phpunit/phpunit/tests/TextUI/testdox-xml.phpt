--TEST--
phpunit --testdox-xml php://stdout StatusTest ../_files/StatusTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--report-useless-tests';
$_SERVER['argv'][3] = '--testdox-xml';
$_SERVER['argv'][4] = 'php://stdout';
$_SERVER['argv'][5] = 'StatusTest';
$_SERVER['argv'][6] = __DIR__ . '/../_files/StatusTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.FEISRW                                                             7 / 7 (100%)<?xml version="1.0" encoding="UTF-8"?>
<tests>
  <test className="StatusTest" methodName="testSuccess" prettifiedClassName="Status" prettifiedMethodName="Success" status="0" time="%s" size="-1" groups="default"/>
  <test className="StatusTest" methodName="testFailure" prettifiedClassName="Status" prettifiedMethodName="Failure" status="3" time="%s" size="-1" groups="default" exceptionLine="11" exceptionMessage="Failed asserting that false is true."/>
  <test className="StatusTest" methodName="testError" prettifiedClassName="Status" prettifiedMethodName="Error" status="4" time="%s" size="-1" groups="default" exceptionMessage=""/>
  <test className="StatusTest" methodName="testIncomplete" prettifiedClassName="Status" prettifiedMethodName="Incomplete" status="2" time="%s" size="-1" groups="default"/>
  <test className="StatusTest" methodName="testSkipped" prettifiedClassName="Status" prettifiedMethodName="Skipped" status="1" time="%s" size="-1" groups="default"/>
  <test className="StatusTest" methodName="testRisky" prettifiedClassName="Status" prettifiedMethodName="Risky" status="5" time="%s" size="-1" groups="default"/>
  <test className="StatusTest" methodName="testWarning" prettifiedClassName="Status" prettifiedMethodName="Warning" status="6" time="%s" size="-1" groups="default"/>
</tests>


Time: %s, Memory: %s

There was 1 error:

1) StatusTest::testError
Exception:%s

%s/StatusTest.php:%d

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