<?php
namespace Char0n\FFMpegPHP\OutputProviders;

/**
 * FFmpegOutputProvider ffmpeg provider implementation.
 */
class FFMpegProvider extends AbstractProvider
{
    protected static $EX_CODE_NO_FFMPEG = 334560;

    /**
     * Constructor
     *
     * @param string $ffmpegBinary Path to ffmpeg executable.
     * @param boolean $persistent Persistent functionality on/off.
     */
    public function __construct($ffmpegBinary = 'ffmpeg', $persistent = false)
    {
        parent::__construct($ffmpegBinary, $persistent);
    }

    /**
     * Getting parsable output from ffmpeg binary.
     *
     * @return string
     */
    public function getOutput()
    {
        // Persistent opening
        if (true === $this->persistent
            && array_key_exists(get_class($this).$this->binary.$this->movieFile, self::$persistentBuffer)
        ) {
            return self::$persistentBuffer[get_class($this).$this->binary.$this->movieFile];
        }

        // File doesn't exist
        if (!file_exists($this->movieFile)) {
            throw new \UnexpectedValueException('Movie file not found', self::$EX_CODE_FILE_NOT_FOUND);
        }

        // Get information about file from ffmpeg
        $output = [];

        exec($this->binary.' -i '.escapeshellarg($this->movieFile).' 2>&1', $output, $retVar);
        $output = implode(PHP_EOL, $output);

        // ffmpeg installed
        if (!preg_match('/FFmpeg version/i', $output)) {
            throw new \RuntimeException('FFmpeg is not installed on host server', self::$EX_CODE_NO_FFMPEG);
        }

        // Storing persistent opening
        if (true === $this->persistent) {
            self::$persistentBuffer[get_class($this).$this->binary.$this->movieFile] = $output;
        }

        return $output;
    }
}
