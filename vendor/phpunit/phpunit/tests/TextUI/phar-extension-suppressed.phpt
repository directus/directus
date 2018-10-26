--TEST--
phpunit --configuration tests/_files/phpunit-example-extension
--FILE--
<?php
$_SERVER['argv'][1] = '--configuration';
$_SERVER['argv'][2] = __DIR__ . '/../_files/phpunit-example-extension';
$_SERVER['argv'][3] = '--no-extensions';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
Fatal error: Trait 'PHPUnit\ExampleExtension\TestCaseTrait' not found in %s
