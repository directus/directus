<?php

namespace Twig\Sandbox;

class_exists('Twig_Sandbox_SecurityNotAllowedFilterError');

if (\false) {
    class SecurityNotAllowedFilterError extends \Twig_Sandbox_SecurityNotAllowedFilterError
    {
    }
}
