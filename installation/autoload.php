<?php

/**
 * @param $prefix - project-specific namespace prefix
 * @param $baseDir - base directory for the namespace prefix
 * @return Closure
 */
function autoload_register($prefix, $baseDir)
{
    return function ($class) use ($prefix, $baseDir) {
        // does the class use the namespace prefix?
        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) !== 0) {
            // no, move to the next registered autoloader
            return;
        }

        // get the relative class name
        $relative_class = substr($class, $len);

        // replace the namespace prefix with the base directory, replace namespace
        // separators with directory separators in the relative class name, append
        // with .php
        $file = $baseDir . str_replace('\\', '/', $relative_class) . '.php';

        // if the file exists, require it
        if (file_exists($file)) {
            require $file;
        }
    };
}

/**
 * An example of a project-specific implementation.
 *
 * After registering this autoload function with SPL, the following line
 * would cause the function to attempt to load the \Foo\Bar\Baz\Qux class
 * from /path/to/project/src/Baz/Qux.php:
 *
 *      new \Foo\Bar\Baz\Qux;
 *
 * @param string $class The fully-qualified class name.
 * @return void
 */

spl_autoload_register(autoload_register('Directus', BASE_PATH . '/api/core/Directus'));
spl_autoload_register(autoload_register('Directus\\Installation\\', __DIR__ . '/includes/'));
