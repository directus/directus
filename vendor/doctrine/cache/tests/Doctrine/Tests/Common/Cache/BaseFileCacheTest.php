<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\FileCache;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

abstract class BaseFileCacheTest extends CacheTest
{
    protected $directory;

    protected function setUp()
    {
        do {
            $this->directory = sys_get_temp_dir() . '/doctrine_cache_'. uniqid();
        } while (file_exists($this->directory));
    }

    protected function tearDown()
    {
        if ( ! is_dir($this->directory)) {
            return;
        }

        $iterator = new RecursiveDirectoryIterator($this->directory);

        foreach (new RecursiveIteratorIterator($iterator, RecursiveIteratorIterator::CHILD_FIRST) as $file) {
            if ($file->isFile()) {
                @unlink($file->getRealPath());
            } elseif ($file->isDir()) {
                @rmdir($file->getRealPath());
            }
        }

        @rmdir($this->directory);
    }

    public function testFlushAllRemovesBalancingDirectories()
    {
        $cache = $this->_getCacheDriver();

        $this->assertTrue($cache->save('key1', 1));
        $this->assertTrue($cache->save('key2', 2));
        $this->assertTrue($cache->flushAll());

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->directory, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);

        $this->assertCount(0, $iterator);
    }

    protected function isSharedStorage()
    {
        return false;
    }

    public function getPathLengthsToTest()
    {
        // Windows officially supports 260 bytes including null terminator
        // 258 bytes available to use due to php bug #70943
        // Windows officially supports 260 bytes including null terminator
        // 259 characters is too large due to PHP bug (https://bugs.php.net/bug.php?id=70943)
        // 260 characters is too large - null terminator is included in allowable length
        return array(
            array(257, false),
            array(258, false),
            array(259, true),
            array(260, true)
        );
    }

    private static function getBasePathForWindowsPathLengthTests($pathLength)
    {
        return FileCacheTest::getBasePathForWindowsPathLengthTests($pathLength);
    }

    /**
     * @param int    $length
     * @param string $basePath
     *
     * @return array
     */
    private static function getKeyAndPathFittingLength($length, $basePath)
    {
        $baseDirLength = strlen($basePath);
        $extensionLength = strlen('.doctrine.cache');
        $directoryLength = strlen(DIRECTORY_SEPARATOR . 'aa' . DIRECTORY_SEPARATOR);
        $namespaceAndBracketLength = strlen(bin2hex("[][1]"));
        $keyLength = $length
            - ($baseDirLength
                + $extensionLength
                + $directoryLength
                + $namespaceAndBracketLength);

        $key = str_repeat('a', floor($keyLength / 2));
        $namespacedKey = '[' . $key . '][1]';

        $keyHash = hash('sha256', $namespacedKey);

        $keyPath = $basePath
            . DIRECTORY_SEPARATOR
            . substr($keyHash, 0, 2)
            . DIRECTORY_SEPARATOR
            . bin2hex($namespacedKey)
            . '.doctrine.cache';

        $hashedKeyPath = $basePath
            . DIRECTORY_SEPARATOR
            . substr($keyHash, 0, 2)
            . DIRECTORY_SEPARATOR
            . '_' . $keyHash
            . '.doctrine.cache';

        return array($key, $keyPath, $hashedKeyPath);
    }

    /**
     * @dataProvider getPathLengthsToTest
     *
     * @param int  $length
     * @param bool $pathShouldBeHashed
     */
    public function testWindowsPathLengthLimitIsCorrectlyHandled($length, $pathShouldBeHashed)
    {
        $this->directory = self::getBasePathForWindowsPathLengthTests($length);

        list($key, $keyPath, $hashedKeyPath) = self::getKeyAndPathFittingLength($length, $this->directory);

        $this->assertEquals($length, strlen($keyPath), 'Unhashed path should be of correct length.');

        $cacheClass = get_class($this->_getCacheDriver());
        /* @var $cache \Doctrine\Common\Cache\FileCache */
        $cache = new $cacheClass($this->directory, '.doctrine.cache');

        // Trick it into thinking this is windows.
        $reflClass = new \ReflectionClass(FileCache::class);
        $reflProp = $reflClass->getProperty('isRunningOnWindows');
        $reflProp->setAccessible(true);
        $reflProp->setValue($cache, true);
        $reflProp->setAccessible(false);

        $value = uniqid('value', true);

        $cache->save($key, $value);
        $this->assertEquals($value, $cache->fetch($key));

        if ($pathShouldBeHashed) {
            $this->assertFileExists($hashedKeyPath, 'Path generated for key should be hashed.');
            unlink($hashedKeyPath);
        } else {
            $this->assertFileExists($keyPath, 'Path generated for key should not be hashed.');
            unlink($keyPath);
        }
    }
}
