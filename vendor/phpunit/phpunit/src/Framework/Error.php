<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Wrapper for PHP errors.
 */
class PHPUnit_Framework_Error extends PHPUnit_Framework_Exception
{
    /**
     * Constructor.
     *
     * @param string    $message
     * @param int       $code
     * @param string    $file
     * @param int       $line
     * @param Exception $previous
     */
    public function __construct($message, $code, $file, $line, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);

        $this->file  = $file;
        $this->line  = $line;
    }
}
