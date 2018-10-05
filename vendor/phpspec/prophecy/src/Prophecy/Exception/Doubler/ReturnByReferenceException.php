<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Exception\Doubler;

class ReturnByReferenceException extends DoubleException
{
    private $classname;
    private $methodName;

    /**
     * @param string $message
     * @param string $classname
     * @param string $methodName
     */
    public function __construct($message, $classname, $methodName)
    {
        parent::__construct($message);

        $this->classname  = $classname;
        $this->methodName = $methodName;
    }

    public function getClassname()
    {
        return $this->classname;
    }

    public function getMethodName()
    {
        return $this->methodName;
    }
}
