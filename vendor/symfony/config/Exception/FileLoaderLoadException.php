<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Exception;

/**
 * Exception class for when a resource cannot be loaded or imported.
 *
 * @author Ryan Weaver <ryan@thatsquality.com>
 *
 * @deprecated since Symfony 4.2, use LoaderLoadException instead.
 */
class FileLoaderLoadException extends \Exception
{
    /**
     * @param string     $resource       The resource that could not be imported
     * @param string     $sourceResource The original resource importing the new resource
     * @param int        $code           The error code
     * @param \Throwable $previous       A previous exception
     * @param string     $type           The type of resource
     */
    public function __construct(string $resource, string $sourceResource = null, int $code = null, \Throwable $previous = null, string $type = null)
    {
        $message = '';
        if ($previous) {
            // Include the previous exception, to help the user see what might be the underlying cause

            // Trim the trailing period of the previous message. We only want 1 period remove so no rtrim...
            if ('.' === substr($previous->getMessage(), -1)) {
                $trimmedMessage = substr($previous->getMessage(), 0, -1);
                $message .= sprintf('%s', $trimmedMessage).' in ';
            } else {
                $message .= sprintf('%s', $previous->getMessage()).' in ';
            }
            $message .= $resource.' ';

            // show tweaked trace to complete the human readable sentence
            if (null === $sourceResource) {
                $message .= sprintf('(which is loaded in resource "%s")', $resource);
            } else {
                $message .= sprintf('(which is being imported from "%s")', $sourceResource);
            }
            $message .= '.';

        // if there's no previous message, present it the default way
        } elseif (null === $sourceResource) {
            $message .= sprintf('Cannot load resource "%s".', $resource);
        } else {
            $message .= sprintf('Cannot import resource "%s" from "%s".', $resource, $sourceResource);
        }

        // Is the resource located inside a bundle?
        if ('@' === $resource[0]) {
            $parts = explode(\DIRECTORY_SEPARATOR, $resource);
            $bundle = substr($parts[0], 1);
            $message .= sprintf(' Make sure the "%s" bundle is correctly registered and loaded in the application kernel class.', $bundle);
            $message .= sprintf(' If the bundle is registered, make sure the bundle path "%s" is not empty.', $resource);
        } elseif (null !== $type) {
            // maybe there is no loader for this specific type
            if ('annotation' === $type) {
                $message .= ' Make sure annotations are installed and enabled.';
            } else {
                $message .= sprintf(' Make sure there is a loader supporting the "%s" type.', $type);
            }
        }

        parent::__construct($message, $code, $previous);
    }

    protected function varToString($var)
    {
        if (\is_object($var)) {
            return sprintf('Object(%s)', \get_class($var));
        }

        if (\is_array($var)) {
            $a = [];
            foreach ($var as $k => $v) {
                $a[] = sprintf('%s => %s', $k, $this->varToString($v));
            }

            return sprintf('Array(%s)', implode(', ', $a));
        }

        if (\is_resource($var)) {
            return sprintf('Resource(%s)', get_resource_type($var));
        }

        if (null === $var) {
            return 'null';
        }

        if (false === $var) {
            return 'false';
        }

        if (true === $var) {
            return 'true';
        }

        return (string) $var;
    }
}
