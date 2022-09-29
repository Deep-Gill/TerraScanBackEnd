


resource "aws_docdb_cluster_parameter_group" "test" {
  parameter {
    name  = "UBC"
    value = "audit_logs"
  }
}