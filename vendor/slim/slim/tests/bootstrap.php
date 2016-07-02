<?php
set_include_path(dirname(__FILE__) . '/../' . PATH_SEPARATOR . get_include_path());

require_once 'Slim/Slim.php';

// Register Slim's autoloader
\Slim\Slim::registerAutoloader();

//Register non-Slim autoloader
function customAutoLoader( $class )
{
    $file = rtrim(dirname(__FILE__), '/') . '/' . $class . '.php';
    if ( file_exists($file) ) {
        require $file;
    } else {
        return;
    }
}
spl_autoload_register('customAutoLoader');
