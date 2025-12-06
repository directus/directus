# =============================================================================
# Packer Template: F2F Directus Base Images
# =============================================================================
# This template builds images for multiple platforms:
# - AWS AMI (for EC2 deployment)
# - VirtualBox OVA (for local testing)
# - VMware (for local testing or vSphere)
#
# All images include:
# - Node.js 22 (LTS)
# - pnpm package manager
# - PM2 process manager
# - Nginx (reverse proxy)
# - Certbot (Let's Encrypt)
# - CloudWatch Agent (AWS only)
# - PostgreSQL client
# - F2F Directus fork pre-cloned and built
#
# Usage:
#   # Build all targets
#   packer build directus-base.pkr.hcl
#
#   # Build specific target
#   packer build -only="virtualbox-iso.directus-local" directus-base.pkr.hcl
#   packer build -only="amazon-ebs.directus-base" directus-base.pkr.hcl
#   packer build -only="vmware-iso.directus-vmware" directus-base.pkr.hcl
# =============================================================================

packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
    virtualbox = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/virtualbox"
    }
    vmware = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/vmware"
    }
  }
}

# =============================================================================
# Variables
# =============================================================================

variable "aws_region" {
  type        = string
  default     = "us-east-2"
  description = "AWS region to build the AMI in"
}

variable "aws_instance_type" {
  type        = string
  default     = "t3.medium"
  description = "AWS instance type for the build"
}

variable "local_cpus" {
  type        = number
  default     = 2
  description = "Number of CPUs for local VMs"
}

variable "local_memory" {
  type        = number
  default     = 4096
  description = "Memory in MB for local VMs"
}

variable "local_disk_size" {
  type        = number
  default     = 30000
  description = "Disk size in MB for local VMs"
}

variable "ami_name_prefix" {
  type        = string
  default     = "f2f-directus-base"
  description = "Prefix for the AMI/image name"
}

variable "build_version" {
  type        = string
  default     = "latest"
  description = "Version tag for the image"
}

variable "directus_repo" {
  type        = string
  default     = "https://github.com/Face-to-Face-IT/directus.git"
  description = "Git repository URL for Directus fork"
}

variable "directus_branch" {
  type        = string
  default     = "main"
  description = "Git branch to checkout"
}

# Ubuntu ISO settings for local builds
variable "iso_url" {
  type        = string
  default     = "https://releases.ubuntu.com/24.04/ubuntu-24.04.1-live-server-amd64.iso"
  description = "Ubuntu ISO URL"
}

variable "iso_checksum" {
  type        = string
  default     = "sha256:e240e4b801f7bb68c20d1356b60571d7c4f50a73e6a99da0a634d2dd9168fb1f"
  description = "Ubuntu ISO checksum"
}

# =============================================================================
# Locals
# =============================================================================

locals {
  timestamp  = formatdate("YYYYMMDD-hhmmss", timestamp())
  image_name = "${var.ami_name_prefix}-${var.build_version}-${local.timestamp}"

  common_tags = {
    Application = "directus"
    ManagedBy   = "packer"
    BuildTime   = local.timestamp
    Version     = var.build_version
  }
}

# =============================================================================
# Source: Amazon EBS (AWS AMI)
# =============================================================================

data "amazon-ami" "ubuntu" {
  filters = {
    name                = "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"
    root-device-type    = "ebs"
    virtualization-type = "hvm"
  }
  most_recent = true
  owners      = ["099720109477"] # Canonical
  region      = var.aws_region
}

source "amazon-ebs" "directus-base" {
  ami_name        = local.image_name
  ami_description = "F2F Directus base image with Node.js, Nginx, and PM2"
  instance_type   = var.aws_instance_type
  region          = var.aws_region
  source_ami      = data.amazon-ami.ubuntu.id
  ssh_username    = "ubuntu"

  associate_public_ip_address = true
  encrypt_boot                = true

  tags = merge(local.common_tags, {
    Name      = local.image_name
    SourceAMI = data.amazon-ami.ubuntu.id
  })

  run_tags = merge(local.common_tags, {
    Name = "packer-build-${local.image_name}"
  })

  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  ssh_timeout = "10m"
  aws_polling {
    delay_seconds = 30
    max_attempts  = 60
  }
}

# =============================================================================
# Source: VirtualBox ISO (Local Testing)
# =============================================================================

source "virtualbox-iso" "directus-local" {
  vm_name          = local.image_name
  guest_os_type    = "Ubuntu_64"
  iso_url          = var.iso_url
  iso_checksum     = var.iso_checksum
  ssh_username     = "ubuntu"
  ssh_password     = "ubuntu"
  ssh_timeout      = "30m"
  shutdown_command = "echo 'ubuntu' | sudo -S shutdown -P now"

  cpus      = var.local_cpus
  memory    = var.local_memory
  disk_size = var.local_disk_size

  http_directory = "${path.root}/http"

  boot_command = [
    "c<wait>",
    "linux /casper/vmlinuz --- autoinstall ds='nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/'",
    "<enter><wait>",
    "initrd /casper/initrd",
    "<enter><wait>",
    "boot",
    "<enter>"
  ]

  boot_wait = "5s"

  vboxmanage = [
    ["modifyvm", "{{.Name}}", "--nat-localhostreachable1", "on"],
  ]

  output_directory = "${path.root}/output-virtualbox"
  format           = "ova"
}

# =============================================================================
# Source: VMware ISO (Local Testing / vSphere)
# =============================================================================

source "vmware-iso" "directus-vmware" {
  vm_name          = local.image_name
  guest_os_type    = "ubuntu-64"
  iso_url          = var.iso_url
  iso_checksum     = var.iso_checksum
  ssh_username     = "ubuntu"
  ssh_password     = "ubuntu"
  ssh_timeout      = "30m"
  shutdown_command = "echo 'ubuntu' | sudo -S shutdown -P now"

  cpus      = var.local_cpus
  memory    = var.local_memory
  disk_size = var.local_disk_size

  http_directory = "${path.root}/http"

  boot_command = [
    "c<wait>",
    "linux /casper/vmlinuz --- autoinstall ds='nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/'",
    "<enter><wait>",
    "initrd /casper/initrd",
    "<enter><wait>",
    "boot",
    "<enter>"
  ]

  boot_wait = "5s"

  output_directory = "${path.root}/output-vmware"
}

# =============================================================================
# Build
# =============================================================================

build {
  name = "directus"

  sources = [
    "source.amazon-ebs.directus-base",
    "source.virtualbox-iso.directus-local",
    "source.vmware-iso.directus-vmware"
  ]

  # Wait for cloud-init to complete (AWS and local)
  provisioner "shell" {
    inline = [
      "echo 'Waiting for cloud-init to complete...'",
      "cloud-init status --wait || true",
      "echo 'Cloud-init complete.'"
    ]
  }

  # System updates and base packages
  provisioner "shell" {
    inline = [
      "echo '=== Updating system packages ==='",
      "sudo apt-get update -qq",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq",

      "echo '=== Installing base packages ==='",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \\",
      "  ca-certificates curl gnupg lsb-release git jq ufw unzip htop vim \\",
      "  build-essential python3 postgresql-client dnsutils"
    ]
  }

  # Install Node.js 22 LTS
  provisioner "shell" {
    inline = [
      "echo '=== Installing Node.js 22 LTS ==='",
      "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs",
      "node --version",
      "npm --version"
    ]
  }

  # Install pnpm
  provisioner "shell" {
    inline = [
      "echo '=== Installing pnpm ==='",
      "sudo npm install -g pnpm@10",
      "pnpm --version"
    ]
  }

  # Install PM2 for process management
  provisioner "shell" {
    inline = [
      "echo '=== Installing PM2 ==='",
      "sudo npm install -g pm2",
      "pm2 --version"
    ]
  }

  # Install AWS CLI v2 (AWS only, but doesn't hurt to have on local)
  provisioner "shell" {
    inline = [
      "echo '=== Installing AWS CLI v2 ==='",
      "curl -sL 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o /tmp/awscliv2.zip",
      "unzip -q /tmp/awscliv2.zip -d /tmp",
      "sudo /tmp/aws/install",
      "rm -rf /tmp/aws /tmp/awscliv2.zip",
      "/usr/local/bin/aws --version"
    ]
  }

  # Clone and build Directus
  provisioner "shell" {
    environment_vars = [
      "DIRECTUS_REPO=${var.directus_repo}",
      "DIRECTUS_BRANCH=${var.directus_branch}"
    ]
    inline = [
      "echo '=== Cloning F2F Directus ==='",
      "sudo mkdir -p /opt/directus",
      "sudo chown $(whoami):$(whoami) /opt/directus",
      "git clone --depth 1 --branch $DIRECTUS_BRANCH $DIRECTUS_REPO /opt/directus",

      "echo '=== Installing dependencies ==='",
      "cd /opt/directus",
      "pnpm install",

      "echo '=== Building Directus ==='",
      "pnpm build",

      "echo '=== Creating directories ==='",
      "mkdir -p /opt/directus/uploads",
      "mkdir -p /opt/directus/extensions",
      "mkdir -p /opt/directus/logs"
    ]
  }

  # Install Nginx
  provisioner "shell" {
    inline = [
      "echo '=== Installing Nginx ==='",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx",
      "sudo systemctl enable nginx",

      "# Remove default site",
      "sudo rm -f /etc/nginx/sites-enabled/default",

      "# Create webroot for ACME challenges",
      "sudo mkdir -p /var/www/html/.well-known/acme-challenge",
      "sudo chown -R www-data:www-data /var/www/html"
    ]
  }

  # Install Certbot
  provisioner "shell" {
    inline = [
      "echo '=== Installing Certbot ==='",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx"
    ]
  }

  # Install CloudWatch Agent (AWS only, skipped on local)
  provisioner "shell" {
    only = ["amazon-ebs.directus-base"]
    inline = [
      "echo '=== Installing CloudWatch Agent ==='",
      "curl -sL 'https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb' -o /tmp/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb",
      "rm /tmp/amazon-cloudwatch-agent.deb",
      "sudo systemctl enable amazon-cloudwatch-agent"
    ]
  }

  # Upload Nginx template
  provisioner "file" {
    source      = "${path.root}/files/nginx-directus.conf.template"
    destination = "/tmp/nginx-directus.conf.template"
  }

  provisioner "shell" {
    inline = [
      "sudo mkdir -p /etc/nginx/templates",
      "sudo mv /tmp/nginx-directus.conf.template /etc/nginx/templates/"
    ]
  }

  # Upload CloudWatch Agent template (AWS only)
  provisioner "file" {
    only        = ["amazon-ebs.directus-base"]
    source      = "${path.root}/files/cloudwatch-agent.json.template"
    destination = "/tmp/cloudwatch-agent.json.template"
  }

  provisioner "shell" {
    only = ["amazon-ebs.directus-base"]
    inline = [
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/templates",
      "sudo mv /tmp/cloudwatch-agent.json.template /opt/aws/amazon-cloudwatch-agent/etc/templates/"
    ]
  }

  # Upload PM2 ecosystem config template
  provisioner "file" {
    source      = "${path.root}/files/ecosystem.config.js.template"
    destination = "/tmp/ecosystem.config.js.template"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/ecosystem.config.js.template /opt/directus/"
    ]
  }

  # Upload tenant configuration script (AWS)
  provisioner "file" {
    only        = ["amazon-ebs.directus-base"]
    source      = "${path.root}/files/configure-tenant.sh"
    destination = "/tmp/configure-tenant.sh"
  }

  provisioner "shell" {
    only = ["amazon-ebs.directus-base"]
    inline = [
      "sudo mv /tmp/configure-tenant.sh /usr/local/bin/configure-tenant.sh",
      "sudo chmod +x /usr/local/bin/configure-tenant.sh"
    ]
  }

  # Upload local configuration script (VirtualBox/VMware)
  provisioner "file" {
    only        = ["virtualbox-iso.directus-local", "vmware-iso.directus-vmware"]
    source      = "${path.root}/files/configure-local.sh"
    destination = "/tmp/configure-local.sh"
  }

  provisioner "shell" {
    only = ["virtualbox-iso.directus-local", "vmware-iso.directus-vmware"]
    inline = [
      "sudo mv /tmp/configure-local.sh /usr/local/bin/configure-local.sh",
      "sudo chmod +x /usr/local/bin/configure-local.sh"
    ]
  }

  # Create systemd service for PM2
  provisioner "shell" {
    inline = [
      "echo '=== Setting up PM2 startup ==='",
      "sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME || true",
      "sudo systemctl enable pm2-$(whoami) || true"
    ]
  }

  # Clean up
  provisioner "shell" {
    inline = [
      "echo '=== Cleaning up ==='",
      "sudo apt-get clean",
      "sudo apt-get autoremove -y",
      "sudo rm -rf /var/lib/apt/lists/*",
      "sudo rm -rf /tmp/*",
      "sudo rm -rf /var/tmp/*",

      "# Clear pnpm cache",
      "pnpm store prune || true",

      "# Clear logs",
      "sudo journalctl --vacuum-time=1d || true",
      "sudo find /var/log -type f -name '*.log' -exec truncate -s 0 {} \\; || true",

      "# Clear bash history",
      "rm -f ~/.bash_history || true"
    ]
  }

  # Output manifest (AWS only)
  post-processor "manifest" {
    only       = ["amazon-ebs.directus-base"]
    output     = "manifest.json"
    strip_path = true
    custom_data = {
      version    = var.build_version
      build_time = local.timestamp
      region     = var.aws_region
    }
  }
}
