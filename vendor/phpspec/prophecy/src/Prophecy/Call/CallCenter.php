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

use Prophecy\Exception\Prophecy\MethodProphecyException;
use Prophecy\Prophecy\MethodProphecy;
use Prophecy\Prophecy\ObjectProphecy;
use Prophecy\Argument\ArgumentsWildcard;
use Prophecy\Util\StringUtil;
use Prophecy\Exception\Call\UnexpectedCallException;

/**
 * Calls receiver & manager.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class CallCenter
{
    private $util;

    /**
     * @var Call[]
     */
    private $recordedCalls = array();

    /**
     * Initializes call center.
     *
     * @param StringUtil $util
     */
    public function __construct(StringUtil $util = null)
    {
        $this->util = $util ?: new StringUtil;
    }

    /**
     * Makes and records specific method call for object prophecy.
     *
     * @param ObjectProphecy $prophecy
     * @param string         $methodName
     * @param array          $arguments
     *
     * @return mixed Returns null if no promise for prophecy found or promise return value.
     *
     * @throws \Prophecy\Exception\Call\UnexpectedCallException If no appropriate method prophecy found
     */
    public function makeCall(ObjectProphecy $prophecy, $methodName, array $arguments)
    {
        // For efficiency exclude 'args' from the generated backtrace
        if (PHP_VERSION_ID >= 50400) {
            // Limit backtrace to last 3 calls as we don't use the rest
            // Limit argument was introduced in PHP 5.4.0
            $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
        } elseif (defined('DEBUG_BACKTRACE_IGNORE_ARGS')) {
            // DEBUG_BACKTRACE_IGNORE_ARGS was introduced in PHP 5.3.6
            $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
        } else {
            $backtrace = debug_backtrace();
        }

        $file = $line = null;
        if (isset($backtrace[2]) && isset($backtrace[2]['file'])) {
            $file = $backtrace[2]['file'];
            $line = $backtrace[2]['line'];
        }

        // If no method prophecies defined, then it's a dummy, so we'll just return null
        if ('__destruct' === $methodName || 0 == count($prophecy->getMethodProphecies())) {
            $this->recordedCalls[] = new Call($methodName, $arguments, null, null, $file, $line);

            return null;
        }

        // There are method prophecies, so it's a fake/stub. Searching prophecy for this call
        $matches = array();
        foreach ($prophecy->getMethodProphecies($methodName) as $methodProphecy) {
            if (0 < $score = $methodProphecy->getArgumentsWildcard()->scoreArguments($arguments)) {
                $matches[] = array($score, $methodProphecy);
            }
        }

        // If fake/stub doesn't have method prophecy for this call - throw exception
        if (!count($matches)) {
            throw $this->createUnexpectedCallException($prophecy, $methodName, $arguments);
        }

        // Sort matches by their score value
        @usort($matches, function ($match1, $match2) { return $match2[0] - $match1[0]; });

        $score = $matches[0][0];
        // If Highest rated method prophecy has a promise - execute it or return null instead
        $methodProphecy = $matches[0][1];
        $returnValue = null;
        $exception   = null;
        if ($promise = $methodProphecy->getPromise()) {
            try {
                $returnValue = $promise->execute($arguments, $prophecy, $methodProphecy);
            } catch (\Exception $e) {
                $exception = $e;
            }
        }

        if ($methodProphecy->hasReturnVoid() && $returnValue !== null) {
            throw new MethodProphecyException(
                "The method \"$methodName\" has a void return type, but the promise returned a value",
                $methodProphecy
            );
        }

        $this->recordedCalls[] = $call = new Call(
            $methodName, $arguments, $returnValue, $exception, $file, $line
        );
        $call->addScore($methodProphecy->getArgumentsWildcard(), $score);

        if (null !== $exception) {
            throw $exception;
        }

        return $returnValue;
    }

    /**
     * Searches for calls by method name & arguments wildcard.
     *
     * @param string            $methodName
     * @param ArgumentsWildcard $wildcard
     *
     * @return Call[]
     */
    public function findCalls($methodName, ArgumentsWildcard $wildcard)
    {
        return array_values(
            array_filter($this->recordedCalls, function (Call $call) use ($methodName, $wildcard) {
                return $methodName === $call->getMethodName()
                    && 0 < $call->getScore($wildcard)
                ;
            })
        );
    }

    private function createUnexpectedCallException(ObjectProphecy $prophecy, $methodName,
                                                   array $arguments)
    {
        $classname = get_class($prophecy->reveal());
        $indentationLength = 8; // looks good
        $argstring = implode(
            ",\n",
            $this->indentArguments(
                array_map(array($this->util, 'stringify'), $arguments),
                $indentationLength
            )
        );

        $expected = array();

        foreach (call_user_func_array('array_merge', $prophecy->getMethodProphecies()) as $methodProphecy) {
            $expected[] = sprintf(
                "  - %s(\n" .
                "%s\n" .
                "    )",
                $methodProphecy->getMethodName(),
                implode(
                    ",\n",
                    $this->indentArguments(
                        array_map('strval', $methodProphecy->getArgumentsWildcard()->getTokens()),
                        $indentationLength
                    )
                )
            );
        }

        return new UnexpectedCallException(
            sprintf(
                "Unexpected method call on %s:\n".
                "  - %s(\n".
                "%s\n".
                "    )\n".
                "expected calls were:\n".
                "%s",

                $classname, $methodName, $argstring, implode("\n", $expected)
            ),
            $prophecy, $methodName, $arguments

        );
    }

    private function formatExceptionMessage(MethodProphecy $methodProphecy)
    {
        return sprintf(
            "  - %s(\n".
            "%s\n".
            "    )",
            $methodProphecy->getMethodName(),
            implode(
                ",\n",
                $this->indentArguments(
                    array_map(
                        function ($token) {
                            return (string) $token;
                        },
                        $methodProphecy->getArgumentsWildcard()->getTokens()
                    ),
                    $indentationLength
                )
            )
        );
    }

    private function indentArguments(array $arguments, $indentationLength)
    {
        return preg_replace_callback(
            '/^/m',
            function () use ($indentationLength) {
                return str_repeat(' ', $indentationLength);
            },
            $arguments
        );
    }
}
