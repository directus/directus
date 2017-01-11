<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Predicate;

use Zend\Db\Sql\Exception;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\AbstractExpression;

class In extends AbstractExpression implements PredicateInterface
{
    protected $identifier;
    protected $valueSet;

    protected $specification = '%s IN %s';

    protected $valueSpecSpecification = '%%s IN (%s)';

    /**
     * Constructor
     *
     * @param null|string|array $identifier
     * @param null|array|Select $valueSet
     */
    public function __construct($identifier = null, $valueSet = null)
    {
        if ($identifier) {
            $this->setIdentifier($identifier);
        }
        if ($valueSet) {
            $this->setValueSet($valueSet);
        }
    }

    /**
     * Set identifier for comparison
     *
     * @param  string|array $identifier
     * @return In
     */
    public function setIdentifier($identifier)
    {
        $this->identifier = $identifier;

        return $this;
    }

    /**
     * Get identifier of comparison
     *
     * @return null|string|array
     */
    public function getIdentifier()
    {
        return $this->identifier;
    }

    /**
     * Set set of values for IN comparison
     *
     * @param  array|Select                       $valueSet
     * @throws Exception\InvalidArgumentException
     * @return In
     */
    public function setValueSet($valueSet)
    {
        if (!is_array($valueSet) && !$valueSet instanceof Select) {
            throw new Exception\InvalidArgumentException(
                '$valueSet must be either an array or a Zend\Db\Sql\Select object, ' . gettype($valueSet) . ' given'
            );
        }
        $this->valueSet = $valueSet;

        return $this;
    }

    /**
     * Gets set of values in IN comparision
     *
     * @return array|Select
     */
    public function getValueSet()
    {
        return $this->valueSet;
    }

    /**
     * Return array of parts for where statement
     *
     * @return array
     */
    public function getExpressionData()
    {
        $identifier = $this->getIdentifier();
        $values = $this->getValueSet();
        $replacements = [];

        if (is_array($identifier)) {
            $identifierSpecFragment = '(' . implode(', ', array_fill(0, count($identifier), '%s')) . ')';
            $types = array_fill(0, count($identifier), self::TYPE_IDENTIFIER);
            $replacements = $identifier;
        } else {
            $identifierSpecFragment = '%s';
            $replacements[] = $identifier;
            $types = [self::TYPE_IDENTIFIER];
        }

        if ($values instanceof Select) {
            $specification = vsprintf(
                $this->specification,
                [$identifierSpecFragment, '%s']
            );
            $replacements[] = $values;
            $types[] = self::TYPE_VALUE;
        } else {
            foreach ($values as $argument) {
                list($replacements[], $types[]) = $this->normalizeArgument($argument, self::TYPE_VALUE);
            }
            $specification = vsprintf(
                $this->specification,
                [$identifierSpecFragment, '(' . implode(', ', array_fill(0, count($values), '%s')) . ')']
            );
        }

        return [[
            $specification,
            $replacements,
            $types,
        ]];
    }
}
