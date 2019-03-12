<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Cache\FilesystemCache;

require_once \dirname(__DIR__).'/FilesystemHelper.php';

class Twig_Tests_Cache_FilesystemTest extends \PHPUnit\Framework\TestCase
{
    private $classname;
    private $directory;
    private $cache;

    protected function setUp()
    {
        $nonce = hash('sha256', uniqid(mt_rand(), true));
        $this->classname = '__Twig_Tests_Cache_FilesystemTest_Template_'.$nonce;
        $this->directory = sys_get_temp_dir().'/twig-test';
        $this->cache = new FilesystemCache($this->directory);
    }

    protected function tearDown()
    {
        if (file_exists($this->directory)) {
            Twig_Tests_FilesystemHelper::removeDir($this->directory);
        }
    }

    public function testLoad()
    {
        $key = $this->directory.'/cache/cachefile.php';

        $dir = \dirname($key);
        @mkdir($dir, 0777, true);
        $this->assertTrue(is_dir($dir));
        $this->assertFalse(class_exists($this->classname, false));

        $content = $this->generateSource();
        file_put_contents($key, $content);

        $this->cache->load($key);

        $this->assertTrue(class_exists($this->classname, false));
    }

    public function testLoadMissing()
    {
        $key = $this->directory.'/cache/cachefile.php';

        $this->assertFalse(class_exists($this->classname, false));

        $this->cache->load($key);

        $this->assertFalse(class_exists($this->classname, false));
    }

    public function testWrite()
    {
        $key = $this->directory.'/cache/cachefile.php';
        $content = $this->generateSource();

        $this->assertFileNotExists($key);
        $this->assertFileNotExists($this->directory);

        $this->cache->write($key, $content);

        $this->assertFileExists($this->directory);
        $this->assertFileExists($key);
        $this->assertSame(file_get_contents($key), $content);
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage Unable to create the cache directory
     */
    public function testWriteFailMkdir()
    {
        if (\defined('PHP_WINDOWS_VERSION_BUILD')) {
            $this->markTestSkipped('Read-only directories not possible on Windows.');
        }

        $key = $this->directory.'/cache/cachefile.php';
        $content = $this->generateSource();

        $this->assertFileNotExists($key);

        // Create read-only root directory.
        @mkdir($this->directory, 0555, true);
        $this->assertTrue(is_dir($this->directory));

        $this->cache->write($key, $content);
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage Unable to write in the cache directory
     */
    public function testWriteFailDirWritable()
    {
        if (\defined('PHP_WINDOWS_VERSION_BUILD')) {
            $this->markTestSkipped('Read-only directories not possible on Windows.');
        }

        $key = $this->directory.'/cache/cachefile.php';
        $content = $this->generateSource();

        $this->assertFileNotExists($key);

        // Create root directory.
        @mkdir($this->directory, 0777, true);
        // Create read-only subdirectory.
        @mkdir($this->directory.'/cache', 0555);
        $this->assertTrue(is_dir($this->directory.'/cache'));

        $this->cache->write($key, $content);
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage Failed to write cache file
     */
    public function testWriteFailWriteFile()
    {
        $key = $this->directory.'/cache/cachefile.php';
        $content = $this->generateSource();

        $this->assertFileNotExists($key);

        // Create a directory in the place of the cache file.
        @mkdir($key, 0777, true);
        $this->assertTrue(is_dir($key));

        $this->cache->write($key, $content);
    }

    public function testGetTimestamp()
    {
        $key = $this->directory.'/cache/cachefile.php';

        $dir = \dirname($key);
        @mkdir($dir, 0777, true);
        $this->assertTrue(is_dir($dir));

        // Create the file with a specific modification time.
        touch($key, 1234567890);

        $this->assertSame(1234567890, $this->cache->getTimestamp($key));
    }

    public function testGetTimestampMissingFile()
    {
        $key = $this->directory.'/cache/cachefile.php';
        $this->assertSame(0, $this->cache->getTimestamp($key));
    }

    /**
     * Test file cache is tolerant towards trailing (back)slashes on the configured cache directory.
     *
     * @dataProvider provideDirectories
     */
    public function testGenerateKey($expected, $input)
    {
        $cache = new FilesystemCache($input);
        $this->assertRegExp($expected, $cache->generateKey('_test_', \get_class($this)));
    }

    public function provideDirectories()
    {
        $pattern = '#a/b/[a-zA-Z0-9]+/[a-zA-Z0-9]+.php$#';

        return [
            [$pattern, 'a/b'],
            [$pattern, 'a/b/'],
            [$pattern, 'a/b\\'],
            [$pattern, 'a/b\\/'],
            [$pattern, 'a/b\\//'],
            ['#/'.substr($pattern, 1), '/a/b'],
        ];
    }

    private function generateSource()
    {
        return strtr('<?php class {{classname}} {}', [
            '{{classname}}' => $this->classname,
        ]);
    }
}
