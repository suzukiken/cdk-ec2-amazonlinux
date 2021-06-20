import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as assets from '@aws-cdk/aws-s3-assets';
import * as path from 'path'

export class CdkEc2AmazonlinuxStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const vpc_id = this.node.tryGetContext('vpc_id')
    const ami_id = this.node.tryGetContext('ami_id')
    const key_name = this.node.tryGetContext('key_name')
    const securitygroup_id = this.node.tryGetContext('securitygroup_id')
    
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: vpc_id })
    
    const init_asset = new assets.Asset(this, 'InitAsset', {
      path: path.join(__dirname, '..', 'userdata', 'initalize.sh'),
    })
    
    const server_asset = new assets.Asset(this, 'ServerAsset', {
      path: path.join(__dirname, '..', 'userdata', 'tornado_server.py'),
    })
    
    const service_conf_asset = new assets.Asset(this, 'ServiceConfAsset', {
      path: path.join(__dirname, '..', 'userdata', 'tornado.service'),
    })
    
    const cfagent_conf_asset = new assets.Asset(this, 'CfagentConfAsset', {
      path: path.join(__dirname, '..', 'userdata', 'cloudwatch-agent-config.json'),
    })
    
    const userData = ec2.UserData.forLinux()
    
    const init_sh_path = userData.addS3DownloadCommand({
      bucket: init_asset.bucket,
      bucketKey: init_asset.s3ObjectKey,
    })
    
    const server_py_path = userData.addS3DownloadCommand({
      bucket: server_asset.bucket,
      bucketKey: server_asset.s3ObjectKey,
    })
    
    const service_conf_path = userData.addS3DownloadCommand({
      bucket: service_conf_asset.bucket,
      bucketKey: service_conf_asset.s3ObjectKey,
    })
    
    const cfagent_conf_path = userData.addS3DownloadCommand({
      bucket: cfagent_conf_asset.bucket,
      bucketKey: cfagent_conf_asset.s3ObjectKey,
    })
    
    userData.addExecuteFileCommand({
      filePath: init_sh_path,
      arguments: cdk.Fn.join(" ", [server_py_path, service_conf_path, cfagent_conf_path])
    })
     
    const linux = ec2.MachineImage.genericLinux({
      'ap-northeast-1': ami_id
    })
    
    const role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "CloudWatchAgentServerPolicy",
        )
      ]
    })

    const instance = new ec2.Instance(this, 'Instance', {
      vpc: vpc,
      machineImage: linux,
      instanceType: new ec2.InstanceType('t3.nano'),
      role: role,
      keyName: key_name,
      userData: userData,
      securityGroup: ec2.SecurityGroup.fromSecurityGroupId(this, 'Ec2SecurityGrp', securitygroup_id)
    })
    
    init_asset.grantRead( instance.role )
    server_asset.grantRead( instance.role )
    service_conf_asset.grantRead( instance.role )
    cfagent_conf_asset.grantRead( instance.role )
    
    new cdk.CfnOutput(this, 'PrivateIp', { value: instance.instancePrivateIp })
    new cdk.CfnOutput(this, 'PublicIp', { value: instance.instancePublicIp })
    
  }
}
