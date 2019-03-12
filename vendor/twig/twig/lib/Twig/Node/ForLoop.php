<?php

use Twig\Node\ForLoopNode;

class_exists('Twig\Node\ForLoopNode');

@trigger_error(sprintf('Using the "Twig_Node_ForLoop" class is deprecated since Twig version 2.7, use "Twig\Node\ForLoopNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\ForLoopNode" instead */
    class Twig_Node_ForLoop extends ForLoopNode
    {
    }
}
