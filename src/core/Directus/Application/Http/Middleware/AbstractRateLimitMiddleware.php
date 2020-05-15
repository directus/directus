<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Collection\Collection;
use Directus\Exception\RuntimeException;
use Psr\Container\ContainerInterface;
use RateLimit\Middleware\Identity\IdentityResolverInterface;
use RateLimit\Middleware\Options;
use RateLimit\Middleware\RateLimitMiddleware;
use RateLimit\RateLimiterFactory;
use RateLimit\RateLimiterInterface;

abstract class AbstractRateLimitMiddleware extends AbstractMiddleware
{
    /**
     * @var Collection
     */
    protected $options;

    public function __construct(ContainerInterface $container)
    {
        parent::__construct($container);
        $config = $this->container->get('config');

        $this->options = new Collection((array) $config->get('rate_limit'));
    }

    public function __invoke(Request $request, Response $response, callable $next)
    {
        if (!$this->isEnabled()) {
            return $next($request, $response);
        }

        return (new RateLimitMiddleware(
            $this->createAdapter(),
            $this->getIdentityResolver(),
            Options::fromArray([])
        ))->process($request, $response, $next);
    }

    /**
     * @return bool
     */
    public function isEnabled()
    {
        return $this->options->get('enabled') === true;
    }

    /**
     * @return string
     */
    public function getAdapterName()
    {
        return $this->options->get('adapter');
    }

    /**
     * @return int
     */
    public function getLimit()
    {
        return (int) $this->options->get('limit', 0);
    }

    /**
     * @return int
     */
    public function getInterval()
    {
        return (int) $this->options->get('interval', 60);
    }

    /**
     * @return RateLimiterInterface
     *
     * @throws RuntimeException
     */
    public function createAdapter()
    {
        $limit = $this->getLimit();
        $window = $this->getInterval();
        $adapterName = $this->getAdapterName();

        switch ($adapterName) {
            case 'redis':
                $adapter = RateLimiterFactory::createRedisBackedRateLimiter([
                    'host' => $this->options->get('host', '127.0.0.1'),
                    'port' => $this->options->get('port', 6379),
                    'timeout' => $this->options->get('timeout', 0.0)
                ], $limit, $window);
                break;
            case 'memory':
                $adapter = RateLimiterFactory::createInMemoryRateLimiter($limit, $window);
                break;
            default:
                throw new RuntimeException(
                    sprintf('Unknown Rate limit adapter: "%s"', $adapterName)
                );
        }

        return $adapter;
    }

    /**
     * @return IdentityResolverInterface
     */
    abstract protected function getIdentityResolver();
}
