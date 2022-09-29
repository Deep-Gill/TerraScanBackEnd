resource "aws_transfer_server" "test" {
    endpoint_type = "UBC"
    protocols   = ["SFTP"]
}