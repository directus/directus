<?php

use Twig\Node\DoNode;

class_exists('Twig\Node\DoNode');

@trigger_error(sprintf('Using the "Twig_Node_Do" class is deprecated since Twig version 2.7, use "Twig\Node\DoNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\DoNode" instead */
    class Twig_Node_Do extends DoNode
    {
    }
}
