<?php
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
spl_autoload_register(function ($class) {

    // project-specific namespace prefix
    $prefix = 'Directus\\Installation\\';

    // base directory for the namespace prefix
    $base_dir = __DIR__ . '/includes/';

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
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // if the file exists, require it
    if (file_exists($file)) {
        require $file;
    }
});
