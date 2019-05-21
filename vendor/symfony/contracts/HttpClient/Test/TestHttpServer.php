<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\HttpClient\Test;

use Symfony\Component\Process\PhpExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * @experimental in 1.1
 */
class TestHttpServer
{
    private static $server;

    public static function start()
    {
        if (null !== self::$server) {
            return;
        }

        $finder = new PhpExecutableFinder();
        $process = new Process(array_merge([$finder->find(false)], $finder->findArguments(), ['-dopcache.enable=0', '-dvariables_order=EGPCS', '-S', '127.0.0.1:8057']));
        $process->setWorkingDirectory(__DIR__.'/Fixtures/web');
        $process->setTimeout(300);
        $process->start();

        self::$server = new class() {
            public $process;

            public function __destruct()
            {
                $this->process->stop();
            }
        };

        self::$server->process = $process;

        sleep('\\' === \DIRECTORY_SEPARATOR ? 10 : 1);
    }
}
