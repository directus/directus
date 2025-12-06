# =============================================================================
# Packer Template: F2F Directus Base AMI
# =============================================================================
# This template builds an AMI with Directus installed natively (not Docker):
# - Node.js 22 (LTS)
# - pnpm package manager
# - PM2 process manager
# - Nginx (reverse proxy)
# - Certbot (Let's Encrypt)
# - CloudWatch Agent
# - AWS CLI v2
# - PostgreSQL client
# - F2F Directus fork pre-cloned and built
#
# Tenant-specific configuration is applied at runtime via user-data.
# =============================================================================

packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
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

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "Instance type for the build (needs memory for pnpm install)"
}

variable "ami_name_prefix" {
  type        = string
  default     = "f2f-directus-base"
  description = "Prefix for the AMI name"
}

variable "ami_description" {
  type        = string
  default     = "F2F Directus base image with Node.js, Nginx, Certbot, and CloudWatch Agent"
  description = "Description for the AMI"
}

variable "source_ami_filter_name" {
  type        = string
  default     = "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"
  description = "Filter pattern for source AMI"
}

variable "source_ami_owner" {
  type        = string
  default     = "099720109477" # Canonical
  description = "Owner ID for source AMI"
}

variable "ssh_username" {
  type        = string
  default     = "ubuntu"
  description = "SSH username for provisioning"
}

variable "build_version" {
  type        = string
  default     = "latest"
  description = "Version tag for the AMI (typically git SHA or semantic version)"
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

# =============================================================================
# Data Sources
# =============================================================================

data "amazon-ami" "ubuntu" {
  filters = {
    name                = var.source_ami_filter_name
    root-device-type    = "ebs"
    virtualization-type = "hvm"
  }
  most_recent = true
  owners      = [var.source_ami_owner]
  region      = var.aws_region
}

# =============================================================================
# Locals
# =============================================================================

locals {
  timestamp = formatdate("YYYYMMDD-hhmmss", timestamp())
  ami_name  = "${var.ami_name_prefix}-${var.build_version}-${local.timestamp}"

  tags = {
    Name        = local.ami_name
    Application = "directus"
    ManagedBy   = "packer"
    BuildTime   = local.timestamp
    Version     = var.build_version
    SourceAMI   = data.amazon-ami.ubuntu.id
  }
}

# =============================================================================
# Source: Amazon EBS
# =============================================================================

source "amazon-ebs" "directus-base" {
  ami_name        = local.ami_name
  ami_description = var.ami_description
  instance_type   = var.instance_type
  region          = var.aws_region
  source_ami      = data.amazon-ami.ubuntu.id
  ssh_username    = var.ssh_username

  # Build in default VPC with public IP for provisioning
  associate_public_ip_address = true

  # AMI settings
  encrypt_boot = true

  # Tags
  tags = local.tags

  run_tags = merge(local.tags, {
    Name = "packer-build-${local.ami_name}"
  })

  # Launch block device mapping
  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # Wait for AMI to be available
  ami_regions = [] # Only keep in build region

  # Timeout settings
  ssh_timeout = "10m"
  aws_polling {
    delay_seconds = 30
    max_attempts  = 60
  }
}

# =============================================================================
# Build
# =============================================================================

build {
  name    = "directus-base"
  sources = ["source.amazon-ebs.directus-base"]

  # Wait for cloud-init to complete
  provisioner "shell" {
    inline = [
      "echo 'Waiting for cloud-init to complete...'",
      "cloud-init status --wait",
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
      "  build-essential python3 postgresql-client"
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

  # Install AWS CLI v2
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

  # Install PM2 for process management
  provisioner "shell" {
    inline = [
      "echo '=== Installing PM2 ==='",
      "sudo npm install -g pm2",
      "pm2 --version"
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
      "sudo chown ubuntu:ubuntu /opt/directus",
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

  # Install CloudWatch Agent
  provisioner "shell" {
    inline = [
      "echo '=== Installing CloudWatch Agent ==='",
      "curl -sL 'https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb' -o /tmp/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb",
      "rm /tmp/amazon-cloudwatch-agent.deb",

      "# Enable but don't start (will be configured at runtime)",
      "sudo systemctl enable amazon-cloudwatch-agent"
    ]
  }

  # Upload Nginx template (will be configured at runtime)
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

  # Upload CloudWatch Agent template
  provisioner "file" {
    source      = "${path.root}/files/cloudwatch-agent.json.template"
    destination = "/tmp/cloudwatch-agent.json.template"
  }

  provisioner "shell" {
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

  # Upload tenant configuration script
  provisioner "file" {
    source      = "${path.root}/files/configure-tenant.sh"
    destination = "/tmp/configure-tenant.sh"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/configure-tenant.sh /usr/local/bin/configure-tenant.sh",
      "sudo chmod +x /usr/local/bin/configure-tenant.sh"
    ]
  }

  # Create systemd service for PM2
  provisioner "shell" {
    inline = [
      "echo '=== Setting up PM2 startup ==='",
      "sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu",
      "sudo systemctl enable pm2-ubuntu"
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

      "# Clear pnpm cache (keep node_modules)",
      "pnpm store prune || true",

      "# Clear logs",
      "sudo journalctl --vacuum-time=1d",
      "sudo find /var/log -type f -name '*.log' -exec truncate -s 0 {} \\;",

      "# Clear bash history",
      "rm -f ~/.bash_history || true"
    ]
  }

  # Output manifest
  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
    custom_data = {
      version    = var.build_version
      build_time = local.timestamp
      region     = var.aws_region
    }
  }
}
