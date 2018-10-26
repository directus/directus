<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Exception\Prediction;

use Prophecy\Prophecy\ObjectProphecy;

class AggregateException extends \RuntimeException implements PredictionException
{
    private $exceptions = array();
    private $objectProphecy;

    public function append(PredictionException $exception)
    {
        $message = $exception->getMessage();
        $message = strtr($message, array("\n" => "\n  "))."\n";
        $message = empty($this->exceptions) ? $message : "\n" . $message;

        $this->message      = rtrim($this->message.$message);
        $this->exceptions[] = $exception;
    }

    /**
     * @return PredictionException[]
     */
    public function getExceptions()
    {
        return $this->exceptions;
    }

    public function setObjectProphecy(ObjectProphecy $objectProphecy)
    {
        $this->objectProphecy = $objectProphecy;
    }

    /**
     * @return ObjectProphecy
     */
    public function getObjectProphecy()
    {
        return $this->objectProphecy;
    }
}
