<?php
namespace GuzzleHttp\Handler;

use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Promise\PromiseInterface;
use GuzzleHttp\Promise\RejectedPromise;
use GuzzleHttp\TransferStats;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * Handler that returns responses or throw exceptions from a queue.
 */
class MockHandler implements \Countable
{
    private $queue = [];
    private $lastRequest;
    private $lastOptions;
    private $onFulfilled;
    private $onRejected;

    /**
     * Creates a new MockHandler that uses the default handler stack list of
     * middlewares.
     *
     * @param array $queue Array of responses, callables, or exceptions.
     * @param callable $onFulfilled Callback to invoke when the return value is fulfilled.
     * @param callable $onRejected  Callback to invoke when the return value is rejected.
     *
     * @return HandlerStack
     */
    public static function createWithMiddleware(
        array $queue = null,
        callable $onFulfilled = null,
        callable $onRejected = null
    ) {
        return HandlerStack::create(new self($queue, $onFulfilled, $onRejected));
    }

    /**
     * The passed in value must be an array of
     * {@see Psr7\Http\Message\ResponseInterface} objects, Exceptions,
     * callables, or Promises.
     *
     * @param array $queue
     * @param callable $onFulfilled Callback to invoke when the return value is fulfilled.
     * @param callable $onRejected  Callback to invoke when the return value is rejected.
     */
    public function __construct(
        array $queue = null,
        callable $onFulfilled = null,
        callable $onRejected = null
    ) {
        $this->onFulfilled = $onFulfilled;
        $this->onRejected = $onRejected;

        if ($queue) {
            call_user_func_array([$this, 'append'], $queue);
        }
    }

    public function __invoke(RequestInterface $request, array $options)
    {
        if (!$this->queue) {
            throw new \OutOfBoundsException('Mock queue is empty');
        }

        if (isset($options['delay'])) {
            usleep($options['delay'] * 1000);
        }

        $this->lastRequest = $request;
        $this->lastOptions = $options;
        $response = array_shift($this->queue);

        if (isset($options['on_headers'])) {
            if (!is_callable($options['on_headers'])) {
                throw new \InvalidArgumentException('on_headers must be callable');
            }
            try {
                $options['on_headers']($response);
            } catch (\Exception $e) {
                $msg = 'An error was encountered during the on_headers event';
                $response = new RequestException($msg, $request, $response, $e);
            }
        }

        if (is_callable($response)) {
            $response = call_user_func($response, $request, $options);
        }

        $response = $response instanceof \Exception
            ? \GuzzleHttp\Promise\rejection_for($response)
            : \GuzzleHttp\Promise\promise_for($response);

        return $response->then(
            function ($value) use ($request, $options) {
                $this->invokeStats($request, $options, $value);
                if ($this->onFulfilled) {
                    call_user_func($this->onFulfilled, $value);
                }
                if (isset($options['sink'])) {
                    $contents = (string) $value->getBody();
                    $sink = $options['sink'];

                    if (is_resource($sink)) {
                        fwrite($sink, $contents);
                    } elseif (is_string($sink)) {
                        file_put_contents($sink, $contents);
                    } elseif ($sink instanceof \Psr\Http\Message\StreamInterface) {
                        $sink->write($contents);
                    }
                }

                return $value;
            },
            function ($reason) use ($request, $options) {
                $this->invokeStats($request, $options, null, $reason);
                if ($this->onRejected) {
                    call_user_func($this->onRejected, $reason);
                }
                return \GuzzleHttp\Promise\rejection_for($reason);
            }
        );
    }

    /**
     * Adds one or more variadic requests, exceptions, callables, or promises
     * to the queue.
     */
    public function append()
    {
        foreach (func_get_args() as $value) {
            if ($value instanceof ResponseInterface
                || $value instanceof \Exception
                || $value instanceof PromiseInterface
                || is_callable($value)
            ) {
                $this->queue[] = $value;
            } else {
                throw new \InvalidArgumentException('Expected a response or '
                    . 'exception. Found ' . \GuzzleHttp\describe_type($value));
            }
        }
    }

    /**
     * Get the last received request.
     *
     * @return RequestInterface
     */
    public function getLastRequest()
    {
        return $this->lastRequest;
    }

    /**
     * Get the last received request options.
     *
     * @return array
     */
    public function getLastOptions()
    {
        return $this->lastOptions;
    }

    /**
     * Returns the number of remaining items in the queue.
     *
     * @return int
     */
    public function count()
    {
        return count($this->queue);
    }

    private function invokeStats(
        RequestInterface $request,
        array $options,
        ResponseInterface $response = null,
        $reason = null
    ) {
        if (isset($options['on_stats'])) {
            $stats = new TransferStats($request, $response, 0, $reason);
            call_user_func($options['on_stats'], $stats);
        }
    }
}
