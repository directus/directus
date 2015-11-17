<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

class Expression implements ExpressionInterface
{
    /**
     * @const
     */
    const PLACEHOLDER = '?';

    /**
     * @var string
     */
    protected $expression = '';

    /**
     * @var array
     */
    protected $parameters = array();

    /**
     * @var array
     */
    protected $types = array();

    /**
     * @param string $expression
     * @param string|array $parameters
     * @param array $types
     */
    public function __construct($expression = '', $parameters = null, array $types = array())
    {
        if ($expression) {
            $this->setExpression($expression);
        }
        if ($parameters) {
            $this->setParameters($parameters);
        }
        if ($types) {
            $this->setTypes($types);
        }
    }

    /**
     * @param $expression
     * @return Expression
     * @throws Exception\InvalidArgumentException
     */
    public function setExpression($expression)
    {
        if (!is_string($expression) || $expression == '') {
            throw new Exception\InvalidArgumentException('Supplied expression must be a string.');
        }
        $this->expression = $expression;
        return $this;
    }

    /**
     * @return string
     */
    public function getExpression()
    {
        return $this->expression;
    }

    /**
     * @param $parameters
     * @return Expression
     * @throws Exception\InvalidArgumentException
     */
    public function setParameters($parameters)
    {
        if (!is_scalar($parameters) && !is_array($parameters)) {
            throw new Exception\InvalidArgumentException('Expression parameters must be a scalar or array.');
        }
        $this->parameters = $parameters;
        return $this;
    }

    /**
     * @return array
     */
    public function getParameters()
    {
        return $this->parameters;
    }

    /**
     * @param array $types
     * @return Expression
     */
    public function setTypes(array $types)
    {
        $this->types = $types;
        return $this;
    }

    /**
     * @return array
     */
    public function getTypes()
    {
        return $this->types;
    }

    /**
     * @return array
     * @throws Exception\RuntimeException
     */
    public function getExpressionData()
    {
        $parameters = (is_scalar($this->parameters)) ? array($this->parameters) : $this->parameters;

        $types = array();
        $parametersCount = count($parameters);

        if ($parametersCount == 0 && strpos($this->expression, self::PLACEHOLDER) !== false) {
            // if there are no parameters, but there is a placeholder
            $parametersCount = substr_count($this->expression, self::PLACEHOLDER);
            $parameters = array_fill(0, $parametersCount, null);
        }

        for ($i = 0; $i < $parametersCount; $i++) {
            $types[$i] = (isset($this->types[$i]) && ($this->types[$i] == self::TYPE_IDENTIFIER || $this->types[$i] == self::TYPE_LITERAL))
                ? $this->types[$i] : self::TYPE_VALUE;
        }

        // assign locally, escaping % signs
        $expression = str_replace('%', '%%', $this->expression);

        if ($parametersCount > 0) {
            $count = 0;
            $expression = str_replace(self::PLACEHOLDER, '%s', $expression, $count);
            if ($count !== $parametersCount) {
                throw new Exception\RuntimeException('The number of replacements in the expression does not match the number of parameters');
            }
        }

        return array(array(
            $expression,
            $parameters,
            $types
        ));
    }
}
