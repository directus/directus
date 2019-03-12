<?php

use Twig\Node\SpacelessNode;

class_exists('Twig\Node\SpacelessNode');

@trigger_error(sprintf('Using the "Twig_Node_Spaceless" class is deprecated since Twig version 2.7, use "Twig\Node\SpacelessNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\SpacelessNode" instead */
    class Twig_Node_Spaceless extends SpacelessNode
    {
    }
}
