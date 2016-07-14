<?php

require_once dirname(__DIR__).'/vendor/autoload.php';

// Disable garbage collector to prevent segfaults
gc_disable();

set_include_path(get_include_path().PATH_SEPARATOR.dirname(__DIR__).'/lib');

Mockery::getConfiguration()->allowMockingNonExistentMethods(true);

if (is_file(__DIR__.'/acceptance.conf.php')) {
    require_once __DIR__.'/acceptance.conf.php';
}
if (is_file(__DIR__.'/smoke.conf.php')) {
    require_once __DIR__.'/smoke.conf.php';
}
require_once __DIR__.'/StreamCollector.php';
require_once __DIR__.'/IdenticalBinaryConstraint.php';
require_once __DIR__.'/SwiftMailerTestCase.php';
require_once __DIR__.'/SwiftMailerSmokeTestCase.php';
