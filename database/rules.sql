INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('ensure-that-codebuild-projects-are-encrypted.yaml', '{"resource":"aws_codebuild_project","severity":"MEDIUM","category":"GENERAL","has":[{"key":"encryption_key"}]}'::json::json, '2021-12-01 02:59:28.603', '2021-12-01 02:59:28.603', 1, 'GENERAL', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('ensure-that-athena-workgroup-is-encrypted.yaml', '{"resource":"aws_athena_workgroup","severity":"MEDIUM","category":"GENERAL","has":[{"key":"configuration.result_configuration.encryption_configuration"}]}'::json::json, '2021-12-01 02:59:58.381', '2021-12-01 02:59:58.381', 1, 'GENERAL', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure container insights are enabled on ECS cluster', '{"resource":"aws_ecs_cluster","severity":"MEDIUM","category":"LOGGING","description":"Ensure container insights are enabled on ECS cluster","has":[{"key":"setting.name","value":"containerInsights"},{"key":"setting.value","value":"enabled"}]}'::json::json, '2021-12-01 03:00:22.723', '2021-12-01 03:00:22.723', 1, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure AWS CloudTrail is enabled in all regions', '{"resource":"aws_cloudtrail","severity":"CRITICAL","category":"LOGGING","description":"Ensure AWS CloudTrail is enabled in all regions","has":[{"key":"is_multi_region_trail","value":true}]}'::json::json, '2021-12-01 03:00:25.603', '2021-12-01 03:00:25.603', 3, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure AWS CloudTrail log validation is enabled in all regions', '{"resource":"aws_cloudtrail","severity":"CRITICAL","category":"LOGGING","description":"Ensure AWS CloudTrail log validation is enabled in all regions","has":[{"key":"enable_log_file_validation","value":true}]}'::json::json, '2021-12-01 03:00:29.183', '2021-12-01 03:00:29.183', 3, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure AWS config is enabled in all regions', '{"resource":"aws_config_configuration_aggregator","severity":"MEDIUM","category":"LOGGING","description":"Ensure AWS config is enabled in all regions","has":[{"key":"all_regions","value":true}]}'::json::json, '2021-12-01 03:00:32.302', '2021-12-01 03:00:32.302', 1, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure AWS CMK rotation is enabled', '{"resource":"aws_kms_key","severity":"CRITICAL","category":"LOGGING","description":"Ensure AWS CMK rotation is enabled","has":[{"key":"aws_kms_key","value":true}]}'::json::json, '2021-12-01 03:00:37.696', '2021-12-01 03:00:37.696', 3, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure Global Accelerator has Flow logs enabled', '{"resource":"aws_globalaccelerator_accelerator","severity":"LOW","category":"LOGGING","description":"Ensure Global Accelerator has Flow logs enabled","has":[{"key":"attributes.flow_logs_enabled","value":true}]}'::json::json, '2021-12-01 03:00:41.042', '2021-12-01 03:00:41.042', 0, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure AWS DocumentDB logging is enabled', '{"resource":"aws_docdb_cluster","severity":"MEDIUM","category":"LOGGING","description":"Ensure AWS DocumentDB logging is enabled","has":[{"key":"enabled_cloudwatch_logs_exports","range":["audit","profiler"]}]}'::json::json, '2021-12-01 03:00:44.580', '2021-12-01 03:00:44.580', 1, 'LOGGING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure Transfer Server is not exposed publicly', '{"resource":"aws_transfer_server","severity":"MEDIUM","category":"NETWORKING","description":"Ensure Transfer Server is not exposed publicly","has":[{"key":"endpoint_type","value":"VPC"}]}'::json::json, '2021-12-01 03:00:49.842', '2021-12-01 03:00:49.842', 1, 'NETWORKING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('JJ_aws_network_must_use_10_subnet.yaml', '{"resource":"aws_vpc","severity":"HIGH","category":"STORAGE","has":[{"key":"cidr_block","value":"10.0.0.0"}]}'::json::json, '2021-12-01 03:00:52.722', '2021-12-01 03:00:52.722', 2, 'STORAGE', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure AWS Security Group does not allow all traffic on SSH port 22', '{"resource":"aws_security_group","severity":"MEDIUM","category":"NETWORKING","description":"Ensure AWS Security Group does not allow all traffic on SSH port 22","has_not":[{"key":"ingress.cidr_blocks","value":"0.0.0.0/0"}]}'::json::json, '2021-12-01 03:00:56.723', '2021-12-01 03:00:56.723', 1, 'NETWORKING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure every Security Group rule has a description', '{"resource":"aws_security_group","severity":"LOW","category":"NETWORKING","description":"Ensure every Security Group rule has a description","has":[{"key":"ingress.description"}]}'::json::json, '2021-12-01 03:00:59.620', '2021-12-01 03:00:59.620', 0, 'NETWORKING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('Ensure CloudFront distribution ViewerProtocolPolicy is set to HTTPS', '{"resource":"aws_cloudfront_distribution","severity":"MEDIUM","category":"NETWORKING","description":"Ensure CloudFront distribution ViewerProtocolPolicy is set to HTTPS","has":[{"key":"default_cache_behavior.viewer_protocol_policy","range":["redirect-to-https","https-only"]}]}'::json::json, '2021-12-01 03:01:02.802', '2021-12-01 03:01:02.802', 1, 'NETWORKING', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('public_11.yaml', '{"resource":"aws_mq_broker","severity":"HIGH","category":"PUBLIC","has":[{"key":"publicly_accessible","value":true}]}'::json::json, '2021-12-01 03:01:08.059', '2021-12-01 03:01:08.059', 2, 'PUBLIC', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('bc_aws_secrets_1.yaml', '{"resource":"aws_instance","severity":"HIGH","category":"SECRETS","has_not":[{"key":"user_data"}]}'::json::json, '2021-12-01 03:01:12.766', '2021-12-01 03:01:12.766', 2, 'SECRETS', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('bc_aws_s3_20.yaml', '{"resource":"aws_s3_bucket_public_access_block","severity":"MEDIUM","category":"STORAGE","has":[{"key":"block_public_policy","value":true}]}'::json::json, '2021-12-01 03:01:18.602', '2021-12-01 03:01:18.602', 1, 'STORAGE', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('ensure-docdb-has-audit-logs-enabled.yaml', '{"resource":"aws_docdb_cluster_parameter_group","severity":"LOW","category":"STORAGE","has":[{"key":"parameter.value","value":"enabled"},{"key":"parameter.name","value":"audit_logs"}]}'::json::json, '2021-12-01 03:01:21.627', '2021-12-01 03:01:21.627', 0, 'STORAGE', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('JJ_aws_s3_server_side_encryption.yaml', '{"resource":"aws_s3_bucket","severity":"MEDIUM","category":"STORAGE","has":[{"key":"server_side_encryption_confirmation"}]}'::json::json, '2021-12-01 03:01:25.044', '2021-12-01 03:01:25.044', 1, 'STORAGE', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('s3_7-acl-write-permissions-aws.yaml', '{"resource":"aws_s3_bucket.data","severity":"CRITICAL","category":"STORAGE","has_not":[{"key":"acl","value":"public-write"}]}'::json::json, '2021-12-01 03:01:28.022', '2021-12-01 03:01:28.022', 3, 'STORAGE', true);
INSERT INTO public.rules
(description, yaml_file, created, last_modified, severity, category, enabled)
VALUES('s3_13-enable-logging.yaml', '{"resource":"aws_s3_bucket","severity":"MEDIUM","category":"STORAGE","has":[{"key":"logging"}]}'::json::json, '2021-12-01 03:01:31.122', '2021-12-01 03:01:31.122', 1, 'STORAGE', true);
