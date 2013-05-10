## Running the tests

1. Make sure the latest revision of the composer vendors are installed

2. Navigate to the API tests directory

	```
	Daniel:tests danielb$ pwd
	/Users/danielb/Desktop/Projects/directus6/api/tests
	```

3. Run phpunit

	```
	Daniel:tests danielb$ php ../vendor/phpunit/phpunit/phpunit.php
	PHPUnit 3.7.19-18-g19f1d74 by Sebastian Bergmann.

	The Xdebug extension is not loaded. No code coverage will be generated.


	................

	Time: 0 seconds, Memory: 14.50Mb

	OK (16 tests, 16 assertions)
	```