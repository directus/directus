<?php

namespace Directus\Exception;

use Directus\Bootstrap;
use Directus\Hook\Hook;
use Directus\View\ExceptionView;
use ErrorException;

class ExceptionHandler
{
    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected $emitter;

    public function __construct()
    {
        set_error_handler([$this, 'handleError']);
        set_exception_handler([$this, 'handleException']);
        register_shutdown_function([$this, 'handleShutdown']);

        $this->emitter = Bootstrap::get('hookEmitter');
    }

    /**
     *
     * @param  int $level
     * @param  string $message
     * @param  string $file
     * @param  int $line
     * @param  array $context
     * @return void
     *
     * @throws \ErrorException
     */
    public function handleError($level, $message, $file = '', $line = 0, $context = [])
    {
        if (error_reporting() & $level) {
            $e = new ErrorException($message, 0, $level, $file, $line);
            $this->emitter->run('application.error', $e);
        }
    }

    /**
     * Handle an uncaught exception
     *
     * @param  \Throwable $e
     * @return void
     */
    public function handleException($e)
    {
        $this->emitter->run('application.error', $e);
        $app = Bootstrap::get('app');
        $exceptionView = new ExceptionView();
        $exceptionView->exceptionHandler($app, $e);
    }

    /**
     * Handle the PHP shutdown event.
     *
     * @return void
     */
    public function handleShutdown()
    {
        if (!is_null($error = error_get_last()) && $this->isFatal($error['type'])) {
            $e = new ErrorException(
                $error['message'], $error['type'], 0, $error['file'], $error['line']
            );

            $this->emitter->run('application.error', $e);
        }
    }

    /**
     * Determine if the error type is fatal.
     *
     * @param  int $type
     * @return bool
     */
    protected function isFatal($type)
    {
        return in_array($type, [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE]);
    }
}
