<?php

use Twig\Node\PrintNode;

class_exists('Twig\Node\PrintNode');

@trigger_error(sprintf('Using the "Twig_Node_Print" class is deprecated since Twig version 2.7, use "Twig\Node\PrintNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\PrintNode" instead */
    class Twig_Node_Print extends PrintNode
    {
    }
}
