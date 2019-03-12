<?php

use Twig\Node\AutoEscapeNode;

class_exists('Twig\Node\AutoEscapeNode');

@trigger_error(sprintf('Using the "Twig_Node_AutoEscape" class is deprecated since Twig version 2.7, use "Twig\Node\AutoEscapeNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\AutoEscapeNode" instead */
    class Twig_Node_AutoEscape extends AutoEscapeNode
    {
    }
}
