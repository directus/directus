<?php

namespace Directus\Config\Schema;

use Directus\Config\Schema\Exception\OmitException;

/**
 * Group node
 */
class Group extends Base implements Node
{
    /**
     * Constructor
     */
    public function __construct($name, $nodes)
    {
        parent::__construct($name, $nodes);
    }

    /**
     * Returns the value from context
     */
    public function value($context)
    {
        $value = [];
        $current = [];

        $context = $this->normalize($context);

        if (!isset($context[$this->key()])) {
            if ($this->optional()) {
                throw new OmitException();
            }
        } else {
            $current = $context[$this->key()];
        }

        foreach ($this->children() as $children) {
            try {
                $value[$children->name()] = $children->value($current);
            } catch (OmitException $ex) {
                continue;
            }
        }

        if (empty($value)) {
            if ($this->parent() !== null && $this->optional()) {
                throw new OmitException();
            }
        }

        return $value;
    }
}
