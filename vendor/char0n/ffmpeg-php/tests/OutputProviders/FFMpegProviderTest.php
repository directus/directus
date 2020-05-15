<?php
namespace Char0n\FFMpegPHP\Tests\OutputProviders;

use PHPUnit\Framework\TestCase;
use Char0n\FFMpegPHP\OutputProviders\FFMpegProvider;

class FFmpegProviderTest extends TestCase
{

    protected static $moviePath;
    /**
     * @var FFMpegProvider
     */
    protected $provider;

    public static function setUpBeforeClass()
    {
        $path = dirname(__FILE__).DIRECTORY_SEPARATOR.'..'.DIRECTORY_SEPARATOR.'data'.DIRECTORY_SEPARATOR;
        self::$moviePath = realpath($path.'test.mp4');
    }

    public static function tearDownAfterClass()
    {
        self::$moviePath   = null;
    }

    public function setUp()
    {
        $this->provider = new FFMpegProvider();
        $this->provider->setMovieFile(self::$moviePath);
    }

    public function tearDown()
    {
        $this->provider = null;
    }

    public function testGetOutput()
    {
        $output = $this->provider->getOutput();
        $this->assertEquals(1, preg_match('/FFmpeg version/i', $output));
    }

    public function testGetOutputFileDoesntExist()
    {
        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionCode(334561);

        $provider = new FFMpegProvider();
        $provider->setMovieFile(uniqid('test', true));
        $provider->getOutput();
    }

    public function testPersistentResourceSimulation()
    {
        \PHP_Timer::start();
        $provider = new FFMpegProvider('ffmpeg', true);
        $provider->setMovieFile(self::$moviePath);
        $provider->getOutput();
        $provider = clone $provider;
        $provider->getOutput();
        $provider = clone $provider;
        $provider->getOutput();
        $elapsed = \PHP_Timer::stop();

        \PHP_Timer::start();
        $provider = new FFMpegProvider('ffmpeg', false);
        $provider->setMovieFile(self::$moviePath);
        $provider->getOutput();
        $provider = clone $provider;
        $provider->getOutput();
        $provider = clone $provider;
        $provider->getOutput();
        $elapsed1 = \PHP_Timer::stop();
        $this->assertGreaterThan($elapsed, $elapsed1, 'Persistent resource simulation should be faster');
    }

    public function testSerializeUnserialize()
    {
        $output = $this->provider->getOutput();
        $serialized  = serialize($this->provider);
        $this->provider = null;
        $this->provider = unserialize($serialized);
        $this->assertEquals(
            $output,
            $this->provider->getOutput(),
            'Output from original and unserialized provider should be equal'
        );
    }
}
