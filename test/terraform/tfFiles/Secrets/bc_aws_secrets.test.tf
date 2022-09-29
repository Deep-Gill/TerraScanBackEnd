


resource "aws_instance" "web" {
    instance_type = "t3.micro"
    user_data = "access_key=123456ABCDEFGHIJZTLA and secret_key=AAAaa+Aa4AAaAA6aAkA0Ad+Aa8aA1aaaAAAaAaA"
}

