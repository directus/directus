<?php
namespace Char0n\FFMpegPHP\OutputProviders;

/**
 * StringOutputProvider ffmpeg provider implementation.
 */
class StringProvider extends AbstractProvider
{
    
    protected $output;

    /**
     * This class is handy for testing purposes.
     *
     * @param string $ffmpegBinary Path to ffmpeg executable.
     * @param boolean $persistent Persistent functionality on/off.
     */
    public function __construct($ffmpegBinary = 'ffmpeg', $persistent = false)
    {
        $this->output = '';
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
        $bufferKey = get_class($this).$this->binary.$this->movieFile;

        if (true === $this->persistent
            && array_key_exists($bufferKey, self::$persistentBuffer)
        ) {
            return self::$persistentBuffer[$bufferKey];
        }

        return $this->output;
    }

    /**
     * Setting parsable output.
     *
     * @param string $output
     */
    public function setOutput($output)
    {
        $this->output = $output;
        
        // Storing persistent opening
        if (true === $this->persistent) {
            self::$persistentBuffer[get_class($this).$this->binary.$this->movieFile] = $output;
        }
    }
}
