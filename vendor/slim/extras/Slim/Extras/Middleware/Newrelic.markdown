## Newrelic

Basic integration for [NewRelic](http://newrelic.com)

How to use
----------

  - Basic
    ``` php
    use \Slim\Slim;
    use \Slim\Extras\Middleware\Newrelic;

    $app = new Slim();
    $app->add(new Newrelic());
    ```

  - Custom Application name
    ``` php
    $app->add(new Newrelic(array(
        'newrelic.appname' => 'New Application Name',
    )));
    ```

  - Custom Transaction name
    ``` php
    $app->get('/index', function() use ($app)
    {
        Newrelic::option('transaction.name', 'myIndex');
    )));
    ```

  - Insert Newrelic browser timing headers
    ``` php
    $app->get('/index', function() use ($app)
    {
        $view = $app->view();
        $view->setData(array(
            'rumHeader', Newrelic::getRumHeader(),
            'rumFooter', Newrelic::getRumFooter(),
        );
    )));
    ```

    ``` php
    <head>
        <?php echo $rumHeader; ?>
    </head>
    ...
    <footer>
        <?php echo $rumFooter; ?>
    </footer>
    ```
