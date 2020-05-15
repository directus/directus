<?php

namespace Directus\Config\Schema;

use Directus\Config\Schema\Types;
use Directus\Config\Schema\Exception\OmitException;

/**
 * Value node
 */
class Value extends Base implements Node
{
    /**
     * Value type
     */
    private $_type = 'string';

    /**
     * Default value
     */
    private $_default = null;

    /**
     * Construct
     */
    public function __construct($name, $type, $default = null)
    {
        parent::__construct($name, []);
        $this->_type = $type;
        $this->_default = $default;
    }

    /**
     * Gets a value from leaf node
     */
    public function value($context)
    {
        $context = $this->normalize($context);

        if (!isset($context) || !isset($context[$this->key()])) {
            if ($this->optional()) {
                throw new OmitException();
            } else {
                return $this->_default;
            }
        }

        $value = $context[$this->key()];

        switch ($this->_type) {
            case Types::INTEGER:
                return intval($value);
            case Types::BOOLEAN:
                $value = strtolower($value);
                return $value === "true" || $value ===  "1" || $value === "on" || $value === "yes" || boolval($value);
            case Types::FLOAT:
                return floatval($value);
            case Types::ARRAY:
                if (!is_array($value)) {
                    return $this->_default;
                }
            case Types::STRING:
            default:
                return $value;
        }
    }
}
