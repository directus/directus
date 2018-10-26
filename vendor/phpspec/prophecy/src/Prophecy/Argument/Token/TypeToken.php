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

use Prophecy\Exception\InvalidArgumentException;

/**
 * Value type token.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class TypeToken implements TokenInterface
{
    private $type;

    /**
     * @param string $type
     */
    public function __construct($type)
    {
        $checker = "is_{$type}";
        if (!function_exists($checker) && !interface_exists($type) && !class_exists($type)) {
            throw new InvalidArgumentException(sprintf(
                'Type or class name expected as an argument to TypeToken, but got %s.', $type
            ));
        }

        $this->type = $type;
    }

    /**
     * Scores 5 if argument has the same type this token was constructed with.
     *
     * @param $argument
     *
     * @return bool|int
     */
    public function scoreArgument($argument)
    {
        $checker = "is_{$this->type}";
        if (function_exists($checker)) {
            return call_user_func($checker, $argument) ? 5 : false;
        }

        return $argument instanceof $this->type ? 5 : false;
    }

    /**
     * Returns false.
     *
     * @return bool
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
        return sprintf('type(%s)', $this->type);
    }
}
