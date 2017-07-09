<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @final
 */
class Twig_Util_DeprecationCollector
{
    private $twig;
    private $deprecations;

    public function __construct(Twig_Environment $twig)
    {
        $this->twig = $twig;
    }

    /**
     * Returns deprecations for templates contained in a directory.
     *
     * @param string $dir A directory where templates are stored
     * @param string $ext Limit the loaded templates by extension
     *
     * @return array An array of deprecations
     */
    public function collectDir($dir, $ext = '.twig')
    {
        $iterator = new RegexIterator(
            new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($dir), RecursiveIteratorIterator::LEAVES_ONLY
            ), '{'.preg_quote($ext).'$}'
        );

        return $this->collect(new Twig_Util_TemplateDirIterator($iterator));
    }

    /**
     * Returns deprecations for passed templates.
     *
     * @param Traversable $iterator An iterator of templates (where keys are template names and values the contents of the template)
     *
     * @return array An array of deprecations
     */
    public function collect(Traversable $iterator)
    {
        $this->deprecations = array();

        set_error_handler(array($this, 'errorHandler'));

        foreach ($iterator as $name => $contents) {
            try {
                $this->twig->parse($this->twig->tokenize(new Twig_Source($contents, $name)));
            } catch (Twig_Error_Syntax $e) {
                // ignore templates containing syntax errors
            }
        }

        restore_error_handler();

        $deprecations = $this->deprecations;
        $this->deprecations = array();

        return $deprecations;
    }

    /**
     * @internal
     */
    public function errorHandler($type, $msg)
    {
        if (E_USER_DEPRECATED === $type) {
            $this->deprecations[] = $msg;
        }
    }
}

class_alias('Twig_Util_DeprecationCollector', 'Twig\Util\DeprecationCollector', false);
