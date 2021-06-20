# Welcome to your CDK TypeScript project!

This CDK project create:

* EC2 AmazonLinux Instance with Assets
* Python Tornado Web server
* Assets
  * initial sh
  * tornado
  * systemd service
  * cloudwatch agent conf

* `cdk deploy`      deploy this stack to your default AWS account/region
* `ssh ec2-user@xxx.xxx.xxx.xxx -i ~/.ssh/xxxxxx.pem`   login