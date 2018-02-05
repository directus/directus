<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Metadata\Object;

class ColumnObject
{
    /**
     *
     * @var string
     */
    protected $name = null;

    /**
     *
     * @var string
     */
    protected $tableName = null;

    /**
     *
     * @var string
     */
    protected $schemaName = null;

    /**
     *
     * @var
     */
    protected $ordinalPosition = null;

    /**
     *
     * @var string
     */
    protected $columnDefault = null;

    /**
     *
     * @var bool
     */
    protected $isNullable = null;

    /**
     *
     * @var string
     */
    protected $dataType = null;

    /**
     *
     * @var int
     */
    protected $characterMaximumLength = null;

    /**
     *
     * @var int
     */
    protected $characterOctetLength = null;

    /**
     *
     * @var int
     */
    protected $numericPrecision = null;

    /**
     *
     * @var int
     */
    protected $numericScale = null;

    /**
     *
     * @var bool
     */
    protected $numericUnsigned = null;

    /**
     *
     * @var array
     */
    protected $errata = [];

    /**
     * Constructor
     *
     * @param string $name
     * @param string $tableName
     * @param string $schemaName
     */
    public function __construct($name, $tableName, $schemaName = null)
    {
        $this->setName($name);
        $this->setTableName($tableName);
        $this->setSchemaName($schemaName);
    }

    /**
     * Set name
     *
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get table name
     *
     * @return string
     */
    public function getTableName()
    {
        return $this->tableName;
    }

    /**
     * Set table name
     *
     * @param string $tableName
     * @return self Provides a fluent interface
     */
    public function setTableName($tableName)
    {
        $this->tableName = $tableName;
        return $this;
    }

    /**
     * Set schema name
     *
     * @param string $schemaName
     */
    public function setSchemaName($schemaName)
    {
        $this->schemaName = $schemaName;
    }

    /**
     * Get schema name
     *
     * @return string
     */
    public function getSchemaName()
    {
        return $this->schemaName;
    }

    /**
     * @return int $ordinalPosition
     */
    public function getOrdinalPosition()
    {
        return $this->ordinalPosition;
    }

    /**
     * @param int $ordinalPosition to set
     * @return self Provides a fluent interface
     */
    public function setOrdinalPosition($ordinalPosition)
    {
        $this->ordinalPosition = $ordinalPosition;
        return $this;
    }

    /**
     * @return null|string the $columnDefault
     */
    public function getColumnDefault()
    {
        return $this->columnDefault;
    }

    /**
     * @param mixed $columnDefault to set
     * @return self Provides a fluent interface
     */
    public function setColumnDefault($columnDefault)
    {
        $this->columnDefault = $columnDefault;
        return $this;
    }

    /**
     * @return bool $isNullable
     */
    public function getIsNullable()
    {
        return $this->isNullable;
    }

    /**
     * @param bool $isNullable to set
     * @return self Provides a fluent interface
     */
    public function setIsNullable($isNullable)
    {
        $this->isNullable = $isNullable;
        return $this;
    }

    /**
     * @return bool $isNullable
     */
    public function isNullable()
    {
        return $this->isNullable;
    }

    /**
     * @return null|string the $dataType
     */
    public function getDataType()
    {
        return $this->dataType;
    }

    /**
     * @param string $dataType the $dataType to set
     * @return self Provides a fluent interface
     */
    public function setDataType($dataType)
    {
        $this->dataType = $dataType;
        return $this;
    }

    /**
     * @return int|null the $characterMaximumLength
     */
    public function getCharacterMaximumLength()
    {
        return $this->characterMaximumLength;
    }

    /**
     * @param int $characterMaximumLength the $characterMaximumLength to set
     * @return self Provides a fluent interface
     */
    public function setCharacterMaximumLength($characterMaximumLength)
    {
        $this->characterMaximumLength = $characterMaximumLength;
        return $this;
    }

    /**
     * @return int|null the $characterOctetLength
     */
    public function getCharacterOctetLength()
    {
        return $this->characterOctetLength;
    }

    /**
     * @param int $characterOctetLength the $characterOctetLength to set
     * @return self Provides a fluent interface
     */
    public function setCharacterOctetLength($characterOctetLength)
    {
        $this->characterOctetLength = $characterOctetLength;
        return $this;
    }

    /**
     * @return int the $numericPrecision
     */
    public function getNumericPrecision()
    {
        return $this->numericPrecision;
    }

    /**
     * @param int $numericPrecision the $numericPrevision to set
     * @return self Provides a fluent interface
     */
    public function setNumericPrecision($numericPrecision)
    {
        $this->numericPrecision = $numericPrecision;
        return $this;
    }

    /**
     * @return int the $numericScale
     */
    public function getNumericScale()
    {
        return $this->numericScale;
    }

    /**
     * @param int $numericScale the $numericScale to set
     * @return self Provides a fluent interface
     */
    public function setNumericScale($numericScale)
    {
        $this->numericScale = $numericScale;
        return $this;
    }

    /**
     * @return bool
     */
    public function getNumericUnsigned()
    {
        return $this->numericUnsigned;
    }

    /**
     * @param  bool $numericUnsigned
     * @return self Provides a fluent interface
     */
    public function setNumericUnsigned($numericUnsigned)
    {
        $this->numericUnsigned = $numericUnsigned;
        return $this;
    }

    /**
     * @return bool
     */
    public function isNumericUnsigned()
    {
        return $this->numericUnsigned;
    }

    /**
     * @return array the $errata
     */
    public function getErratas()
    {
        return $this->errata;
    }

    /**
     * @param array $erratas
     * @return self Provides a fluent interface
     */
    public function setErratas(array $erratas)
    {
        foreach ($erratas as $name => $value) {
            $this->setErrata($name, $value);
        }
        return $this;
    }

    /**
     * @param string $errataName
     * @return mixed
     */
    public function getErrata($errataName)
    {
        if (array_key_exists($errataName, $this->errata)) {
            return $this->errata[$errataName];
        }
        return;
    }

    /**
     * @param string $errataName
     * @param mixed $errataValue
     * @return self Provides a fluent interface
     */
    public function setErrata($errataName, $errataValue)
    {
        $this->errata[$errataName] = $errataValue;
        return $this;
    }
}
