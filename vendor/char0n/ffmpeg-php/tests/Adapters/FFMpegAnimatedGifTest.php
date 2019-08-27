<?php
namespace Char0n\FFMpegPHP\Tests\Adapters;

use PHPUnit\Framework\TestCase;
use Char0n\FFMpegPHP\Adapters\FFMpegMovie;
use Char0n\FFMpegPHP\Adapters\FFMpegFrame;
use Char0n\FFMpegPHP\Adapters\FFMpegAnimatedGif;

class FFMpegAnimatedGifTest extends TestCase
{

    protected static $outFilePath;
    protected static $moviePath;
    /**
     * @var FFMpegMovie
     */
    protected $movie;
    /**
     * @var FFMpegFrame
     */
    protected $frame1;
    /**
     * @var FFMpegFrame
     */
    protected $frame2;
    /**
     * @var FFMpegAnimatedGif
     */
    protected $anim;

    public static function setUpBeforeClass()
    {
        self::$outFilePath = sys_get_temp_dir().DIRECTORY_SEPARATOR.uniqid('anim', true).'.gif';
        self::$moviePath   = realpath(
            dirname(__FILE__).DIRECTORY_SEPARATOR.'..'.DIRECTORY_SEPARATOR.'data'.DIRECTORY_SEPARATOR.'test.mp4'
        );
    }

    public static function tearDownAfterClass()
    {
        self::$outFilePath = null;
        self::$moviePath   = null;
    }

    public function setUp()
    {
        $this->movie  = new FFMpegMovie(self::$moviePath);
        $this->frame1 = $this->movie->getFrame(1);
        $this->frame2 = $this->movie->getFrame(2);
        $this->anim   = new FFMpegAnimatedGif(self::$outFilePath, 100, 120, 1, 0);
    }

    public function tearDown()
    {
        $this->movie  = null;
        $this->frame1 = null;
        $this->frame2 = null;
        $this->anim   = null;
        if (file_exists(self::$outFilePath)) {
            unlink(self::$outFilePath);
        }
    }

    public function testAddFrame()
    {
        $frame        = $this->movie->getFrame(3);
        $memoryBefore = memory_get_usage();

        $this->anim->addFrame($frame);

        $memoryAfter  = memory_get_usage();

        $this->assertGreaterThan($memoryBefore, $memoryAfter, 'Memory usage should be higher after adding frame');
    }

    public function testSerializeUnserialize()
    {
        $this->anim->addFrame($this->frame1);
        $this->anim->addFrame($this->frame2);

        $serialized = serialize($this->anim);
        $this->anim = null;
        $this->anim = unserialize($serialized);

        $saveResult = $this->anim->addFrame($this->frame1);
        $this->assertTrue($saveResult, 'Save result should be true');
        $this->assertTrue(file_exists(self::$outFilePath), 'File "'.self::$outFilePath.'" should exist after saving');
        $this->assertGreaterThan(
            30000,
            filesize(self::$outFilePath),
            'Animation binary size should be greater than int(30000)'
        );
        $imageInfo = getimagesize(self::$outFilePath);
        $this->assertEquals(100, $imageInfo[0], 'Saved image width should be int(100)');
        $this->assertEquals(120, $imageInfo[1], 'Saved image height should be int(120)');
    }
}
