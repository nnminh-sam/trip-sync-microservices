#!/bin/bash

# Log everything to /var/log/startup.log for debugging
exec > /var/log/startup.log 2>&1

echo "Running startup script..."

# Update VM packages
sudo apt update -y

# Install Git, Node, and other essentials
sudo apt install -y git

git clone https://github.com/nnminh-sam/ubuntu-helper

cd ubuntu-helper/22.04-LTS

chmod +x install-docker.sh

sudo ./install-docker.sh

cd ..

chmod +x chmod +x install-nodejs-lts.sh

git clone https://github.com/nnminh-sam/trip-sync-microservices
