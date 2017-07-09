<?php

namespace Twig\Sandbox;

class_exists('Twig_Sandbox_SecurityNotAllowedFunctionError');

if (\false) {
    class SecurityNotAllowedFunctionError extends \Twig_Sandbox_SecurityNotAllowedFunctionError
    {
    }
}
