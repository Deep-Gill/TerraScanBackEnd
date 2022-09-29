resource "aws_security_group" "example" {
  ingress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
  }  
}

