<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Metadata\Object;

class ConstraintKeyObject
{
    const FK_CASCADE = 'CASCADE';
    const FK_SET_NULL = 'SET NULL';
    const FK_NO_ACTION = 'NO ACTION';
    const FK_RESTRICT = 'RESTRICT';
    const FK_SET_DEFAULT = 'SET DEFAULT';

    /**
     *
     * @var string
     */
    protected $columnName = null;

    /**
     *
     * @var int
     */
    protected $ordinalPosition = null;

    /**
     *
     * @var bool
     */
    protected $positionInUniqueConstraint = null;

    /**
     *
     * @var string
     */
    protected $referencedTableSchema = null;

    /**
     *
     * @var string
     */
    protected $referencedTableName = null;

    /**
     *
     * @var string
     */
    protected $referencedColumnName = null;

    /**
     *
     * @var string
     */
    protected $foreignKeyUpdateRule = null;

    /**
     *
     * @var string
     */
    protected $foreignKeyDeleteRule = null;

    /**
     * Constructor
     *
     * @param string $column
     */
    public function __construct($column)
    {
        $this->setColumnName($column);
    }

    /**
     * Get column name
     *
     * @return string
     */
    public function getColumnName()
    {
        return $this->columnName;
    }

    /**
     * Set column name
     *
     * @param  string $columnName
     * @return ConstraintKeyObject
     */
    public function setColumnName($columnName)
    {
        $this->columnName = $columnName;
        return $this;
    }

    /**
     * Get ordinal position
     *
     * @return int
     */
    public function getOrdinalPosition()
    {
        return $this->ordinalPosition;
    }

    /**
     * Set ordinal position
     *
     * @param  int $ordinalPosition
     * @return ConstraintKeyObject
     */
    public function setOrdinalPosition($ordinalPosition)
    {
        $this->ordinalPosition = $ordinalPosition;
        return $this;
    }

    /**
     * Get position in unique constraint
     *
     * @return bool
     */
    public function getPositionInUniqueConstraint()
    {
        return $this->positionInUniqueConstraint;
    }

    /**
     * Set position in unique constraint
     *
     * @param  bool $positionInUniqueConstraint
     * @return ConstraintKeyObject
     */
    public function setPositionInUniqueConstraint($positionInUniqueConstraint)
    {
        $this->positionInUniqueConstraint = $positionInUniqueConstraint;
        return $this;
    }

    /**
     * Get referencred table schema
     *
     * @return string
     */
    public function getReferencedTableSchema()
    {
        return $this->referencedTableSchema;
    }

    /**
     * Set referenced table schema
     *
     * @param string $referencedTableSchema
     * @return ConstraintKeyObject
     */
    public function setReferencedTableSchema($referencedTableSchema)
    {
        $this->referencedTableSchema = $referencedTableSchema;
        return $this;
    }

    /**
     * Get referenced table name
     *
     * @return string
     */
    public function getReferencedTableName()
    {
        return $this->referencedTableName;
    }

    /**
     * Set Referenced table name
     *
     * @param  string $referencedTableName
     * @return ConstraintKeyObject
     */
    public function setReferencedTableName($referencedTableName)
    {
        $this->referencedTableName = $referencedTableName;
        return $this;
    }

    /**
     * Get referenced column name
     *
     * @return string
     */
    public function getReferencedColumnName()
    {
        return $this->referencedColumnName;
    }

    /**
     * Set referenced column name
     *
     * @param  string $referencedColumnName
     * @return ConstraintKeyObject
     */
    public function setReferencedColumnName($referencedColumnName)
    {
        $this->referencedColumnName = $referencedColumnName;
        return $this;
    }

    /**
     * set foreign key update rule
     *
     * @param string $foreignKeyUpdateRule
     */
    public function setForeignKeyUpdateRule($foreignKeyUpdateRule)
    {
        $this->foreignKeyUpdateRule = $foreignKeyUpdateRule;
    }

    /**
     * Get foreign key update rule
     *
     * @return string
     */
    public function getForeignKeyUpdateRule()
    {
        return $this->foreignKeyUpdateRule;
    }

    /**
     * Set foreign key delete rule
     *
     * @param string $foreignKeyDeleteRule
     */
    public function setForeignKeyDeleteRule($foreignKeyDeleteRule)
    {
        $this->foreignKeyDeleteRule = $foreignKeyDeleteRule;
    }

    /**
     * get foreign key delete rule
     *
     * @return string
     */
    public function getForeignKeyDeleteRule()
    {
        return $this->foreignKeyDeleteRule;
    }
}
