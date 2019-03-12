<?php

use Twig\NodeTraverser;

class_exists('Twig\NodeTraverser');

@trigger_error(sprintf('Using the "Twig_NodeTraverser" class is deprecated since Twig version 2.7, use "Twig\NodeTraverser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\NodeTraverser" instead */
    class Twig_NodeTraverser extends NodeTraverser
    {
    }
}
