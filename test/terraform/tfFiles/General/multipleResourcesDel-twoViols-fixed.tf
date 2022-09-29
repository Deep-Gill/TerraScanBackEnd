resource "aws_athena_workgroup" "test2" {
 configuration {
   result_configuration {
     output_location = "s3://mys3bucket"
    }
  }
}

