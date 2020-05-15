<?php

namespace Char0n\FFMpegPHP\Tests;

use Char0n\FFMpegPHP\Movie;
use Char0n\FFMpegPHP\Frame;
use PHPUnit\Framework\TestCase;

class FFmpegFrameTest extends TestCase
{

    protected static $moviePath;
    /**
     * @var Movie
     */
    protected $movie;
    /**
     * @var Frame
     */
    protected $frame;

    public static function setUpBeforeClass()
    {
        self::$moviePath = dirname(__FILE__).DIRECTORY_SEPARATOR.'data'.DIRECTORY_SEPARATOR.'test.mp4';
    }

    public static function tearDownAfterClass()
    {
        self::$moviePath = null;
    }

    public function setUp()
    {
        $this->movie = new Movie(self::$moviePath);
        $this->frame = $this->movie->getFrame(1);
    }

    public function tearDown()
    {
        $this->movie = null;
        $this->frame = null;
    }

    /**
     * @expectedException \Exception
     * @expectedExceptionCode 334563
     */
    public function testConstructor()
    {
        new Frame('test', 0.0);
    }

    public function testFrameExtracted()
    {
        $this->assertInstanceOf(Frame::class, $this->frame);
    }

    public function testGetWidth()
    {
        $this->assertInternalType('int', $this->frame->getWidth(), 'Frame width is of integer type');
        $this->assertEquals(640, $this->frame->getWidth(), 'Frame width should be int(640)');
    }

    public function testGetHeight()
    {
        $this->assertInternalType('int', $this->frame->getHeight(), 'Frame height is of integer type');
        $this->assertEquals(272, $this->frame->getHeight(), 'Frame height should be int(272)');
    }

    public function testGetPts()
    {
        $this->assertInternalType('float', $this->frame->getPts(), 'Pts is of integer type');
        $this->assertEquals(0.0, $this->frame->getPts(), 'Pts should be float(0.0)');
    }

    public function testGetPresentationTimestamp()
    {
        $this->assertInternalType(
            'float',
            $this->frame->getPresentationTimestamp(),
            'Presentation timestamp is of integer type'
        );
        $this->assertEquals(
            0.0,
            $this->frame->getPresentationTimestamp(),
            'Presentation timestamp should be float(0.0)'
        );
        $this->assertEquals(
            $this->frame->getPts(),
            $this->frame->getPresentationTimestamp(),
            'Presentation timestamp should equal Pts'
        );
    }

    public function testResize()
    {
        $oldWidth  = $this->frame->getWidth();
        $oldHeight = $this->frame->getHeight();

        $this->frame->resize(300, 300);
        $this->assertInternalType('int', $this->frame->getWidth(), 'Frame width is of integer type');
        $this->assertEquals(300, $this->frame->getWidth(), 'Frame width should be int(300)');
        $this->assertInternalType('int', $this->frame->getHeight(), 'Frame height is of integer type');
        $this->assertEquals(300, $this->frame->getHeight(), 'Frame height should be int(300)');
        $this->frame->resize($oldWidth, $oldHeight);
        $this->assertInternalType('int', $this->frame->getWidth(), 'Frame width is of integer type');
        $this->assertEquals(640, $this->frame->getWidth(), 'Frame width should be int(640)');
        $this->assertInternalType('int', $this->frame->getHeight(), 'Frame height is of integer type');
        $this->assertEquals(272, $this->frame->getHeight(), 'Frame height should be int(272)');
    }

    public function testCrop()
    {
        $oldWidth  = $this->frame->getWidth();
        $oldHeight = $this->frame->getHeight();

        $this->frame->crop(100);
        $this->assertInternalType('int', $this->frame->getWidth(), 'Frame width is of integer type');
        $this->assertEquals(640, $this->frame->getWidth(), 'Frame width should be int(300)');
        $this->assertInternalType('int', $this->frame->getHeight(), 'Frame height is of integer type');
        $this->assertEquals(172, $this->frame->getHeight(), 'Frame height should be int(172)');
        $this->frame->resize($oldWidth, $oldHeight);
        $this->assertInternalType('int', $this->frame->getWidth(), 'Frame width is of integer type');
        $this->assertEquals(640, $this->frame->getWidth(), 'Frame width should be int(640)');
        $this->assertInternalType('int', $this->frame->getHeight(), 'Frame height is of integer type');
        $this->assertEquals(272, $this->frame->getHeight(), 'Frame height should be int(272)');
    }

    public function testToGdImage()
    {
        $this->assertInternalType('resource', $this->frame->toGdImage(), 'GdImage is of resource(gd2) type');
    }

    public function testSerializeUnserialize()
    {
        $serialized  = serialize($this->frame);
        $this->frame = null;
        $this->frame = unserialize($serialized);
        $this->assertInternalType('int', $this->frame->getWidth(), 'Frame width is of integer type');
        $this->assertEquals(640, $this->frame->getWidth(), 'Frame width should be int(640)');
        $this->assertInternalType('int', $this->frame->getHeight(), 'Frame height is of integer type');
        $this->assertEquals(272, $this->frame->getHeight(), 'Frame height should be int(272)');
    }

    public function testClone()
    {
        $uoid   = (string) $this->frame->toGdImage();
        $cloned = clone $this->frame;
        $cuoid  = (string) $cloned->toGdImage();
        $this->assertNotEquals($uoid, $cuoid);
    }
}
