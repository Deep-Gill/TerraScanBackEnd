resource "aws_codebuild_project" "example" {
  name           = "test-project-cache"
  description    = "test_codebuild_project_cache"
  build_timeout  = "5"
  queued_timeout = "5"
}

resource "aws_mq_broker" "example" {
  broker_name = "example"
  publicly_accessible = true
  configuration {
    id       = aws_mq_configuration.test.id
    revision = aws_mq_configuration.test.latest_revision
  }

  engine_type        = "ActiveMQ"
  engine_version     = "5.15.0"
  host_instance_type = "mq.t2.micro"
  security_groups    = [aws_security_group.test.id]

  user {
    username = "ExampleUser"
    password = "MindTheGap"
  }
}

resource "aws_codebuild_project" "test" {
  build_timeout  = "5"
  queued_timeout = "5"
}

resource "aws_mq_broker" "test" {
  broker_name = "example"
  publicly_accessible = true
  configuration {
    id       = aws_mq_configuration.test.id
  }

  engine_type        = "InactiveMQ"
  engine_version     = "5.15.0"
  host_instance_type = "mq.t2.micro"
  security_groups    = [aws_security_group.test.id]

  user {
    password = "MindTheGap"
  }
}

