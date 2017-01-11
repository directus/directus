<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

class Expression extends AbstractExpression
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
    protected $parameters = [];

    /**
     * @var array
     */
    protected $types = [];

    /**
     * @param string $expression
     * @param string|array $parameters
     * @param array $types @deprecated will be dropped in version 3.0.0
     */
    public function __construct($expression = '', $parameters = null, array $types = [])
    {
        if ($expression !== '') {
            $this->setExpression($expression);
        }

        if ($types) { // should be deprecated and removed version 3.0.0
            if (is_array($parameters)) {
                foreach ($parameters as $i=>$parameter) {
                    $parameters[$i] = [
                        $parameter => isset($types[$i]) ? $types[$i] : self::TYPE_VALUE,
                    ];
                }
            } elseif (is_scalar($parameters)) {
                $parameters = [
                    $parameters => $types[0],
                ];
            }
        }

        if ($parameters) {
            $this->setParameters($parameters);
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
     * @deprecated
     * @param array $types
     * @return Expression
     */
    public function setTypes(array $types)
    {
        $this->types = $types;
        return $this;
    }

    /**
     * @deprecated
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
        $parameters = (is_scalar($this->parameters)) ? [$this->parameters] : $this->parameters;
        $parametersCount = count($parameters);
        $expression = str_replace('%', '%%', $this->expression);

        if ($parametersCount == 0) {
            return [
                str_ireplace(self::PLACEHOLDER, '', $expression)
            ];
        }

        // assign locally, escaping % signs
        $expression = str_replace(self::PLACEHOLDER, '%s', $expression, $count);

        // test number of replacements without considering same variable begin used many times first, which is
        // faster, if the test fails then resort to regex wich are slow and used rarely
        if ($count !== $parametersCount && $parametersCount === preg_match_all('/\:[a-zA-Z0-9_]*/', $expression)) {
            throw new Exception\RuntimeException('The number of replacements in the expression does not match the number of parameters');
        }

        foreach ($parameters as $parameter) {
            list($values[], $types[]) = $this->normalizeArgument($parameter, self::TYPE_VALUE);
        }
        return [[
            $expression,
            $values,
            $types
        ]];
    }
}
