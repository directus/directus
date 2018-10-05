<?php

require_once 'lib/byte_safe_strings.php';
require_once 'lib/cast_to_int.php';
require_once 'lib/error_polyfill.php';
require_once 'other/ide_stubs/libsodium.php';
require_once 'lib/random.php';

$int = random_int(0, 65536);
