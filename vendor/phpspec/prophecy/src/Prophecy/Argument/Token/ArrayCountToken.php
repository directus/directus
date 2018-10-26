<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Argument\Token;

/**
 * Array elements count token.
 *
 * @author Boris Mikhaylov <kaguxmail@gmail.com>
 */

class ArrayCountToken implements TokenInterface
{
    private $count;

    /**
     * @param integer $value
     */
    public function __construct($value)
    {
        $this->count = $value;
    }

    /**
     * Scores 6 when argument has preset number of elements.
     *
     * @param $argument
     *
     * @return bool|int
     */
    public function scoreArgument($argument)
    {
        return $this->isCountable($argument) && $this->hasProperCount($argument) ? 6 : false;
    }

    /**
     * Returns false.
     *
     * @return boolean
     */
    public function isLast()
    {
        return false;
    }

    /**
     * Returns string representation for token.
     *
     * @return string
     */
    public function __toString()
    {
        return sprintf('count(%s)', $this->count);
    }

    /**
     * Returns true if object is either array or instance of \Countable
     *
     * @param $argument
     * @return bool
     */
    private function isCountable($argument)
    {
        return (is_array($argument) || $argument instanceof \Countable);
    }

    /**
     * Returns true if $argument has expected number of elements
     *
     * @param array|\Countable $argument
     *
     * @return bool
     */
    private function hasProperCount($argument)
    {
        return $this->count === count($argument);
    }
}
