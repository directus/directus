<?php
/*
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the MIT license. For more information, see
 * <http://www.doctrine-project.org>.
 */

namespace Doctrine\Instantiator;

use Doctrine\Instantiator\Exception\InvalidArgumentException;
use Doctrine\Instantiator\Exception\UnexpectedValueException;
use Exception;
use ReflectionClass;

/**
 * {@inheritDoc}
 *
 * @author Marco Pivetta <ocramius@gmail.com>
 */
final class Instantiator implements InstantiatorInterface
{
    /**
     * Markers used internally by PHP to define whether {@see \unserialize} should invoke
     * the method {@see \Serializable::unserialize()} when dealing with classes implementing
     * the {@see \Serializable} interface.
     */
    const SERIALIZATION_FORMAT_USE_UNSERIALIZER   = 'C';
    const SERIALIZATION_FORMAT_AVOID_UNSERIALIZER = 'O';

    /**
     * @var \callable[] used to instantiate specific classes, indexed by class name
     */
    private static $cachedInstantiators = [];

    /**
     * @var object[] of objects that can directly be cloned, indexed by class name
     */
    private static $cachedCloneables = [];

    /**
     * {@inheritDoc}
     */
    public function instantiate($className)
    {
        if (isset(self::$cachedCloneables[$className])) {
            return clone self::$cachedCloneables[$className];
        }

        if (isset(self::$cachedInstantiators[$className])) {
            $factory = self::$cachedInstantiators[$className];

            return $factory();
        }

        return $this->buildAndCacheFromFactory($className);
    }

    /**
     * Builds the requested object and caches it in static properties for performance
     *
     * @return object
     */
    private function buildAndCacheFromFactory(string $className)
    {
        $factory  = self::$cachedInstantiators[$className] = $this->buildFactory($className);
        $instance = $factory();

        if ($this->isSafeToClone(new ReflectionClass($instance))) {
            self::$cachedCloneables[$className] = clone $instance;
        }

        return $instance;
    }

    /**
     * Builds a callable capable of instantiating the given $className without
     * invoking its constructor.
     *
     * @throws InvalidArgumentException
     * @throws UnexpectedValueException
     * @throws \ReflectionException
     */
    private function buildFactory(string $className) : callable
    {
        $reflectionClass = $this->getReflectionClass($className);

        if ($this->isInstantiableViaReflection($reflectionClass)) {
            return [$reflectionClass, 'newInstanceWithoutConstructor'];
        }

        $serializedString = sprintf(
            '%s:%d:"%s":0:{}',
            self::SERIALIZATION_FORMAT_AVOID_UNSERIALIZER,
            strlen($className),
            $className
        );

        $this->checkIfUnSerializationIsSupported($reflectionClass, $serializedString);

        return function () use ($serializedString) {
            return unserialize($serializedString);
        };
    }

    /**
     * @param string $className
     *
     * @return ReflectionClass
     *
     * @throws InvalidArgumentException
     * @throws \ReflectionException
     */
    private function getReflectionClass($className) : ReflectionClass
    {
        if (! class_exists($className)) {
            throw InvalidArgumentException::fromNonExistingClass($className);
        }

        $reflection = new ReflectionClass($className);

        if ($reflection->isAbstract()) {
            throw InvalidArgumentException::fromAbstractClass($reflection);
        }

        return $reflection;
    }

    /**
     * @param ReflectionClass $reflectionClass
     * @param string          $serializedString
     *
     * @throws UnexpectedValueException
     *
     * @return void
     */
    private function checkIfUnSerializationIsSupported(ReflectionClass $reflectionClass, $serializedString) : void
    {
        set_error_handler(function ($code, $message, $file, $line) use ($reflectionClass, & $error) : void {
            $error = UnexpectedValueException::fromUncleanUnSerialization(
                $reflectionClass,
                $message,
                $code,
                $file,
                $line
            );
        });

        $this->attemptInstantiationViaUnSerialization($reflectionClass, $serializedString);

        restore_error_handler();

        if ($error) {
            throw $error;
        }
    }

    /**
     * @param ReflectionClass $reflectionClass
     * @param string          $serializedString
     *
     * @throws UnexpectedValueException
     *
     * @return void
     */
    private function attemptInstantiationViaUnSerialization(ReflectionClass $reflectionClass, $serializedString) : void
    {
        try {
            unserialize($serializedString);
        } catch (Exception $exception) {
            restore_error_handler();

            throw UnexpectedValueException::fromSerializationTriggeredException($reflectionClass, $exception);
        }
    }

    private function isInstantiableViaReflection(ReflectionClass $reflectionClass) : bool
    {
        return ! ($this->hasInternalAncestors($reflectionClass) && $reflectionClass->isFinal());
    }

    /**
     * Verifies whether the given class is to be considered internal
     */
    private function hasInternalAncestors(ReflectionClass $reflectionClass) : bool
    {
        do {
            if ($reflectionClass->isInternal()) {
                return true;
            }
        } while ($reflectionClass = $reflectionClass->getParentClass());

        return false;
    }

    /**
     * Checks if a class is cloneable
     *
     * Classes implementing `__clone` cannot be safely cloned, as that may cause side-effects.
     */
    private function isSafeToClone(ReflectionClass $reflection) : bool
    {
        return $reflection->isCloneable() && ! $reflection->hasMethod('__clone');
    }
}
