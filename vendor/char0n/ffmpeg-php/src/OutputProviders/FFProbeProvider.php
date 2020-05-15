<?php
namespace Char0n\FFMpegPHP\OutputProviders;

/**
 * FFProbeProvider ffprobe provider implementation.
 */
class FFProbeProvider extends AbstractProvider
{
    protected static $EX_CODE_NO_FFPROBE = 334563;

    /**
     * Constructor
     *
     * @param string $ffprobeBinary path to ffprobe executable.
     * @param boolean $persistent persistent functionality on/off.
     */
    public function __construct($ffprobeBinary = 'ffprobe', $persistent = false)
    {
        parent::__construct($ffprobeBinary, $persistent);
    }

    /**
     * Getting parsable output from ffprobe binary.
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

        // Get information about file from ffprobe
        $output = [];

        exec($this->binary.' '.escapeshellarg($this->movieFile).' 2>&1', $output, $retVar);
        $output = implode(PHP_EOL, $output);

        // ffprobe installed
        if (!preg_match('/FFprobe version/i', $output)) {
            throw new \RuntimeException('FFprobe is not installed on host server', self::$EX_CODE_NO_FFPROBE);
        }

        // Storing persistent opening
        if (true === $this->persistent) {
            self::$persistentBuffer[get_class($this).$this->binary.$this->movieFile] = $output;
        }

        return $output;
    }
}
