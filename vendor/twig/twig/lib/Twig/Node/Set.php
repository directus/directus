<?php

use Twig\Node\SetNode;

class_exists('Twig\Node\SetNode');

@trigger_error(sprintf('Using the "Twig_Node_Set" class is deprecated since Twig version 2.7, use "Twig\Node\SetNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\SetNode" instead */
    class Twig_Node_Set extends SetNode
    {
    }
}
