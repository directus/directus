<?php

use Twig\Node\BlockReferenceNode;

class_exists('Twig\Node\BlockReferenceNode');

@trigger_error(sprintf('Using the "Twig_Node_BlockReference" class is deprecated since Twig version 2.7, use "Twig\Node\BlockReferenceNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\BlockReferenceNode" instead */
    class Twig_Node_BlockReference extends BlockReferenceNode
    {
    }
}
