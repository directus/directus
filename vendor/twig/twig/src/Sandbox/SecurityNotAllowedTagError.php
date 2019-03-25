<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Sandbox;

/**
 * Exception thrown when a not allowed tag is used in a template.
 *
 * @author Martin Hasoň <martin.hason@gmail.com>
 */
class SecurityNotAllowedTagError extends SecurityError
{
    private $tagName;

    public function __construct(string $message, string $tagName, int $lineno = -1, string $filename = null, \Exception $previous = null)
    {
        parent::__construct($message, $lineno, $filename, $previous);
        $this->tagName = $tagName;
    }

    public function getTagName()
    {
        return $this->tagName;
    }
}

class_alias('Twig\Sandbox\SecurityNotAllowedTagError', 'Twig_Sandbox_SecurityNotAllowedTagError');
