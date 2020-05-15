<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Encryption\Tests;

use Cache\Adapter\Common\CacheItem;
use Cache\Adapter\Common\Exception\InvalidArgumentException;
use Cache\Adapter\Filesystem\FilesystemCachePool;
use Cache\Encryption\EncryptedCachePool;
use Cache\IntegrationTests\CachePoolTest;
use Defuse\Crypto\Key;
use League\Flysystem\Adapter\Local;
use League\Flysystem\Filesystem;

class IntegrationPoolTest extends CachePoolTest
{
    /**
     * @type Filesystem
     */
    private $filesystem;

    /**
     * @throws \Defuse\Crypto\Exception\BadFormatException
     * @throws \Defuse\Crypto\Exception\EnvironmentIsBrokenException
     *
     * @return EncryptedCachePool|\Psr\Cache\CacheItemPoolInterface
     */
    public function createCachePool()
    {
        return new EncryptedCachePool(
            new FilesystemCachePool($this->getFilesystem()),
            Key::loadFromAsciiSafeString('def000007c57b06c65b0df4bcac939924e42605d8d76e1462b619318bf94107c28db30c5394b4242db5e45563e1226cffcdff8123fa214ea1fcc4aa10b0ddb1b4a587b7e')
        );
    }

    public function testSaveToThrowAInvalidArgumentException()
    {
        $this->expectException(InvalidArgumentException::class);

        $pool = $this->createCachePool();

        $pool->save(new CacheItem('save_valid_exceptiond'));
    }

    public function testSaveDeferredToThrowAInvalidArgumentException()
    {
        $this->expectException(InvalidArgumentException::class);

        $pool = $this->createCachePool();

        $pool->saveDeferred(new CacheItem('save_valid_exceptiond'));
    }

    private function getFilesystem()
    {
        if ($this->filesystem === null) {
            $this->filesystem = new Filesystem(new Local(__DIR__.'/cache'.rand(1, 100000)));
        }

        return $this->filesystem;
    }
}
