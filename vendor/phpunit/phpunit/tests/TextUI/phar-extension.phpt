--TEST--
phpunit --configuration tests/_files/phpunit-example-extension
--FILE--
<?php
$_SERVER['argv'][1] = '--configuration';
$_SERVER['argv'][2] = __DIR__ . '/../_files/phpunit-example-extension';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Runtime:       %s
Configuration: %s/phpunit-example-extension/phpunit.xml
Extension:     %s/phpunit-example-extension/tools/phpunit.d/phpunit-example-extension-1.0.0.phar

.                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK (1 test, 1 assertion)
