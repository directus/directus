<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Default utility for PHP sub-processes.
 */
class PHPUnit_Util_PHP_Default extends PHPUnit_Util_PHP
{
    /**
     * @var string
     */
    protected $tempFile;

    /**
     * @var bool
     */
    protected $useTempFile = false;

    /**
     * Runs a single job (PHP code) using a separate PHP process.
     *
     * @param string $job
     * @param array  $settings
     *
     * @return array
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function runJob($job, array $settings = [])
    {
        if ($this->useTempFile || $this->stdin) {
            if (!($this->tempFile = tempnam(sys_get_temp_dir(), 'PHPUnit')) ||
                file_put_contents($this->tempFile, $job) === false) {
                throw new PHPUnit_Framework_Exception(
                    'Unable to write temporary file'
                );
            }

            $job = $this->stdin;
        }

        return $this->runProcess($job, $settings);
    }

    /**
     * Returns an array of file handles to be used in place of pipes
     *
     * @return array
     */
    protected function getHandles()
    {
        return [];
    }

    /**
     * Handles creating the child process and returning the STDOUT and STDERR
     *
     * @param string $job
     * @param array  $settings
     *
     * @return array
     *
     * @throws PHPUnit_Framework_Exception
     */
    protected function runProcess($job, $settings)
    {
        $handles = $this->getHandles();

        $env = null;
        if ($this->env) {
            $env = isset($_SERVER) ? $_SERVER : [];
            unset($env['argv'], $env['argc']);
            $env = array_merge($env, $this->env);

            foreach ($env as $envKey => $envVar) {
                if (is_array($envVar)) {
                    unset($env[$envKey]);
                }
            }
        }

        $pipeSpec = [
            0 => isset($handles[0]) ? $handles[0] : ['pipe', 'r'],
            1 => isset($handles[1]) ? $handles[1] : ['pipe', 'w'],
            2 => isset($handles[2]) ? $handles[2] : ['pipe', 'w'],
        ];
        $process = proc_open(
            $this->getCommand($settings, $this->tempFile),
            $pipeSpec,
            $pipes,
            null,
            $env
        );

        if (!is_resource($process)) {
            throw new PHPUnit_Framework_Exception(
                'Unable to spawn worker process'
            );
        }

        if ($job) {
            $this->process($pipes[0], $job);
        }
        fclose($pipes[0]);

        if ($this->timeout) {
            $stderr = $stdout = '';
            unset($pipes[0]);

            while (true) {
                $r = $pipes;
                $w = null;
                $e = null;

                $n = @stream_select($r, $w, $e, $this->timeout);

                if ($n === false) {
                    break;
                } elseif ($n === 0) {
                    proc_terminate($process, 9);
                    throw new PHPUnit_Framework_Exception(sprintf('Job execution aborted after %d seconds', $this->timeout));
                } elseif ($n > 0) {
                    foreach ($r as $pipe) {
                        $pipeOffset = 0;
                        foreach ($pipes as $i => $origPipe) {
                            if ($pipe == $origPipe) {
                                $pipeOffset = $i;
                                break;
                            }
                        }

                        if (!$pipeOffset) {
                            break;
                        }

                        $line = fread($pipe, 8192);
                        if (strlen($line) == 0) {
                            fclose($pipes[$pipeOffset]);
                            unset($pipes[$pipeOffset]);
                        } else {
                            if ($pipeOffset == 1) {
                                $stdout .= $line;
                            } else {
                                $stderr .= $line;
                            }
                        }
                    }

                    if (empty($pipes)) {
                        break;
                    }
                }
            }
        } else {
            if (isset($pipes[1])) {
                $stdout = stream_get_contents($pipes[1]);
                fclose($pipes[1]);
            }

            if (isset($pipes[2])) {
                $stderr = stream_get_contents($pipes[2]);
                fclose($pipes[2]);
            }
        }

        if (isset($handles[1])) {
            rewind($handles[1]);
            $stdout = stream_get_contents($handles[1]);
            fclose($handles[1]);
        }

        if (isset($handles[2])) {
            rewind($handles[2]);
            $stderr = stream_get_contents($handles[2]);
            fclose($handles[2]);
        }

        proc_close($process);
        $this->cleanup();

        return ['stdout' => $stdout, 'stderr' => $stderr];
    }

    /**
     * @param resource $pipe
     * @param string   $job
     *
     * @throws PHPUnit_Framework_Exception
     */
    protected function process($pipe, $job)
    {
        fwrite($pipe, $job);
    }

    protected function cleanup()
    {
        if ($this->tempFile) {
            unlink($this->tempFile);
        }
    }
}
