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
    
    const asset = new assets.Asset(this, 'Asset', {
      path: path.join(__dirname, '..', 'userdata.sh'),
    })
    
    const userData = ec2.UserData.forLinux()
    const filePath = userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    })
    userData.addExecuteFileCommand({
      filePath: filePath,
      arguments: '--verbose -y'
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
    
    asset.grantRead( instance.role )
    
    new cdk.CfnOutput(this, 'InstancePrivate', { value: instance.instancePrivateIp })
    
  }
}
