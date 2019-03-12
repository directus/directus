<?php

use Twig\Node\Node;

class_exists('Twig\Node\Node');

@trigger_error(sprintf('Using the "Twig_Node" class is deprecated since Twig version 2.7, use "Twig\Node\Node" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Node" instead */
    class Twig_Node extends Node
    {
    }
}
