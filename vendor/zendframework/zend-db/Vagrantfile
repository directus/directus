# -*- mode: ruby -*-
# vi: set ft=ruby :

$install_software = <<SCRIPT
export DEBIAN_FRONTEND=noninteractive
apt-get -yq update
apt-get -yq --no-install-suggests --no-install-recommends --force-yes install mysql-server postgresql

# Allow external connections to MySQL as root
sed -i 's/127\.0\.0\.1/0\.0\.0\.0/g' /etc/mysql/my.cnf
mysql -u root -e 'USE mysql; UPDATE `user` SET `Host`="%" WHERE `User`="root" AND `Host`="localhost"; DELETE FROM `user` WHERE `Host` != "%" AND `User`="root"; FLUSH PRIVILEGES;'
service mysql restart


# Allow external connections to PostgreSQL as postgres
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/9.3/main/postgresql.conf
sed -i "s/peer/trust/" /etc/postgresql/9.3/main/pg_hba.conf
echo 'host all all 0.0.0.0/0 trust' >> /etc/postgresql/9.3/main/pg_hba.conf
service postgresql restart
SCRIPT

$setup_vagrant_user_environment = <<SCRIPT
if ! grep "cd /vagrant" /home/vagrant/.profile > /dev/null; then
  echo "cd /vagrant" >> /home/vagrant/.profile
fi
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.box = 'bento/ubuntu-14.04'

  # MySQL port
  config.vm.network 'forwarded_port', guest: 3306, host: 3306, auto_correct: true

  # PostgreSQL port
  config.vm.network 'forwarded_port', guest: 5432, host: 5432, auto_correct: true

  config.vm.provision 'shell', inline: $install_software
  config.vm.provision 'shell', privileged: false, inline: '/vagrant/.ci/mysql_fixtures.sh'
  config.vm.provision 'shell', privileged: false, inline: '/vagrant/.ci/pgsql_fixtures.sh'
  config.vm.provision 'shell', inline: $setup_vagrant_user_environment
end
