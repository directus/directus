<?php

namespace Directus\Config\Schema;

/**
 * Group node
 */
abstract class Base implements Node
{
    /**
     * Node key
     * @var string
     */
    private $_key = null;

    /**
     * Node name
     * @var string
     */
    private $_name = null;

    /**
     * Node children
     * @var Node[]
     */
    private $_children = null;

    /**
     * Node parent
     * @var Node
     */
    private $_parent = null;

    /**
     * Node is optional
     * @var boolean
     */
    private $_optional = null;

    /**
     * Constructor
     */
    public function __construct($name, $children)
    {
        $this->_optional = substr($name, -1) == '?';
        if ($this->_optional) {
            $name = substr($name, 0, -1);
        }
        $this->_name = $name;
        $this->_key = str_replace("-", "", str_replace("_", "", strtolower($name)));
        $this->_children = $children;
        $this->_parent = null;
        foreach ($children as &$child) {
            $child->parent($this);
        }
    }

    /**
     * Returns the node key
     * @return string
     */
    public function key()
    {
        return $this->_key;
    }

    /**
     * Returns the node name
     * @return string
     */
    public function name()
    {
        return $this->_name;
    }

    /**
     * Returns the parent node
     * @return Node
     */
    public function parent($value = false)
    {
        if ($value !== false) {
            $this->_parent = $value;
            if ($this->_parent !== null) {
                if ($this->_parent->optional() === true) {
                    $this->_optional = true;
                }
            }
        }
        return $this->_parent;
    }

    /**
     * Returns the children nodes
     * @return Node[]
     */
    public function children($value = false)
    {
        if ($value !== false) {
            $this->_children = $value;
        }
        return $this->_children;
    }

    /**
     * Returns wether the node is optional or not
     * @return boolean
     */
    public function optional($value = null)
    {
        if ($value !== null) {
            $this->_optional = $value;
        }
        return $this->_optional;
    }

    /**
     * Returns the $context with normalized array keys.
     * @param $context
     * @return mixed
     */
    protected function normalize($context) {
        foreach ($context as $context_key => $context_value) {
            $context[strtolower(str_replace("-", "", str_replace("_", "", $context_key)))] = $context_value;
        }

        return $context;
    }
}
