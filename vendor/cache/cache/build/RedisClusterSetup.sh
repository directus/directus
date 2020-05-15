#!/usr/bin/env bash

echo "Setup Redis Cluster"

mkdir build/cluster-test;
cd build/cluster-test
mkdir 7000 7001 7002 7003 7004 7005

cd 7000;
echo "port 7000" > redis.conf
echo "cluster-enabled yes" >> redis.conf
echo "cluster-config-file nodes.conf" >> redis.conf
echo "cluster-node-timeout 5000" >> redis.conf
echo "appendonly yes" >> redis.conf
redis-server ./redis.conf &

cd ../7001;
echo "port 7001" > redis.conf
echo "cluster-enabled yes" >> redis.conf
echo "cluster-config-file nodes.conf" >> redis.conf
echo "cluster-node-timeout 5000" >> redis.conf
echo "appendonly yes" >> redis.conf
redis-server ./redis.conf &

cd ../7002;
echo "port 7002" > redis.conf
echo "cluster-enabled yes" >> redis.conf
echo "cluster-config-file nodes.conf" >> redis.conf
echo "cluster-node-timeout 5000" >> redis.conf
echo "appendonly yes" >> redis.conf
redis-server ./redis.conf &

cd ../7003;
echo "port 7003" > redis.conf
echo "cluster-enabled yes" >> redis.conf
echo "cluster-config-file nodes.conf" >> redis.conf
echo "cluster-node-timeout 5000" >> redis.conf
echo "appendonly yes" >> redis.conf
redis-server ./redis.conf &

cd ../7004;
echo "port 7004" > redis.conf
echo "cluster-enabled yes" >> redis.conf
echo "cluster-config-file nodes.conf" >> redis.conf
echo "cluster-node-timeout 5000" >> redis.conf
echo "appendonly yes" >> redis.conf
redis-server ./redis.conf &

cd ../7005;
echo "port 7005" > redis.conf
echo "cluster-enabled yes" >> redis.conf
echo "cluster-config-file nodes.conf" >> redis.conf
echo "cluster-node-timeout 5000" >> redis.conf
echo "appendonly yes" >> redis.conf
redis-server ./redis.conf &

cd ..
gem install redis;
wget http://download.redis.io/redis-stable/src/redis-trib.rb
echo "yes" | ruby redis-trib.rb create --replicas 1 127.0.0.1:7000 127.0.0.1:7001 \
127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005

cd ../..
