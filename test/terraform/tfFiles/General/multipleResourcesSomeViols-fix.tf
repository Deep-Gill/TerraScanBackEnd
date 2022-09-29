resource "aws_athena_workgroup" "test" {
 configuration {
   result_configuration {
     output_location = "s3://mys3bucket"
     encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.example.arn
      }
    }
  }
}

resource "aws_codebuild_project" "example" {
  name           = "test-project-cache"
  description    = "test_codebuild_project_cache"
  build_timeout  = "5"
  queued_timeout = "5"
  encryption_key = "arn:aws:kms:us-east-1:123123:alias/aws/s3"
}


resource "aws_athena_workgroup" "example" {
  name = "example"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.example.bucket}/output/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.example.arn
      }
    }
  }
}

resource "aws_codebuild_project" "testingthis" {
  name           = "test-project-cache"
  description    = "test_codebuild_project_cache"
  build_timeout  = "5"
  queued_timeout = "5"
  encryption_key = "arn:aws:kms:us-east-1:123123:alias/aws/s3"
}