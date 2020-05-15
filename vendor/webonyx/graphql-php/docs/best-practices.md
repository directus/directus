# Config Validation
Defining types using arrays may be error-prone, but **graphql-php** provides config validation
tool to report when config has unexpected structure. 

This validation tool is **disabled by default** because it is time-consuming operation which only 
makes sense during development.

To enable validation - call: `GraphQL\Type\Definition\Config::enableValidation();` in your bootstrap
but make sure to restrict it to debug/development mode only.

# Type Registry
**graphql-php** expects that each type in Schema is presented by single instance. Therefore
if you define your types as separate PHP classes you need to ensure that each type is referenced only once.
 
Technically you can create several instances of your type (for example for tests), but `GraphQL\Type\Schema` 
will throw on attempt to add different instances with the same name.

There are several ways to achieve this depending on your preferences. We provide reference 
implementation below that introduces TypeRegistry class: