# -*- mode: ruby -*-
# vi: set ft=ruby :

$install_software = <<SCRIPT
export DEBIAN_FRONTEND=noninteractive
apt-get -yq update

# INSTALL PostgreSQL
apt-get -yq install postgresql

# Allow external connections to PostgreSQL as postgres
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/9.5/main/postgresql.conf
sed -i "s/peer/trust/" /etc/postgresql/9.5/main/pg_hba.conf
echo 'host all all 0.0.0.0/0 trust' >> /etc/postgresql/9.5/main/pg_hba.conf
service postgresql restart

# INSTALL MySQL
debconf-set-selections <<< "mysql-server mysql-server/root_password password Password123"
debconf-set-selections <<< "mysql-server mysql-server/root_password_again password Password123"
apt-get -yq install mysql-server

# Allow external connections to MySQL as root (with password Password123)
sed -i 's/127\.0\.0\.1/0\.0\.0\.0/g' /etc/mysql/mysql.conf.d/mysqld.cnf
mysql -u root -pPassword123 -e 'USE mysql; UPDATE `user` SET `Host`="%" WHERE `User`="root" AND `Host`="localhost"; DELETE FROM `user` WHERE `Host` != "%" AND `User`="root"; FLUSH PRIVILEGES;'
service mysql restart

# INSTALL SQL Server
# More info here: https://www.microsoft.com/en-us/sql-server/developer-get-started/php-ubuntu

curl -s https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl -s https://packages.microsoft.com/config/ubuntu/16.04/mssql-server.list > /etc/apt/sources.list.d/mssql-server.list
apt-get -yq update
apt-get -yq install mssql-server
printf "YES\nPassword123\nPassword123\ny\ny" | /opt/mssql/bin/mssql-conf setup

curl -s https://packages.microsoft.com/config/ubuntu/16.04/prod.list > /etc/apt/sources.list.d/mssql-tools.list
apt-get -yq update
ACCEPT_EULA=Y apt-get -yq install msodbcsql mssql-tools unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> /home/vagrant/.bash_profile
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> /home/vagrant/.bashrc
source /home/vagrant/.bashrc
SCRIPT


$setup_vagrant_user_environment = <<SCRIPT
if ! grep "cd /vagrant" /home/vagrant/.profile > /dev/null; then
  echo "cd /vagrant" >> /home/vagrant/.profile
fi
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.box = 'bento/ubuntu-16.04'
  config.vm.provider "virtualbox" do |v|
    v.memory = 4096
    v.cpus = 2
  end

  config.vm.network "private_network", ip: "192.168.20.20"

  config.vm.provision 'shell', inline: $install_software
  config.vm.provision 'shell', privileged: false, inline: '/vagrant/.ci/mysql_fixtures.sh'
  config.vm.provision 'shell', privileged: false, inline: '/vagrant/.ci/pgsql_fixtures.sh'
  config.vm.provision 'shell', privileged: false, inline: '/vagrant/.ci/sqlsrv_fixtures.sh'
  config.vm.provision 'shell', inline: $setup_vagrant_user_environment
end
