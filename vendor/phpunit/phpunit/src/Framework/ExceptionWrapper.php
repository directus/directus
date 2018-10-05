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
 * Wraps Exceptions thrown by code under test.
 *
 * Re-instantiates Exceptions thrown by user-space code to retain their original
 * class names, properties, and stack traces (but without arguments).
 *
 * Unlike PHPUnit_Framework_Exception, the complete stack of previous Exceptions
 * is processed.
 */
class PHPUnit_Framework_ExceptionWrapper extends PHPUnit_Framework_Exception
{
    /**
     * @var string
     */
    protected $className;

    /**
     * @var PHPUnit_Framework_ExceptionWrapper|null
     */
    protected $previous;

    /**
     * @param Throwable|Exception $e
     */
    public function __construct($e)
    {
        // PDOException::getCode() is a string.
        // @see http://php.net/manual/en/class.pdoexception.php#95812
        parent::__construct($e->getMessage(), (int) $e->getCode());

        $this->className = get_class($e);
        $this->file      = $e->getFile();
        $this->line      = $e->getLine();

        $this->serializableTrace = $e->getTrace();

        foreach ($this->serializableTrace as $i => $call) {
            unset($this->serializableTrace[$i]['args']);
        }

        if ($e->getPrevious()) {
            $this->previous = new self($e->getPrevious());
        }
    }

    /**
     * @return string
     */
    public function getClassName()
    {
        return $this->className;
    }

    /**
     * @return PHPUnit_Framework_ExceptionWrapper
     */
    public function getPreviousWrapped()
    {
        return $this->previous;
    }

    /**
     * @return string
     */
    public function __toString()
    {
        $string = PHPUnit_Framework_TestFailure::exceptionToString($this);

        if ($trace = PHPUnit_Util_Filter::getFilteredStacktrace($this)) {
            $string .= "\n" . $trace;
        }

        if ($this->previous) {
            $string .= "\nCaused by\n" . $this->previous;
        }

        return $string;
    }
}
