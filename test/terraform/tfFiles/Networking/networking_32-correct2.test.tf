resource "aws_cloudfront_distribution" "cloudfront" {
  default_cache_behavior {
    target_origin_id       = "my-origin"
    viewer_protocol_policy = "https-only"
  }
}