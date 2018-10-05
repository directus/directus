<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Prediction;

use Prophecy\Call\Call;
use Prophecy\Prophecy\ObjectProphecy;
use Prophecy\Prophecy\MethodProphecy;
use Prophecy\Util\StringUtil;
use Prophecy\Exception\Prediction\UnexpectedCallsException;

/**
 * No calls prediction.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class NoCallsPrediction implements PredictionInterface
{
    private $util;

    /**
     * Initializes prediction.
     *
     * @param null|StringUtil $util
     */
    public function __construct(StringUtil $util = null)
    {
        $this->util = $util ?: new StringUtil;
    }

    /**
     * Tests that there were no calls made.
     *
     * @param Call[]         $calls
     * @param ObjectProphecy $object
     * @param MethodProphecy $method
     *
     * @throws \Prophecy\Exception\Prediction\UnexpectedCallsException
     */
    public function check(array $calls, ObjectProphecy $object, MethodProphecy $method)
    {
        if (!count($calls)) {
            return;
        }

        $verb = count($calls) === 1 ? 'was' : 'were';

        throw new UnexpectedCallsException(sprintf(
            "No calls expected that match:\n".
            "  %s->%s(%s)\n".
            "but %d %s made:\n%s",
            get_class($object->reveal()),
            $method->getMethodName(),
            $method->getArgumentsWildcard(),
            count($calls),
            $verb,
            $this->util->stringifyCalls($calls)
        ), $method, $calls);
    }
}
