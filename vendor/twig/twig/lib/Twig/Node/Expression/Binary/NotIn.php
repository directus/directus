<?php

use Twig\Node\Expression\Binary\NotInBinary;

class_exists('Twig\Node\Expression\Binary\NotInBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_NotIn" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\NotInBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\NotInBinary" instead */
    class Twig_Node_Expression_Binary_NotIn extends NotInBinary
    {
    }
}
