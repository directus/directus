<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim\Exception;

use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;

class MethodNotAllowedException extends SlimException
{
    /**
     * HTTP methods allowed
     *
     * @var string[]
     */
    protected $allowedMethods;

    /**
     * Create new exception
     *
     * @param ServerRequestInterface $request
     * @param ResponseInterface $response
     * @param string[] $allowedMethods
     */
    public function __construct(ServerRequestInterface $request, ResponseInterface $response, array $allowedMethods)
    {
        parent::__construct($request, $response);
        $this->allowedMethods = $allowedMethods;
    }

    /**
     * Get allowed methods
     *
     * @return string[]
     */
    public function getAllowedMethods()
    {
        return $this->allowedMethods;
    }
}
