<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Prophecy;

use Prophecy\Argument;
use Prophecy\Prophet;
use Prophecy\Promise;
use Prophecy\Prediction;
use Prophecy\Exception\Doubler\MethodNotFoundException;
use Prophecy\Exception\InvalidArgumentException;
use Prophecy\Exception\Prophecy\MethodProphecyException;

/**
 * Method prophecy.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class MethodProphecy
{
    private $objectProphecy;
    private $methodName;
    private $argumentsWildcard;
    private $promise;
    private $prediction;
    private $checkedPredictions = array();
    private $bound = false;
    private $voidReturnType = false;

    /**
     * Initializes method prophecy.
     *
     * @param ObjectProphecy                        $objectProphecy
     * @param string                                $methodName
     * @param null|Argument\ArgumentsWildcard|array $arguments
     *
     * @throws \Prophecy\Exception\Doubler\MethodNotFoundException If method not found
     */
    public function __construct(ObjectProphecy $objectProphecy, $methodName, $arguments = null)
    {
        $double = $objectProphecy->reveal();
        if (!method_exists($double, $methodName)) {
            throw new MethodNotFoundException(sprintf(
                'Method `%s::%s()` is not defined.', get_class($double), $methodName
            ), get_class($double), $methodName, $arguments);
        }

        $this->objectProphecy = $objectProphecy;
        $this->methodName     = $methodName;

        $reflectedMethod = new \ReflectionMethod($double, $methodName);
        if ($reflectedMethod->isFinal()) {
            throw new MethodProphecyException(sprintf(
                "Can not add prophecy for a method `%s::%s()`\n".
                "as it is a final method.",
                get_class($double),
                $methodName
            ), $this);
        }

        if (null !== $arguments) {
            $this->withArguments($arguments);
        }

        if (version_compare(PHP_VERSION, '7.0', '>=') && true === $reflectedMethod->hasReturnType()) {
            $type = (string) $reflectedMethod->getReturnType();

            if ('void' === $type) {
                $this->voidReturnType = true;
            }

            $this->will(function () use ($type) {
                switch ($type) {
                    case 'void': return;
                    case 'string': return '';
                    case 'float':  return 0.0;
                    case 'int':    return 0;
                    case 'bool':   return false;
                    case 'array':  return array();

                    case 'callable':
                    case 'Closure':
                        return function () {};

                    case 'Traversable':
                    case 'Generator':
                        // Remove eval() when minimum version >=5.5
                        /** @var callable $generator */
                        $generator = eval('return function () { yield; };');
                        return $generator();

                    default:
                        $prophet = new Prophet;
                        return $prophet->prophesize($type)->reveal();
                }
            });
        }
    }

    /**
     * Sets argument wildcard.
     *
     * @param array|Argument\ArgumentsWildcard $arguments
     *
     * @return $this
     *
     * @throws \Prophecy\Exception\InvalidArgumentException
     */
    public function withArguments($arguments)
    {
        if (is_array($arguments)) {
            $arguments = new Argument\ArgumentsWildcard($arguments);
        }

        if (!$arguments instanceof Argument\ArgumentsWildcard) {
            throw new InvalidArgumentException(sprintf(
                "Either an array or an instance of ArgumentsWildcard expected as\n".
                'a `MethodProphecy::withArguments()` argument, but got %s.',
                gettype($arguments)
            ));
        }

        $this->argumentsWildcard = $arguments;

        return $this;
    }

    /**
     * Sets custom promise to the prophecy.
     *
     * @param callable|Promise\PromiseInterface $promise
     *
     * @return $this
     *
     * @throws \Prophecy\Exception\InvalidArgumentException
     */
    public function will($promise)
    {
        if (is_callable($promise)) {
            $promise = new Promise\CallbackPromise($promise);
        }

        if (!$promise instanceof Promise\PromiseInterface) {
            throw new InvalidArgumentException(sprintf(
                'Expected callable or instance of PromiseInterface, but got %s.',
                gettype($promise)
            ));
        }

        $this->bindToObjectProphecy();
        $this->promise = $promise;

        return $this;
    }

    /**
     * Sets return promise to the prophecy.
     *
     * @see \Prophecy\Promise\ReturnPromise
     *
     * @return $this
     */
    public function willReturn()
    {
        if ($this->voidReturnType) {
            throw new MethodProphecyException(
                "The method \"$this->methodName\" has a void return type, and so cannot return anything",
                $this
            );
        }

        return $this->will(new Promise\ReturnPromise(func_get_args()));
    }

    /**
     * Sets return argument promise to the prophecy.
     *
     * @param int $index The zero-indexed number of the argument to return
     *
     * @see \Prophecy\Promise\ReturnArgumentPromise
     *
     * @return $this
     */
    public function willReturnArgument($index = 0)
    {
        if ($this->voidReturnType) {
            throw new MethodProphecyException("The method \"$this->methodName\" has a void return type", $this);
        }

        return $this->will(new Promise\ReturnArgumentPromise($index));
    }

    /**
     * Sets throw promise to the prophecy.
     *
     * @see \Prophecy\Promise\ThrowPromise
     *
     * @param string|\Exception $exception Exception class or instance
     *
     * @return $this
     */
    public function willThrow($exception)
    {
        return $this->will(new Promise\ThrowPromise($exception));
    }

    /**
     * Sets custom prediction to the prophecy.
     *
     * @param callable|Prediction\PredictionInterface $prediction
     *
     * @return $this
     *
     * @throws \Prophecy\Exception\InvalidArgumentException
     */
    public function should($prediction)
    {
        if (is_callable($prediction)) {
            $prediction = new Prediction\CallbackPrediction($prediction);
        }

        if (!$prediction instanceof Prediction\PredictionInterface) {
            throw new InvalidArgumentException(sprintf(
                'Expected callable or instance of PredictionInterface, but got %s.',
                gettype($prediction)
            ));
        }

        $this->bindToObjectProphecy();
        $this->prediction = $prediction;

        return $this;
    }

    /**
     * Sets call prediction to the prophecy.
     *
     * @see \Prophecy\Prediction\CallPrediction
     *
     * @return $this
     */
    public function shouldBeCalled()
    {
        return $this->should(new Prediction\CallPrediction);
    }

    /**
     * Sets no calls prediction to the prophecy.
     *
     * @see \Prophecy\Prediction\NoCallsPrediction
     *
     * @return $this
     */
    public function shouldNotBeCalled()
    {
        return $this->should(new Prediction\NoCallsPrediction);
    }

    /**
     * Sets call times prediction to the prophecy.
     *
     * @see \Prophecy\Prediction\CallTimesPrediction
     *
     * @param $count
     *
     * @return $this
     */
    public function shouldBeCalledTimes($count)
    {
        return $this->should(new Prediction\CallTimesPrediction($count));
    }

    /**
     * Sets call times prediction to the prophecy.
     *
     * @see \Prophecy\Prediction\CallTimesPrediction
     *
     * @return $this
     */
    public function shouldBeCalledOnce()
    {
        return $this->shouldBeCalledTimes(1);
    }

    /**
     * Checks provided prediction immediately.
     *
     * @param callable|Prediction\PredictionInterface $prediction
     *
     * @return $this
     *
     * @throws \Prophecy\Exception\InvalidArgumentException
     */
    public function shouldHave($prediction)
    {
        if (is_callable($prediction)) {
            $prediction = new Prediction\CallbackPrediction($prediction);
        }

        if (!$prediction instanceof Prediction\PredictionInterface) {
            throw new InvalidArgumentException(sprintf(
                'Expected callable or instance of PredictionInterface, but got %s.',
                gettype($prediction)
            ));
        }

        if (null === $this->promise && !$this->voidReturnType) {
            $this->willReturn();
        }

        $calls = $this->getObjectProphecy()->findProphecyMethodCalls(
            $this->getMethodName(),
            $this->getArgumentsWildcard()
        );

        try {
            $prediction->check($calls, $this->getObjectProphecy(), $this);
            $this->checkedPredictions[] = $prediction;
        } catch (\Exception $e) {
            $this->checkedPredictions[] = $prediction;

            throw $e;
        }

        return $this;
    }

    /**
     * Checks call prediction.
     *
     * @see \Prophecy\Prediction\CallPrediction
     *
     * @return $this
     */
    public function shouldHaveBeenCalled()
    {
        return $this->shouldHave(new Prediction\CallPrediction);
    }

    /**
     * Checks no calls prediction.
     *
     * @see \Prophecy\Prediction\NoCallsPrediction
     *
     * @return $this
     */
    public function shouldNotHaveBeenCalled()
    {
        return $this->shouldHave(new Prediction\NoCallsPrediction);
    }

    /**
     * Checks no calls prediction.
     *
     * @see \Prophecy\Prediction\NoCallsPrediction
     * @deprecated
     *
     * @return $this
     */
    public function shouldNotBeenCalled()
    {
        return $this->shouldNotHaveBeenCalled();
    }

    /**
     * Checks call times prediction.
     *
     * @see \Prophecy\Prediction\CallTimesPrediction
     *
     * @param int $count
     *
     * @return $this
     */
    public function shouldHaveBeenCalledTimes($count)
    {
        return $this->shouldHave(new Prediction\CallTimesPrediction($count));
    }

    /**
     * Checks call times prediction.
     *
     * @see \Prophecy\Prediction\CallTimesPrediction
     *
     * @return $this
     */
    public function shouldHaveBeenCalledOnce()
    {
        return $this->shouldHaveBeenCalledTimes(1);
    }

    /**
     * Checks currently registered [with should(...)] prediction.
     */
    public function checkPrediction()
    {
        if (null === $this->prediction) {
            return;
        }

        $this->shouldHave($this->prediction);
    }

    /**
     * Returns currently registered promise.
     *
     * @return null|Promise\PromiseInterface
     */
    public function getPromise()
    {
        return $this->promise;
    }

    /**
     * Returns currently registered prediction.
     *
     * @return null|Prediction\PredictionInterface
     */
    public function getPrediction()
    {
        return $this->prediction;
    }

    /**
     * Returns predictions that were checked on this object.
     *
     * @return Prediction\PredictionInterface[]
     */
    public function getCheckedPredictions()
    {
        return $this->checkedPredictions;
    }

    /**
     * Returns object prophecy this method prophecy is tied to.
     *
     * @return ObjectProphecy
     */
    public function getObjectProphecy()
    {
        return $this->objectProphecy;
    }

    /**
     * Returns method name.
     *
     * @return string
     */
    public function getMethodName()
    {
        return $this->methodName;
    }

    /**
     * Returns arguments wildcard.
     *
     * @return Argument\ArgumentsWildcard
     */
    public function getArgumentsWildcard()
    {
        return $this->argumentsWildcard;
    }

    /**
     * @return bool
     */
    public function hasReturnVoid()
    {
        return $this->voidReturnType;
    }

    private function bindToObjectProphecy()
    {
        if ($this->bound) {
            return;
        }

        $this->getObjectProphecy()->addMethodProphecy($this);
        $this->bound = true;
    }
}
