


resource "aws_transfer_server" "test" {
    endpoint_type = "VPC"
    protocols   = ["SFTP"]
}