
resource "aws_s3_bucket_public_access_block" "artifacts" {
  count  = var.bucketname == "" ? 1 : 0
  bucket = aws_s3_bucket.artifacts[0].id
  
  block_public_acls   = true
  restrict_public_buckets = true
  ignore_public_acls=true
}
