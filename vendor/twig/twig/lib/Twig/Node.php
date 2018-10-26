<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Represents a node in the AST.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node implements Countable, IteratorAggregate
{
    protected $nodes;
    protected $attributes;
    protected $lineno;
    protected $tag;

    private $name;

    /**
     * Constructor.
     *
     * The nodes are automatically made available as properties ($this->node).
     * The attributes are automatically made available as array items ($this['name']).
     *
     * @param array  $nodes      An array of named nodes
     * @param array  $attributes An array of attributes (should not be nodes)
     * @param int    $lineno     The line number
     * @param string $tag        The tag name associated with the Node
     */
    public function __construct(array $nodes = array(), array $attributes = array(), $lineno = 0, $tag = null)
    {
        foreach ($nodes as $name => $node) {
            if (!$node instanceof self) {
                throw new InvalidArgumentException(sprintf('Using "%s" for the value of node "%s" of "%s" is not supported. You must pass a Twig_Node instance.', is_object($node) ? get_class($node) : null === $node ? 'null' : gettype($node), $name, get_class($this)));
            }
        }
        $this->nodes = $nodes;
        $this->attributes = $attributes;
        $this->lineno = $lineno;
        $this->tag = $tag;
    }

    public function __toString()
    {
        $attributes = array();
        foreach ($this->attributes as $name => $value) {
            $attributes[] = sprintf('%s: %s', $name, str_replace("\n", '', var_export($value, true)));
        }

        $repr = array(get_class($this).'('.implode(', ', $attributes));

        if (count($this->nodes)) {
            foreach ($this->nodes as $name => $node) {
                $len = strlen($name) + 4;
                $noderepr = array();
                foreach (explode("\n", (string) $node) as $line) {
                    $noderepr[] = str_repeat(' ', $len).$line;
                }

                $repr[] = sprintf('  %s: %s', $name, ltrim(implode("\n", $noderepr)));
            }

            $repr[] = ')';
        } else {
            $repr[0] .= ')';
        }

        return implode("\n", $repr);
    }

    public function compile(Twig_Compiler $compiler)
    {
        foreach ($this->nodes as $node) {
            $node->compile($compiler);
        }
    }

    public function getTemplateLine()
    {
        return $this->lineno;
    }

    public function getNodeTag()
    {
        return $this->tag;
    }

    /**
     * @return bool
     */
    public function hasAttribute($name)
    {
        return array_key_exists($name, $this->attributes);
    }

    /**
     * @return mixed
     */
    public function getAttribute($name)
    {
        if (!array_key_exists($name, $this->attributes)) {
            throw new LogicException(sprintf('Attribute "%s" does not exist for Node "%s".', $name, get_class($this)));
        }

        return $this->attributes[$name];
    }

    /**
     * @param string $name
     * @param mixed  $value
     */
    public function setAttribute($name, $value)
    {
        $this->attributes[$name] = $value;
    }

    public function removeAttribute($name)
    {
        unset($this->attributes[$name]);
    }

    /**
     * @return bool
     */
    public function hasNode($name)
    {
        return isset($this->nodes[$name]);
    }

    /**
     * @return Twig_Node
     */
    public function getNode($name)
    {
        if (!isset($this->nodes[$name])) {
            throw new LogicException(sprintf('Node "%s" does not exist for Node "%s".', $name, get_class($this)));
        }

        return $this->nodes[$name];
    }

    public function setNode($name, self $node)
    {
        $this->nodes[$name] = $node;
    }

    public function removeNode($name)
    {
        unset($this->nodes[$name]);
    }

    public function count()
    {
        return count($this->nodes);
    }

    public function getIterator()
    {
        return new ArrayIterator($this->nodes);
    }

    public function setTemplateName($name)
    {
        $this->name = $name;
        foreach ($this->nodes as $node) {
            $node->setTemplateName($name);
        }
    }

    public function getTemplateName()
    {
        return $this->name;
    }
}

class_alias('Twig_Node', 'Twig\Node\Node', false);
class_exists('Twig_Compiler');
