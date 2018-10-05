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
 * Creates a synthetic failed assertion.
 */
class PHPUnit_Framework_SyntheticError extends PHPUnit_Framework_AssertionFailedError
{
    /**
     * The synthetic file.
     *
     * @var string
     */
    protected $syntheticFile = '';

    /**
     * The synthetic line number.
     *
     * @var int
     */
    protected $syntheticLine = 0;

    /**
     * The synthetic trace.
     *
     * @var array
     */
    protected $syntheticTrace = [];

    /**
     * Constructor.
     *
     * @param string $message
     * @param int    $code
     * @param string $file
     * @param int    $line
     * @param array  $trace
     */
    public function __construct($message, $code, $file, $line, $trace)
    {
        parent::__construct($message, $code);

        $this->syntheticFile  = $file;
        $this->syntheticLine  = $line;
        $this->syntheticTrace = $trace;
    }

    /**
     * @return string
     */
    public function getSyntheticFile()
    {
        return $this->syntheticFile;
    }

    /**
     * @return int
     */
    public function getSyntheticLine()
    {
        return $this->syntheticLine;
    }

    /**
     * @return array
     */
    public function getSyntheticTrace()
    {
        return $this->syntheticTrace;
    }
}
