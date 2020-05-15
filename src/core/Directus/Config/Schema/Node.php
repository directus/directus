<?php

namespace Directus\Config\Schema;

/**
 * Node interface
 */
interface Node {
    /**
     * Returns the node key
     * @return string
     */
    public function key();

    /**
     * Returns the node name
     * @return string
     */
    public function name();

    /**
     * Returns the parent node
     * @return Node
     */
    public function parent();

    /**
     * Returns the child nodes
     * @return Node[]
     */
    public function children();

    /**
     * Returns whether this node is optional
     * @return boolean
     */
    public function optional();

    /**
     * Returns the node value from context object
     * @return mixed
     */
    public function value($context);
}
