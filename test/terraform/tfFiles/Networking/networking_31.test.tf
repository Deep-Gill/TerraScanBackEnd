




resource "aws_security_group" "examplea" {
  name        = var.es_domain
  description = "Allow inbound traffic to ElasticSearch from VPC CIDR"
  vpc_id      = var.vpc


  ingress {
    cidr_blocks = ["10.0.0.0/16"]
    from_port   = 80
    protocol    = "tcp"
    to_port     = 80
  }
}

