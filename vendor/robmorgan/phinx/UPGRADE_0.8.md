# Upgrading Phinx to 0.8

* Phinx 0.8 allows for `phinx rollback` and `phinx status` to operate on migrations in reverse execution order,
rather than reverse creation order. To achieve this new ordering, you will need to add a new entry in your
`phinx.yml` file (or equivalent).  
  
  The setting is called `version_order` and supports 2 values:
  * `creation` - this is the default value and matches the standard behaviour of executing rollbacks in the
  reverse order based upon the creation datetime (also known as `version`).
  * `execution` - this is the new value and will execute rollbacks in the reverse order in which they were
  applied.

  This feature will be of most importance when development of migrations takes place in different branches
  within a codebase and are merged in to master for deployment. It will no longer matter when the migrations
  were created if it becomes necessary to rollback the migrations.
