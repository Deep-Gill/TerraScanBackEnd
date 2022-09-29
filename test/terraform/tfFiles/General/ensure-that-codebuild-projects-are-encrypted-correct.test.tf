resource "aws_codebuild_project" "example" {
  name           = "test-project-cache"
  description    = "test_codebuild_project_cache"
  build_timeout  = "5"
  queued_timeout = "5"
  encryption_key = "arn:aws:kms:us-east-1:123123:alias/aws/s3"
}
