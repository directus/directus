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
 * Compiles a node to PHP code.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Compiler
{
    private $lastLine;
    private $source;
    private $indentation;
    private $env;
    private $debugInfo = array();
    private $sourceOffset;
    private $sourceLine;
    private $varNameSalt = 0;

    public function __construct(Twig_Environment $env)
    {
        $this->env = $env;
    }

    /**
     * Returns the environment instance related to this compiler.
     *
     * @return Twig_Environment
     */
    public function getEnvironment()
    {
        return $this->env;
    }

    /**
     * Gets the current PHP code after compilation.
     *
     * @return string The PHP code
     */
    public function getSource()
    {
        return $this->source;
    }

    /**
     * Compiles a node.
     *
     * @param Twig_Node $node        The node to compile
     * @param int       $indentation The current indentation
     *
     * @return $this
     */
    public function compile(Twig_Node $node, $indentation = 0)
    {
        $this->lastLine = null;
        $this->source = '';
        $this->debugInfo = array();
        $this->sourceOffset = 0;
        // source code starts at 1 (as we then increment it when we encounter new lines)
        $this->sourceLine = 1;
        $this->indentation = $indentation;
        $this->varNameSalt = 0;

        $node->compile($this);

        return $this;
    }

    public function subcompile(Twig_Node $node, $raw = true)
    {
        if (false === $raw) {
            $this->source .= str_repeat(' ', $this->indentation * 4);
        }

        $node->compile($this);

        return $this;
    }

    /**
     * Adds a raw string to the compiled code.
     *
     * @param string $string The string
     *
     * @return $this
     */
    public function raw($string)
    {
        $this->source .= $string;

        return $this;
    }

    /**
     * Writes a string to the compiled code by adding indentation.
     *
     * @return $this
     */
    public function write(...$strings)
    {
        foreach ($strings as $string) {
            $this->source .= str_repeat(' ', $this->indentation * 4).$string;
        }

        return $this;
    }

    /**
     * Adds a quoted string to the compiled code.
     *
     * @param string $value The string
     *
     * @return $this
     */
    public function string($value)
    {
        $this->source .= sprintf('"%s"', addcslashes($value, "\0\t\"\$\\"));

        return $this;
    }

    /**
     * Returns a PHP representation of a given value.
     *
     * @param mixed $value The value to convert
     *
     * @return $this
     */
    public function repr($value)
    {
        if (is_int($value) || is_float($value)) {
            if (false !== $locale = setlocale(LC_NUMERIC, '0')) {
                setlocale(LC_NUMERIC, 'C');
            }

            $this->raw($value);

            if (false !== $locale) {
                setlocale(LC_NUMERIC, $locale);
            }
        } elseif (null === $value) {
            $this->raw('null');
        } elseif (is_bool($value)) {
            $this->raw($value ? 'true' : 'false');
        } elseif (is_array($value)) {
            $this->raw('array(');
            $first = true;
            foreach ($value as $key => $v) {
                if (!$first) {
                    $this->raw(', ');
                }
                $first = false;
                $this->repr($key);
                $this->raw(' => ');
                $this->repr($v);
            }
            $this->raw(')');
        } else {
            $this->string($value);
        }

        return $this;
    }

    /**
     * Adds debugging information.
     *
     * @return $this
     */
    public function addDebugInfo(Twig_Node $node)
    {
        if ($node->getTemplateLine() != $this->lastLine) {
            $this->write(sprintf("// line %d\n", $node->getTemplateLine()));

            $this->sourceLine += substr_count($this->source, "\n", $this->sourceOffset);
            $this->sourceOffset = strlen($this->source);
            $this->debugInfo[$this->sourceLine] = $node->getTemplateLine();

            $this->lastLine = $node->getTemplateLine();
        }

        return $this;
    }

    public function getDebugInfo()
    {
        ksort($this->debugInfo);

        return $this->debugInfo;
    }

    /**
     * Indents the generated code.
     *
     * @param int $step The number of indentation to add
     *
     * @return $this
     */
    public function indent($step = 1)
    {
        $this->indentation += $step;

        return $this;
    }

    /**
     * Outdents the generated code.
     *
     * @param int $step The number of indentation to remove
     *
     * @return $this
     *
     * @throws LogicException When trying to outdent too much so the indentation would become negative
     */
    public function outdent($step = 1)
    {
        // can't outdent by more steps than the current indentation level
        if ($this->indentation < $step) {
            throw new LogicException('Unable to call outdent() as the indentation would become negative.');
        }

        $this->indentation -= $step;

        return $this;
    }

    public function getVarName()
    {
        return sprintf('__internal_%s', hash('sha256', __METHOD__.$this->varNameSalt++));
    }
}

class_alias('Twig_Compiler', 'Twig\Compiler', false);
class_exists('Twig_Node');
