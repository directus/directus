<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use Exception;
use GraphQL\Language\AST\Node;
use GraphQL\Utils\AST;
use GraphQL\Utils\Utils;
use function call_user_func;
use function is_callable;
use function sprintf;

class CustomScalarType extends ScalarType
{
    /**
     * @param mixed $value
     *
     * @return mixed
     */
    public function serialize($value)
    {
        return call_user_func($this->config['serialize'], $value);
    }

    /**
     * @param mixed $value
     *
     * @return mixed
     */
    public function parseValue($value)
    {
        if (isset($this->config['parseValue'])) {
            return call_user_func($this->config['parseValue'], $value);
        }

        return $value;
    }

    /**
     * @param Node         $valueNode
     * @param mixed[]|null $variables
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function parseLiteral(/* GraphQL\Language\AST\ValueNode */
        $valueNode,
        ?array $variables = null
    ) {
        if (isset($this->config['parseLiteral'])) {
            return call_user_func($this->config['parseLiteral'], $valueNode, $variables);
        }

        return AST::valueFromASTUntyped($valueNode, $variables);
    }

    public function assertValid()
    {
        parent::assertValid();

        Utils::invariant(
            isset($this->config['serialize']) && is_callable($this->config['serialize']),
            sprintf('%s must provide "serialize" function. If this custom Scalar ', $this->name) .
            'is also used as an input type, ensure "parseValue" and "parseLiteral" ' .
            'functions are also provided.'
        );
        if (! isset($this->config['parseValue']) && ! isset($this->config['parseLiteral'])) {
            return;
        }

        Utils::invariant(
            isset($this->config['parseValue']) && isset($this->config['parseLiteral']) &&
            is_callable($this->config['parseValue']) && is_callable($this->config['parseLiteral']),
            sprintf('%s must provide both "parseValue" and "parseLiteral" functions.', $this->name)
        );
    }
}
