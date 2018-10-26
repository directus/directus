<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Call;

use Exception;
use Prophecy\Argument\ArgumentsWildcard;

/**
 * Call object.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class Call
{
    private $methodName;
    private $arguments;
    private $returnValue;
    private $exception;
    private $file;
    private $line;
    private $scores;

    /**
     * Initializes call.
     *
     * @param string      $methodName
     * @param array       $arguments
     * @param mixed       $returnValue
     * @param Exception   $exception
     * @param null|string $file
     * @param null|int    $line
     */
    public function __construct($methodName, array $arguments, $returnValue,
                                Exception $exception = null, $file, $line)
    {
        $this->methodName  = $methodName;
        $this->arguments   = $arguments;
        $this->returnValue = $returnValue;
        $this->exception   = $exception;
        $this->scores      = new \SplObjectStorage();

        if ($file) {
            $this->file = $file;
            $this->line = intval($line);
        }
    }

    /**
     * Returns called method name.
     *
     * @return string
     */
    public function getMethodName()
    {
        return $this->methodName;
    }

    /**
     * Returns called method arguments.
     *
     * @return array
     */
    public function getArguments()
    {
        return $this->arguments;
    }

    /**
     * Returns called method return value.
     *
     * @return null|mixed
     */
    public function getReturnValue()
    {
        return $this->returnValue;
    }

    /**
     * Returns exception that call thrown.
     *
     * @return null|Exception
     */
    public function getException()
    {
        return $this->exception;
    }

    /**
     * Returns callee filename.
     *
     * @return string
     */
    public function getFile()
    {
        return $this->file;
    }

    /**
     * Returns callee line number.
     *
     * @return int
     */
    public function getLine()
    {
        return $this->line;
    }

    /**
     * Returns short notation for callee place.
     *
     * @return string
     */
    public function getCallPlace()
    {
        if (null === $this->file) {
            return 'unknown';
        }

        return sprintf('%s:%d', $this->file, $this->line);
    }

    /**
     * Adds the wildcard match score for the provided wildcard.
     *
     * @param ArgumentsWildcard $wildcard
     * @param false|int $score
     *
     * @return $this
     */
    public function addScore(ArgumentsWildcard $wildcard, $score)
    {
        $this->scores[$wildcard] = $score;

        return $this;
    }

    /**
     * Returns wildcard match score for the provided wildcard. The score is
     * calculated if not already done.
     *
     * @param ArgumentsWildcard $wildcard
     *
     * @return false|int False OR integer score (higher - better)
     */
    public function getScore(ArgumentsWildcard $wildcard)
    {
        if (isset($this->scores[$wildcard])) {
            return $this->scores[$wildcard];
        }

        return $this->scores[$wildcard] = $wildcard->scoreArguments($this->getArguments());
    }
}
