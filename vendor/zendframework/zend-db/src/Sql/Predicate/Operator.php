<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Predicate;

use Zend\Db\Sql\Exception;

class Operator implements PredicateInterface
{
    const OPERATOR_EQUAL_TO                  = '=';
    const OP_EQ                              = '=';

    const OPERATOR_NOT_EQUAL_TO              = '!=';
    const OP_NE                              = '!=';

    const OPERATOR_LESS_THAN                 = '<';
    const OP_LT                              = '<';

    const OPERATOR_LESS_THAN_OR_EQUAL_TO     = '<=';
    const OP_LTE                             = '<=';

    const OPERATOR_GREATER_THAN              = '>';
    const OP_GT                              = '>';

    const OPERATOR_GREATER_THAN_OR_EQUAL_TO  = '>=';
    const OP_GTE                             = '>=';

    protected $allowedTypes  = array(
        self::TYPE_IDENTIFIER,
        self::TYPE_VALUE,
    );

    protected $left          = null;
    protected $leftType      = self::TYPE_IDENTIFIER;
    protected $operator      = self::OPERATOR_EQUAL_TO;
    protected $right         = null;
    protected $rightType     = self::TYPE_VALUE;

    /**
     * Constructor
     *
     * @param  int|float|bool|string $left
     * @param  string $operator
     * @param  int|float|bool|string $right
     * @param  string $leftType TYPE_IDENTIFIER or TYPE_VALUE by default TYPE_IDENTIFIER {@see allowedTypes}
     * @param  string $rightType TYPE_IDENTIFIER or TYPE_VALUE by default TYPE_VALUE {@see allowedTypes}
     */
    public function __construct($left = null, $operator = self::OPERATOR_EQUAL_TO, $right = null, $leftType = self::TYPE_IDENTIFIER, $rightType = self::TYPE_VALUE)
    {
        if ($left !== null) {
            $this->setLeft($left);
        }

        if ($operator !== self::OPERATOR_EQUAL_TO) {
            $this->setOperator($operator);
        }

        if ($right !== null) {
            $this->setRight($right);
        }

        if ($leftType !== self::TYPE_IDENTIFIER) {
            $this->setLeftType($leftType);
        }

        if ($rightType !== self::TYPE_VALUE) {
            $this->setRightType($rightType);
        }
    }

    /**
     * Set left side of operator
     *
     * @param  int|float|bool|string $left
     * @return Operator
     */
    public function setLeft($left)
    {
        $this->left = $left;
        return $this;
    }

    /**
     * Get left side of operator
     *
     * @return int|float|bool|string
     */
    public function getLeft()
    {
        return $this->left;
    }

    /**
     * Set parameter type for left side of operator
     *
     * @param  string $type TYPE_IDENTIFIER or TYPE_VALUE {@see allowedTypes}
     * @throws Exception\InvalidArgumentException
     * @return Operator
     */
    public function setLeftType($type)
    {
        if (!in_array($type, $this->allowedTypes)) {
            throw new Exception\InvalidArgumentException(sprintf(
                'Invalid type "%s" provided; must be of type "%s" or "%s"',
                $type,
                __CLASS__ . '::TYPE_IDENTIFIER',
                __CLASS__ . '::TYPE_VALUE'
            ));
        }
        $this->leftType = $type;
        return $this;
    }

    /**
     * Get parameter type on left side of operator
     *
     * @return string
     */
    public function getLeftType()
    {
        return $this->leftType;
    }

    /**
     * Set operator string
     *
     * @param  string $operator
     * @return Operator
     */
    public function setOperator($operator)
    {
        $this->operator = $operator;
        return $this;
    }

    /**
     * Get operator string
     *
     * @return string
     */
    public function getOperator()
    {
        return $this->operator;
    }

    /**
     * Set right side of operator
     *
     * @param  int|float|bool|string $value
     * @return Operator
     */
    public function setRight($value)
    {
        $this->right = $value;
        return $this;
    }

    /**
     * Get right side of operator
     *
     * @return int|float|bool|string
     */
    public function getRight()
    {
        return $this->right;
    }

    /**
     * Set parameter type for right side of operator
     *
     * @param  string $type TYPE_IDENTIFIER or TYPE_VALUE {@see allowedTypes}
     * @throws Exception\InvalidArgumentException
     * @return Operator
     */
    public function setRightType($type)
    {
        if (!in_array($type, $this->allowedTypes)) {
            throw new Exception\InvalidArgumentException(sprintf(
                'Invalid type "%s" provided; must be of type "%s" or "%s"',
                $type,
                __CLASS__ . '::TYPE_IDENTIFIER',
                __CLASS__ . '::TYPE_VALUE'
            ));
        }
        $this->rightType = $type;
        return $this;
    }

    /**
     * Get parameter type on right side of operator
     *
     * @return string
     */
    public function getRightType()
    {
        return $this->rightType;
    }

    /**
     * Get predicate parts for where statement
     *
     * @return array
     */
    public function getExpressionData()
    {
        return array(array(
            '%s ' . $this->operator . ' %s',
            array($this->left, $this->right),
            array($this->leftType, $this->rightType)
        ));
    }
}
