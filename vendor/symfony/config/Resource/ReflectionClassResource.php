<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Resource;

use Symfony\Component\DependencyInjection\ServiceSubscriberInterface as LegacyServiceSubscriberInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Messenger\Handler\MessageSubscriberInterface;
use Symfony\Contracts\Service\ServiceSubscriberInterface;

/**
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @final since Symfony 4.3
 */
class ReflectionClassResource implements SelfCheckingResourceInterface
{
    private $files = [];
    private $className;
    private $classReflector;
    private $excludedVendors = [];
    private $hash;

    public function __construct(\ReflectionClass $classReflector, array $excludedVendors = [])
    {
        $this->className = $classReflector->name;
        $this->classReflector = $classReflector;
        $this->excludedVendors = $excludedVendors;
    }

    public function isFresh($timestamp)
    {
        if (null === $this->hash) {
            $this->hash = $this->computeHash();
            $this->loadFiles($this->classReflector);
        }

        foreach ($this->files as $file => $v) {
            if (false === $filemtime = @filemtime($file)) {
                return false;
            }

            if ($filemtime > $timestamp) {
                return $this->hash === $this->computeHash();
            }
        }

        return true;
    }

    public function __toString()
    {
        return 'reflection.'.$this->className;
    }

    /**
     * @internal
     */
    public function __sleep(): array
    {
        if (null === $this->hash) {
            $this->hash = $this->computeHash();
            $this->loadFiles($this->classReflector);
        }

        return ['files', 'className', 'hash'];
    }

    private function loadFiles(\ReflectionClass $class)
    {
        foreach ($class->getInterfaces() as $v) {
            $this->loadFiles($v);
        }
        do {
            $file = $class->getFileName();
            if (false !== $file && file_exists($file)) {
                foreach ($this->excludedVendors as $vendor) {
                    if (0 === strpos($file, $vendor) && false !== strpbrk(substr($file, \strlen($vendor), 1), '/'.\DIRECTORY_SEPARATOR)) {
                        $file = false;
                        break;
                    }
                }
                if ($file) {
                    $this->files[$file] = null;
                }
            }
            foreach ($class->getTraits() as $v) {
                $this->loadFiles($v);
            }
        } while ($class = $class->getParentClass());
    }

    private function computeHash(): string
    {
        if (null === $this->classReflector) {
            try {
                $this->classReflector = new \ReflectionClass($this->className);
            } catch (\ReflectionException $e) {
                // the class does not exist anymore
                return false;
            }
        }
        $hash = hash_init('md5');

        foreach ($this->generateSignature($this->classReflector) as $info) {
            hash_update($hash, $info);
        }

        return hash_final($hash);
    }

    private function generateSignature(\ReflectionClass $class): iterable
    {
        yield $class->getDocComment();
        yield (int) $class->isFinal();
        yield (int) $class->isAbstract();

        if ($class->isTrait()) {
            yield print_r(class_uses($class->name), true);
        } else {
            yield print_r(class_parents($class->name), true);
            yield print_r(class_implements($class->name), true);
            yield print_r($class->getConstants(), true);
        }

        if (!$class->isInterface()) {
            $defaults = $class->getDefaultProperties();

            foreach ($class->getProperties(\ReflectionProperty::IS_PUBLIC | \ReflectionProperty::IS_PROTECTED) as $p) {
                yield $p->getDocComment();
                yield $p->isDefault() ? '<default>' : '';
                yield $p->isPublic() ? 'public' : 'protected';
                yield $p->isStatic() ? 'static' : '';
                yield '$'.$p->name;
                yield print_r(isset($defaults[$p->name]) && !\is_object($defaults[$p->name]) ? $defaults[$p->name] : null, true);
            }
        }

        foreach ($class->getMethods(\ReflectionMethod::IS_PUBLIC | \ReflectionMethod::IS_PROTECTED) as $m) {
            $defaults = [];
            $parametersWithUndefinedConstants = [];
            foreach ($m->getParameters() as $p) {
                if (!$p->isDefaultValueAvailable()) {
                    $defaults[$p->name] = null;

                    continue;
                }

                if (!$p->isDefaultValueConstant() || \defined($p->getDefaultValueConstantName())) {
                    $defaults[$p->name] = $p->getDefaultValue();

                    continue;
                }

                $defaults[$p->name] = $p->getDefaultValueConstantName();
                $parametersWithUndefinedConstants[$p->name] = true;
            }

            if (!$parametersWithUndefinedConstants) {
                yield preg_replace('/^  @@.*/m', '', $m);
            } else {
                $stack = [
                    $m->getDocComment(),
                    $m->getName(),
                    $m->isAbstract(),
                    $m->isFinal(),
                    $m->isStatic(),
                    $m->isPublic(),
                    $m->isPrivate(),
                    $m->isProtected(),
                    $m->returnsReference(),
                    $m->hasReturnType() ? $m->getReturnType()->getName() : '',
                ];

                foreach ($m->getParameters() as $p) {
                    if (!isset($parametersWithUndefinedConstants[$p->name])) {
                        $stack[] = (string) $p;
                    } else {
                        $stack[] = $p->isOptional();
                        $stack[] = $p->hasType() ? $p->getType()->getName() : '';
                        $stack[] = $p->isPassedByReference();
                        $stack[] = $p->isVariadic();
                        $stack[] = $p->getName();
                    }
                }

                yield implode(',', $stack);
            }

            yield print_r($defaults, true);
        }

        if ($class->isAbstract() || $class->isInterface() || $class->isTrait()) {
            return;
        }

        if (interface_exists(EventSubscriberInterface::class, false) && $class->isSubclassOf(EventSubscriberInterface::class)) {
            yield EventSubscriberInterface::class;
            yield print_r($class->name::getSubscribedEvents(), true);
        }

        if (interface_exists(MessageSubscriberInterface::class, false) && $class->isSubclassOf(MessageSubscriberInterface::class)) {
            yield MessageSubscriberInterface::class;
            foreach ($class->name::getHandledMessages() as $key => $value) {
                yield $key.print_r($value, true);
            }
        }

        if (interface_exists(LegacyServiceSubscriberInterface::class, false) && $class->isSubclassOf(LegacyServiceSubscriberInterface::class)) {
            yield LegacyServiceSubscriberInterface::class;
            yield print_r([$class->name, 'getSubscribedServices'](), true);
        } elseif (interface_exists(ServiceSubscriberInterface::class, false) && $class->isSubclassOf(ServiceSubscriberInterface::class)) {
            yield ServiceSubscriberInterface::class;
            yield print_r($class->name::getSubscribedServices(), true);
        }
    }
}
