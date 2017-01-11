<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl;

use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\AbstractSql;

class AlterTable extends AbstractSql implements SqlInterface
{
    const ADD_COLUMNS      = 'addColumns';
    const ADD_CONSTRAINTS  = 'addConstraints';
    const CHANGE_COLUMNS   = 'changeColumns';
    const DROP_COLUMNS     = 'dropColumns';
    const DROP_CONSTRAINTS = 'dropConstraints';
    const TABLE            = 'table';

    /**
     * @var array
     */
    protected $addColumns = [];

    /**
     * @var array
     */
    protected $addConstraints = [];

    /**
     * @var array
     */
    protected $changeColumns = [];

    /**
     * @var array
     */
    protected $dropColumns = [];

    /**
     * @var array
     */
    protected $dropConstraints = [];

    /**
     * Specifications for Sql String generation
     * @var array
     */
    protected $specifications = [
        self::TABLE => "ALTER TABLE %1\$s\n",
        self::ADD_COLUMNS  => [
            "%1\$s" => [
                [1 => "ADD COLUMN %1\$s,\n", 'combinedby' => ""]
            ]
        ],
        self::CHANGE_COLUMNS  => [
            "%1\$s" => [
                [2 => "CHANGE COLUMN %1\$s %2\$s,\n", 'combinedby' => ""],
            ]
        ],
        self::DROP_COLUMNS  => [
            "%1\$s" => [
                [1 => "DROP COLUMN %1\$s,\n", 'combinedby' => ""],
            ]
        ],
        self::ADD_CONSTRAINTS  => [
            "%1\$s" => [
                [1 => "ADD %1\$s,\n", 'combinedby' => ""],
            ]
        ],
        self::DROP_CONSTRAINTS  => [
            "%1\$s" => [
                [1 => "DROP CONSTRAINT %1\$s,\n", 'combinedby' => ""],
            ]
        ]
    ];

    /**
     * @var string
     */
    protected $table = '';

    /**
     * @param string $table
     */
    public function __construct($table = '')
    {
        ($table) ? $this->setTable($table) : null;
    }

    /**
     * @param  string $name
     * @return self
     */
    public function setTable($name)
    {
        $this->table = $name;

        return $this;
    }

    /**
     * @param  Column\ColumnInterface $column
     * @return self
     */
    public function addColumn(Column\ColumnInterface $column)
    {
        $this->addColumns[] = $column;

        return $this;
    }

    /**
     * @param  string $name
     * @param  Column\ColumnInterface $column
     * @return self
     */
    public function changeColumn($name, Column\ColumnInterface $column)
    {
        $this->changeColumns[$name] = $column;

        return $this;
    }

    /**
     * @param  string $name
     * @return self
     */
    public function dropColumn($name)
    {
        $this->dropColumns[] = $name;

        return $this;
    }

    /**
     * @param  string $name
     * @return self
     */
    public function dropConstraint($name)
    {
        $this->dropConstraints[] = $name;

        return $this;
    }

    /**
     * @param  Constraint\ConstraintInterface $constraint
     * @return self
     */
    public function addConstraint(Constraint\ConstraintInterface $constraint)
    {
        $this->addConstraints[] = $constraint;

        return $this;
    }

    /**
     * @param  string|null $key
     * @return array
     */
    public function getRawState($key = null)
    {
        $rawState = [
            self::TABLE => $this->table,
            self::ADD_COLUMNS => $this->addColumns,
            self::DROP_COLUMNS => $this->dropColumns,
            self::CHANGE_COLUMNS => $this->changeColumns,
            self::ADD_CONSTRAINTS => $this->addConstraints,
            self::DROP_CONSTRAINTS => $this->dropConstraints,
        ];

        return (isset($key) && array_key_exists($key, $rawState)) ? $rawState[$key] : $rawState;
    }

    protected function processTable(PlatformInterface $adapterPlatform = null)
    {
        return [$adapterPlatform->quoteIdentifier($this->table)];
    }

    protected function processAddColumns(PlatformInterface $adapterPlatform = null)
    {
        $sqls = [];
        foreach ($this->addColumns as $column) {
            $sqls[] = $this->processExpression($column, $adapterPlatform);
        }

        return [$sqls];
    }

    protected function processChangeColumns(PlatformInterface $adapterPlatform = null)
    {
        $sqls = [];
        foreach ($this->changeColumns as $name => $column) {
            $sqls[] = [
                $adapterPlatform->quoteIdentifier($name),
                $this->processExpression($column, $adapterPlatform)
            ];
        }

        return [$sqls];
    }

    protected function processDropColumns(PlatformInterface $adapterPlatform = null)
    {
        $sqls = [];
        foreach ($this->dropColumns as $column) {
            $sqls[] = $adapterPlatform->quoteIdentifier($column);
        }

        return [$sqls];
    }

    protected function processAddConstraints(PlatformInterface $adapterPlatform = null)
    {
        $sqls = [];
        foreach ($this->addConstraints as $constraint) {
            $sqls[] = $this->processExpression($constraint, $adapterPlatform);
        }

        return [$sqls];
    }

    protected function processDropConstraints(PlatformInterface $adapterPlatform = null)
    {
        $sqls = [];
        foreach ($this->dropConstraints as $constraint) {
            $sqls[] = $adapterPlatform->quoteIdentifier($constraint);
        }

        return [$sqls];
    }
}
