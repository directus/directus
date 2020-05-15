<?php
namespace Char0n\FFMpegPHP\OutputProviders;

/**
 * OutputProvider interface of all output providers.
 */
interface OutputProvider
{

    /**
     * Setting movie file path.
     *
     * @param string $movieFile
     */
    public function setMovieFile($movieFile);
    
    /**
     * Getting parsable output.
     *
     * @return string
     */
    public function getOutput();
}
