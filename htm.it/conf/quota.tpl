# HTM-IT System Quota Configuration


[instance_quota_table]
# Instance quota table for HTM-IT on the supported HTM-IT host instance types

standard.ec2.m1.medium = 32
standard.ec2.m1.large = 65
standard.ec2.m1.xlarge = 105
standard.ec2.m3.medium = 40
standard.ec2.m3.large = 90
standard.ec2.m3.xlarge = 130
standard.ec2.m3.2xlarge = 250

# Development infrastructure (e.g., MacBook dev laptops)
standard.dev.dev = 1000



[actual]
# Actual quota as determined and overridden dynamically by the htm.it.app.quota
# module at runtime before HTM-IT services are started.

instance_quota = 32
