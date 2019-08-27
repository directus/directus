<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim;

use Closure;
use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Handlers\Strategies\RequestResponse;
use Slim\Interfaces\InvocationStrategyInterface;
use Slim\Interfaces\RouteInterface;

class Route extends Routable implements RouteInterface
{
    use MiddlewareAwareTrait;

    /**
     * HTTP methods supported by this route
     *
     * @var string[]
     */
    protected $methods = [];

    /**
     * Route identifier
     *
     * @var string
     */
    protected $identifier;

    /**
     * Route name
     *
     * @var null|string
     */
    protected $name;

    /**
     * Parent route groups
     *
     * @var RouteGroup[]
     */
    protected $groups;

    private $finalized = false;

    /**
     * Output buffering mode
     *
     * One of: false, 'prepend' or 'append'
     *
     * @var boolean|string
     */
    protected $outputBuffering = 'append';

    /**
     * Route parameters
     *
     * @var array
     */
    protected $arguments = [];

    /**
     * Route arguments parameters
     *
     * @var null|array
     */
    protected $savedArguments = [];

    /**
     * @param string|string[] $methods The route HTTP methods
     * @param string          $pattern The route pattern
     * @param callable        $callable The route callable
     * @param RouteGroup[]    $groups The parent route groups
     * @param int             $identifier The route identifier
     */
    public function __construct($methods, $pattern, $callable, $groups = [], $identifier = 0)
    {
        parent::__construct($pattern, $callable);
        $this->methods  = is_string($methods) ? [$methods] : $methods;
        $this->groups   = $groups;
        $this->identifier = 'route' . $identifier;
    }

    public function finalize()
    {
        if ($this->finalized) {
            return;
        }

        $groupMiddleware = [];
        foreach ($this->getGroups() as $group) {
            $groupMiddleware = array_merge($group->getMiddleware(), $groupMiddleware);
        }

        $this->middleware = array_merge($this->middleware, $groupMiddleware);

        foreach ($this->getMiddleware() as $middleware) {
            $this->addMiddleware($middleware);
        }

        $this->finalized = true;
    }

    /**
     * Get route callable
     *
     * @return callable
     */
    public function getCallable()
    {
        return $this->callable;
    }

    /**
     * This method enables you to override the Route's callable
     *
     * @param string|Closure $callable
     */
    public function setCallable($callable)
    {
        $this->callable = $callable;
    }

    /**
     * Get route methods
     *
     * @return string[]
     */
    public function getMethods()
    {
        return $this->methods;
    }

    /**
     * Get parent route groups
     *
     * @return RouteGroup[]
     */
    public function getGroups()
    {
        return $this->groups;
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get route identifier
     *
     * @return string
     */
    public function getIdentifier()
    {
        return $this->identifier;
    }

    /**
     * Get output buffering mode
     *
     * @return boolean|string
     */
    public function getOutputBuffering()
    {
        return $this->outputBuffering;
    }

    /**
     * {@inheritdoc}
     */
    public function setOutputBuffering($mode)
    {
        if (!in_array($mode, [false, 'prepend', 'append'], true)) {
            throw new InvalidArgumentException('Unknown output buffering mode');
        }
        $this->outputBuffering = $mode;
        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setName($name)
    {
        if (!is_string($name)) {
            throw new InvalidArgumentException('Route name must be a string');
        }
        $this->name = $name;
        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setArgument($name, $value, $includeInSavedArguments = true)
    {
        if ($includeInSavedArguments) {
            $this->savedArguments[$name] = $value;
        }
        $this->arguments[$name] = $value;
        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function setArguments(array $arguments, $includeInSavedArguments = true)
    {
        if ($includeInSavedArguments) {
            $this->savedArguments = $arguments;
        }
        $this->arguments = $arguments;
        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getArguments()
    {
        return $this->arguments;
    }

    /**
     * {@inheritdoc}
     */
    public function getArgument($name, $default = null)
    {
        if (array_key_exists($name, $this->arguments)) {
            return $this->arguments[$name];
        }
        return $default;
    }

    /**
     * {@inheritdoc}
     */
    public function prepare(ServerRequestInterface $request, array $arguments)
    {
        // Remove temp arguments
        $this->setArguments($this->savedArguments);

        // Add the route arguments
        foreach ($arguments as $k => $v) {
            $this->setArgument($k, $v, false);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function run(ServerRequestInterface $request, ResponseInterface $response)
    {
        // Finalise route now that we are about to run it
        $this->finalize();

        // Traverse middleware stack and fetch updated response
        return $this->callMiddlewareStack($request, $response);
    }

    /**
     * {@inheritdoc}
     */
    public function __invoke(ServerRequestInterface $request, ResponseInterface $response)
    {
        $this->callable = $this->resolveCallable($this->callable);

        /** @var InvocationStrategyInterface $handler */
        $handler = isset($this->container) ? $this->container->get('foundHandler') : new RequestResponse();

        $newResponse = $handler($this->callable, $request, $response, $this->arguments);

        if ($newResponse instanceof ResponseInterface) {
            // if route callback returns a ResponseInterface, then use it
            $response = $newResponse;
        } elseif (is_string($newResponse)) {
            // if route callback returns a string, then append it to the response
            if ($response->getBody()->isWritable()) {
                $response->getBody()->write($newResponse);
            }
        }

        return $response;
    }
}
