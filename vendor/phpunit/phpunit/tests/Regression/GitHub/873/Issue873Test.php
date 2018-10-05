<?php

if (extension_loaded('xdebug')) {
    xdebug_disable();
}

    throw new Exception(
        'PHPUnit suppresses exceptions thrown outside of test case function'
    );
