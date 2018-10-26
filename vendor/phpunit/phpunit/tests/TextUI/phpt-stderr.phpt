--TEST--
GH-1169: PHPT runner doesn't look at STDERR.
--FILE--
<?php
$stderr = fopen('php://stderr', 'w');
fwrite($stderr, 'PHPUnit must look at STDERR when running PHPT tests.');
--EXPECTF--
PHPUnit must look at STDERR when running PHPT tests.
