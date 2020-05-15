# Upgrading Phinx to 0.6

* Phinx 0.6 allows template creation access to the InputInterface and OutputInterface.
    To upgrade, rather than implementing the ```\Phinx\Migration\CreationInterface``` interface in your
    template creation class, extend the ```\Phinx\Migration\AbstractTemplateCreation``` abstract class.
