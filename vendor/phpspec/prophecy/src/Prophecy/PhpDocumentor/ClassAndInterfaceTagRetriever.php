<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\PhpDocumentor;

use phpDocumentor\Reflection\DocBlock\Tag\MethodTag as LegacyMethodTag;
use phpDocumentor\Reflection\DocBlock\Tags\Method;

/**
 * @author Théo FIDRY <theo.fidry@gmail.com>
 *
 * @internal
 */
final class ClassAndInterfaceTagRetriever implements MethodTagRetrieverInterface
{
    private $classRetriever;

    public function __construct(MethodTagRetrieverInterface $classRetriever = null)
    {
        if (null !== $classRetriever) {
            $this->classRetriever = $classRetriever;

            return;
        }

        $this->classRetriever = class_exists('phpDocumentor\Reflection\DocBlockFactory') && class_exists('phpDocumentor\Reflection\Types\ContextFactory')
            ? new ClassTagRetriever()
            : new LegacyClassTagRetriever()
        ;
    }

    /**
     * @param \ReflectionClass $reflectionClass
     *
     * @return LegacyMethodTag[]|Method[]
     */
    public function getTagList(\ReflectionClass $reflectionClass)
    {
        return array_merge(
            $this->classRetriever->getTagList($reflectionClass),
            $this->getInterfacesTagList($reflectionClass)
        );
    }

    /**
     * @param \ReflectionClass $reflectionClass
     *
     * @return LegacyMethodTag[]|Method[]
     */
    private function getInterfacesTagList(\ReflectionClass $reflectionClass)
    {
        $interfaces = $reflectionClass->getInterfaces();
        $tagList = array();

        foreach($interfaces as $interface) {
            $tagList = array_merge($tagList, $this->classRetriever->getTagList($interface));
        }

        return $tagList;
    }
}
