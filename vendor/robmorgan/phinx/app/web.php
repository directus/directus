<?php
/* Phinx
 *
 * (The MIT license)
 * Copyright (c) 2014 Rob Morgan
 * Copyright (c) 2014 Woody Gilk
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated * documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

// This script can be run as a router with the built in PHP web server:
//
//   php -S localhost:8000 app/web.php
//
// Or can be run from any other web server with:
//
//   require 'phinx/app/web.php';
//
// This script uses the following query string arguments:
//
// - (string) "e" environment name
// - (string) "t" target version
// - (boolean) "debug" enable debugging?

// Get the phinx console application and inject it into TextWrapper.
$app = require __DIR__ . '/phinx.php';
$wrap = new Phinx\Wrapper\TextWrapper($app);

// Mapping of route names to commands.
$routes = [
    'status' => 'getStatus',
    'migrate' => 'getMigrate',
    'rollback' => 'getRollback',
];

// Extract the requested command from the URL, default to "status".
$command = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
if (!$command) {
    $command = 'status';
}

// Verify that the command exists, or list available commands.
if (!isset($routes[$command])) {
    $commands = implode(', ', array_keys($routes));
    header('Content-Type: text/plain', true, 404);
    die("Command not found! Valid commands are: {$commands}.");
}

// Get the environment and target version parameters.
$env = isset($_GET['e']) ? $_GET['e'] : null;
$target = isset($_GET['t']) ? $_GET['t'] : null;

// Check if debugging is enabled.
$debug = !empty($_GET['debug']) && filter_var($_GET['debug'], FILTER_VALIDATE_BOOLEAN);

// Execute the command and determine if it was successful.
$output = call_user_func([$wrap, $routes[$command]], $env, $target);
$error = $wrap->getExitCode() > 0;

// Finally, display the output of the command.
header('Content-Type: text/plain', true, $error ? 500 : 200);
if ($debug) {
    // Show what command was executed based on request parameters.
    $args = implode(', ', [var_export($env, true), var_export($target, true)]);
    echo "DEBUG: $command($args)" . PHP_EOL . PHP_EOL;
}
echo $output;
