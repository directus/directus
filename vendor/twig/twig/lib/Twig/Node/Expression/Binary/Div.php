<?php

use Twig\Node\Expression\Binary\DivBinary;

class_exists('Twig\Node\Expression\Binary\DivBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Div" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\DivBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\DivBinary" instead */
    class Twig_Node_Expression_Binary_Div extends DivBinary
    {
    }
}
