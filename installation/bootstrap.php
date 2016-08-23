<?php

require __DIR__ . '/includes/install.functions.php';
require BASE_PATH . '/api/globals.php';

$vendorAutoload = BASE_PATH . '/vendor/autoload.php';
$installationAutoload = __DIR__ . '/autoload.php';

if (!file_exists($vendorAutoload)) {
    $vendorAutoload = $installationAutoload;
    include BASE_PATH . '/api/core/functions.php';
}

require $vendorAutoload;
