
resource "aws_s3_bucket" "bucket" {
  acl    = var.s3_bucket_acl
  bucket = var.s3_bucket_name
  policy = var.s3_bucket_policy

  force_destroy = var.s3_bucket_force_destroy
  versioning {
    enabled    = var.versioning
    mfa_delete = var.mfa_delete
  }

}

