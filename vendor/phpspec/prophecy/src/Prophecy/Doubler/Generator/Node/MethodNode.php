<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Doubler\Generator\Node;

use Prophecy\Doubler\Generator\TypeHintReference;
use Prophecy\Exception\InvalidArgumentException;

/**
 * Method node.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class MethodNode
{
    private $name;
    private $code;
    private $visibility = 'public';
    private $static = false;
    private $returnsReference = false;
    private $returnType;
    private $nullableReturnType = false;

    /**
     * @var ArgumentNode[]
     */
    private $arguments = array();

    /**
     * @var TypeHintReference
     */
    private $typeHintReference;

    /**
     * @param string $name
     * @param string $code
     */
    public function __construct($name, $code = null, TypeHintReference $typeHintReference = null)
    {
        $this->name = $name;
        $this->code = $code;
        $this->typeHintReference = $typeHintReference ?: new TypeHintReference();
    }

    public function getVisibility()
    {
        return $this->visibility;
    }

    /**
     * @param string $visibility
     */
    public function setVisibility($visibility)
    {
        $visibility = strtolower($visibility);

        if (!in_array($visibility, array('public', 'private', 'protected'))) {
            throw new InvalidArgumentException(sprintf(
                '`%s` method visibility is not supported.', $visibility
            ));
        }

        $this->visibility = $visibility;
    }

    public function isStatic()
    {
        return $this->static;
    }

    public function setStatic($static = true)
    {
        $this->static = (bool) $static;
    }

    public function returnsReference()
    {
        return $this->returnsReference;
    }

    public function setReturnsReference()
    {
        $this->returnsReference = true;
    }

    public function getName()
    {
        return $this->name;
    }

    public function addArgument(ArgumentNode $argument)
    {
        $this->arguments[] = $argument;
    }

    /**
     * @return ArgumentNode[]
     */
    public function getArguments()
    {
        return $this->arguments;
    }

    public function hasReturnType()
    {
        return null !== $this->returnType;
    }

    /**
     * @param string $type
     */
    public function setReturnType($type = null)
    {
        if ($type === '' || $type === null) {
            $this->returnType = null;
            return;
        }
        $typeMap = array(
            'double' => 'float',
            'real' => 'float',
            'boolean' => 'bool',
            'integer' => 'int',
        );
        if (isset($typeMap[$type])) {
            $type = $typeMap[$type];
        }
        $this->returnType = $this->typeHintReference->isBuiltInReturnTypeHint($type) ?
            $type :
            '\\' . ltrim($type, '\\');
    }

    public function getReturnType()
    {
        return $this->returnType;
    }

    /**
     * @param bool $bool
     */
    public function setNullableReturnType($bool = true)
    {
        $this->nullableReturnType = (bool) $bool;
    }

    /**
     * @return bool
     */
    public function hasNullableReturnType()
    {
        return $this->nullableReturnType;
    }

    /**
     * @param string $code
     */
    public function setCode($code)
    {
        $this->code = $code;
    }

    public function getCode()
    {
        if ($this->returnsReference)
        {
            return "throw new \Prophecy\Exception\Doubler\ReturnByReferenceException('Returning by reference not supported', get_class(\$this), '{$this->name}');";
        }

        return (string) $this->code;
    }

    public function useParentCode()
    {
        $this->code = sprintf(
            'return parent::%s(%s);', $this->getName(), implode(', ',
                array_map(array($this, 'generateArgument'), $this->arguments)
            )
        );
    }

    private function generateArgument(ArgumentNode $arg)
    {
        $argument = '$'.$arg->getName();

        if ($arg->isVariadic()) {
            $argument = '...'.$argument;
        }

        return $argument;
    }
}
