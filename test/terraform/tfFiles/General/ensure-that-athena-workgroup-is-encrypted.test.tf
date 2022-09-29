

resource "aws_athena_workgroup" "test" {
 configuration {
   result_configuration {
     output_location = "s3://mys3bucket"
    }
  }
}