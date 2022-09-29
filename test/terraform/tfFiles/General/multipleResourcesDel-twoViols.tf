resource "aws_athena_workgroup" "test" {
 configuration {
   result_configuration {
     output_location = "s3://mys3bucket"
    }
  }
}

resource "aws_codebuild_project" "example" {
  name           = "test-project-cache"
  description    = "test_codebuild_project_cache"
  build_timeout  = "5"
  queued_timeout = "5"
}

