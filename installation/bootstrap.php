<?php

require __DIR__.'/includes/install.functions.php';

$vendorAutoload = BASE_PATH.'/vendor/autoload.php';
$installationAutoload = __DIR__.'/autoload.php';

if (!file_exists($vendorAutoload)) {
    $vendorAutoload = $installationAutoload;
}

require $vendorAutoload;
