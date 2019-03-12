<?php

use Twig\Node\DeprecatedNode;

class_exists('Twig\Node\DeprecatedNode');

@trigger_error(sprintf('Using the "Twig_Node_Deprecated" class is deprecated since Twig version 2.7, use "Twig\Node\DeprecatedNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\DeprecatedNode" instead */
    class Twig_Node_Deprecated extends DeprecatedNode
    {
    }
}
