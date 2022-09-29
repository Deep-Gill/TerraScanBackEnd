
resource "aws_elb" "test" {
  name = "test-lb-tf"
  access_logs {
    bucket  = aws_s3_bucket.lb_logs.bucket
    enabled = false
  }
}

