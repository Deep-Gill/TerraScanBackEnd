resource "aws_ebs_volume" "main" {
  availability_zone = "${var.az}"
  type = "${var.volume_type}"
  size = "${var.size}"
  encrypted = true

  lifecycle {
    prevent_destroy = true
  }
}

data "aws_instance" "main" {
  instance_id = "${var.instance_id}"
}

locals {
  script_dest = "/tmp/attach-data-volume.sh"
}

resource "aws_volume_attachment" "main" {
  device_name = "${var.external_device_name}"
  volume_id = "${aws_ebs_volume.main.id}"
  instance_id = "${var.instance_id}"

  # https://github.com/hashicorp/terraform/issues/2740#issuecomment-288549352
  skip_destroy = true

  provisioner "file" {
    source      = "${path.module}/files/attach-data-volume.sh"
    destination = "${local.script_dest}"
  }

  provisioner "remote-exec" {
    inline = ["chmod +x ${local.script_dest}"]
  }

  provisioner "remote-exec" {
    tags {
      Environment = "${var.environment}"
    }
  }

}
