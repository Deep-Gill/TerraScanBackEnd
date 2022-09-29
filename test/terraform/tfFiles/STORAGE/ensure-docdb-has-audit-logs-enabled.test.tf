resource "aws_docdb_cluster_parameter_group" "test" {
  parameter {
    name  = "audit_logs"
    value = "enabled"
  }
}

