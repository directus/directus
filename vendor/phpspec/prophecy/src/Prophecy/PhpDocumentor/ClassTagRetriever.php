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

use phpDocumentor\Reflection\DocBlock\Tags\Method;
use phpDocumentor\Reflection\DocBlockFactory;
use phpDocumentor\Reflection\Types\ContextFactory;

/**
 * @author Théo FIDRY <theo.fidry@gmail.com>
 *
 * @internal
 */
final class ClassTagRetriever implements MethodTagRetrieverInterface
{
    private $docBlockFactory;
    private $contextFactory;

    public function __construct()
    {
        $this->docBlockFactory = DocBlockFactory::createInstance();
        $this->contextFactory = new ContextFactory();
    }

    /**
     * @param \ReflectionClass $reflectionClass
     *
     * @return Method[]
     */
    public function getTagList(\ReflectionClass $reflectionClass)
    {
        try {
            $phpdoc = $this->docBlockFactory->create(
                $reflectionClass,
                $this->contextFactory->createFromReflector($reflectionClass)
            );

            return $phpdoc->getTagsByName('method');
        } catch (\InvalidArgumentException $e) {
            return array();
        }
    }
}
