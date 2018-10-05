<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Fixtures;

use Symfony\Component\Validator\Mapping\Loader\FilesLoader as BaseFilesLoader;
use Symfony\Component\Validator\Mapping\Loader\LoaderInterface;

abstract class FilesLoader extends BaseFilesLoader
{
    protected $timesCalled = 0;
    protected $loader;

    public function __construct(array $paths, LoaderInterface $loader)
    {
        $this->loader = $loader;
        parent::__construct($paths);
    }

    protected function getFileLoaderInstance($file)
    {
        ++$this->timesCalled;

        return $this->loader;
    }

    public function getTimesCalled()
    {
        return $this->timesCalled;
    }
}
