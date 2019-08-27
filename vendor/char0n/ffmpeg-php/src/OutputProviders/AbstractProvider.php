<?php
namespace Char0n\FFMpegPHP\OutputProviders;

/**
 * AbstractProvider parent of all output providers.
 */
abstract class AbstractProvider implements OutputProvider, \Serializable
{

    protected static $EX_CODE_FILE_NOT_FOUND = 334561;
    protected static $persistentBuffer = array();
    
    /**
     * Binary that returns info about movie file
     *
     * @var string
     */
    protected $binary;
    
    /**
     * Movie File path
     *
     * @var string
     */
    protected $movieFile;
    
    /**
     * Persistent functionality on/off
     *
     * @var boolean
     */
    protected $persistent;
    
    /**
     * Base constructor for every provider
     *
     * @param string $binary Binary that returns info about movie file
     * @param boolean $persistent Persistent functionality on/off
     */
    public function __construct($binary, $persistent)
    {
        $this->binary     = $binary;
        $this->persistent = $persistent;
    }
    
    /**
     * Setting movie file path
     *
     * @param string $movieFile
     */
    public function setMovieFile($movieFile)
    {
        $this->movieFile = $movieFile;
    }
    
    public function serialize()
    {
        return serialize(array(
            $this->binary,
            $this->movieFile,
            $this->persistent
        ));
    }
    
    public function unserialize($serialized)
    {
        list(
            $this->binary,
            $this->movieFile,
            $this->persistent
        ) = unserialize($serialized);
    }
}
