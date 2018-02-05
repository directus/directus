<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl\Constraint;

abstract class AbstractConstraint implements ConstraintInterface
{
    /**
     * @var string
     */
    protected $columnSpecification = ' (%s)';

    /**
     * @var string
     */
    protected $namedSpecification = 'CONSTRAINT %s ';

    /**
     * @var string
     */
    protected $specification = '';

    /**
     * @var string
     */
    protected $name = '';

    /**
     * @var array
     */
    protected $columns = [];

    /**
     * @param null|string|array $columns
     * @param null|string $name
     */
    public function __construct($columns = null, $name = null)
    {
        if ($columns) {
            $this->setColumns($columns);
        }

        $this->setName($name);
    }

    /**
     * @param  string $name
     * @return self Provides a fluent interface
     */
    public function setName($name)
    {
        $this->name = (string) $name;
        return $this;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param  null|string|array $columns
     * @return self Provides a fluent interface
     */
    public function setColumns($columns)
    {
        $this->columns = (array) $columns;

        return $this;
    }

    /**
     * @param  string $column
     * @return self Provides a fluent interface
     */
    public function addColumn($column)
    {
        $this->columns[] = $column;
        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function getColumns()
    {
        return $this->columns;
    }

    /**
     * {@inheritDoc}
     */
    public function getExpressionData()
    {
        $colCount = count($this->columns);
        $newSpecTypes = [];
        $values = [];
        $newSpec = '';

        if ($this->name) {
            $newSpec .= $this->namedSpecification;
            $values[] = $this->name;
            $newSpecTypes[] = self::TYPE_IDENTIFIER;
        }

        $newSpec .= $this->specification;

        if ($colCount) {
            $values = array_merge($values, $this->columns);
            $newSpecParts = array_fill(0, $colCount, '%s');
            $newSpecTypes = array_merge($newSpecTypes, array_fill(0, $colCount, self::TYPE_IDENTIFIER));
            $newSpec .= sprintf($this->columnSpecification, implode(', ', $newSpecParts));
        }

        return [[
            $newSpec,
            $values,
            $newSpecTypes,
        ]];
    }
}
