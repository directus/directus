<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Util;

use Twig\Environment;
use Twig\Error\SyntaxError;
use Twig\Source;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class DeprecationCollector
{
    private $twig;

    public function __construct(Environment $twig)
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
        $iterator = new \RegexIterator(
            new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir), \RecursiveIteratorIterator::LEAVES_ONLY
            ), '{'.preg_quote($ext).'$}'
        );

        return $this->collect(new TemplateDirIterator($iterator));
    }

    /**
     * Returns deprecations for passed templates.
     *
     * @param \Traversable $iterator An iterator of templates (where keys are template names and values the contents of the template)
     *
     * @return array An array of deprecations
     */
    public function collect(\Traversable $iterator)
    {
        $deprecations = [];
        set_error_handler(function ($type, $msg) use (&$deprecations) {
            if (E_USER_DEPRECATED === $type) {
                $deprecations[] = $msg;
            }
        });

        foreach ($iterator as $name => $contents) {
            try {
                $this->twig->parse($this->twig->tokenize(new Source($contents, $name)));
            } catch (SyntaxError $e) {
                // ignore templates containing syntax errors
            }
        }

        restore_error_handler();

        return $deprecations;
    }
}

class_alias('Twig\Util\DeprecationCollector', 'Twig_Util_DeprecationCollector');
