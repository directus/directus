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

use Prophecy\Util\StringUtil;

/**
 * Identical value token.
 *
 * @author Florian Voutzinos <florian@voutzinos.com>
 */
class IdenticalValueToken implements TokenInterface
{
    private $value;
    private $string;
    private $util;

    /**
     * Initializes token.
     *
     * @param mixed      $value
     * @param StringUtil $util
     */
    public function __construct($value, StringUtil $util = null)
    {
        $this->value = $value;
        $this->util  = $util ?: new StringUtil();
    }

    /**
     * Scores 11 if argument matches preset value.
     *
     * @param $argument
     *
     * @return bool|int
     */
    public function scoreArgument($argument)
    {
        return $argument === $this->value ? 11 : false;
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
        if (null === $this->string) {
            $this->string = sprintf('identical(%s)', $this->util->stringify($this->value));
        }

        return $this->string;
    }
}
