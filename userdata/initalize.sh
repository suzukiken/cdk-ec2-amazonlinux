#!/usr/bin/sh

yum install -y python3-pip
# yum install -y docker
# yum install -y git
yum install -y amazon-cloudwatch-agent

# systemctl start docker

# python3 -m pip install bottle
# python3 -m pip install python-daemon
# 
# touch /var/log/bottle
# echo "going to start" >> bottle
# 
# mv $1 /opt/run.py
# python3 /opt/run.py

python3 -m pip install tornado

mv $1 /opt/tornado_server.py

# set system to run tornado
mv $2 /etc/systemd/system/tornado.service
chmod 644 /etc/systemd/system/tornado.service
systemctl daemon-reload
systemctl enable tornado.service
systemctl start tornado.service

mv $3 /opt/aws/amazon-cloudwatch-agent/bin/config.json
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s
