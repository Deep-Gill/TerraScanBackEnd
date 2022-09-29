resource "aws_transfer_server" "test" {
    endpoint_type = "CPSC"
    protocols   = ["SFTP"]
}