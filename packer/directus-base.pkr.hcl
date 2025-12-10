# =============================================================================
# Packer Template: F2F Directus Base Images
# =============================================================================
# This template builds images for multiple platforms:
# - AWS AMI (for EC2 deployment)
# - QEMU/KVM qcow2 (for local testing - can convert to VMDK/VDI)
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
#   # Build specific target (AWS)
#   packer build -only="amazon-ebs.directus-base" directus-base.pkr.hcl
#
#   # Build local VM (QEMU/KVM)
#   packer build -only="qemu.directus-local" directus-base.pkr.hcl
#
# Converting qcow2 to other formats:
#   # For VMware (VMDK)
#   qemu-img convert -f qcow2 -O vmdk output-qemu/directus-local output-qemu/directus-local.vmdk
#
#   # For VirtualBox (VDI)
#   qemu-img convert -f qcow2 -O vdi output-qemu/directus-local output-qemu/directus-local.vdi
#
#   # Or run directly with QEMU/KVM
#   qemu-system-x86_64 -enable-kvm -m 4096 -hda output-qemu/directus-local
# =============================================================================

packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
    qemu = {
      version = ">= 1.1.0"
      source  = "github.com/hashicorp/qemu"
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
  default     = "c6i.xlarge"
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
  default     = "https://releases.ubuntu.com/noble/ubuntu-24.04.3-live-server-amd64.iso"
  description = "Ubuntu ISO URL"
}

variable "iso_checksum" {
  type        = string
  default     = "sha256:c3514bf0056180d09376462a7a1b4f213c1d6e8ea67fae5c25099c6fd3d8274b"
  description = "Ubuntu ISO checksum"
}

variable "headless" {
  type        = bool
  default     = true
  description = "Run QEMU in headless mode (set to false for debugging)"
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
# Source: QEMU/KVM (Local Testing - outputs qcow2, convert to VMDK after)
# =============================================================================

source "qemu" "directus-local" {
  vm_name          = "directus-local"
  iso_url          = var.iso_url
  iso_checksum     = var.iso_checksum
  ssh_username     = "ubuntu"
  ssh_password     = "ubuntu"
  ssh_timeout      = "60m"
  shutdown_command = "echo 'ubuntu' | sudo -S shutdown -P now"

  cpus        = var.local_cpus
  memory      = var.local_memory
  disk_size   = "${var.local_disk_size}M"
  accelerator = "kvm"
  cpu_model   = "host"

  # Output qcow2 format (convert to VMDK after with qemu-img)
  format           = "qcow2"
  output_directory = "${path.root}/output-qemu"

  http_directory = "${path.root}/http"

  # Boot command for Ubuntu 24.04 autoinstall (UEFI/GRUB)
  # 1. Spam spacebar to prevent auto-boot
  # 2. Press 'e' to edit GRUB entry
  # 3. Navigate to linux command line and append autoinstall parameter
  # 4. F10 to boot
  boot_command = [
    "<spacebar><wait><spacebar><wait><spacebar><wait><spacebar><wait><spacebar><wait>",
    "e<wait>",
    "<down><down><down><end>",
    " autoinstall ds=nocloud-net\\;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/",
    "<f10>"
  ]

  boot_wait = "3s"

  # QEMU-specific settings
  headless       = var.headless  # Set to false for debugging: packer build -var headless=false
  disk_interface = "virtio"
  net_device     = "virtio-net"
}

# =============================================================================
# Build
# =============================================================================

build {
  sources = [
    "source.amazon-ebs.directus-base",
    "source.qemu.directus-local"
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
      "echo '=== Updating system packages ===' ",
      "sudo apt-get update -qq",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq",

      "echo '=== Installing base packages ===' ",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \\",
      "  ca-certificates curl gnupg lsb-release git jq ufw unzip htop vim \\",
      "  build-essential python3 postgresql-client dnsutils"
    ]
  }

  # Install Node.js 22 LTS
  provisioner "shell" {
    inline = [
      "echo '=== Installing Node.js 22 LTS ===' ",
      
      "# Clean apt cache to avoid mirror issues",
      "sudo rm -rf /var/lib/apt/lists/*",
      "sudo apt-get clean",
      
      "# Install NodeSource GPG key and repository",
      "sudo mkdir -p /etc/apt/keyrings",
      "curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg",
      "echo 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main' | sudo tee /etc/apt/sources.list.d/nodesource.list",
      
      "# Update and install Node.js from NodeSource",
      "sudo apt-get update",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs",
      
      "# Verify correct version installed",
      "NODE_VERSION=$(node --version)",
      "echo \"Node.js version: $NODE_VERSION\"",
      "if ! echo \"$NODE_VERSION\" | grep -q '^v22'; then",
      "  echo 'ERROR: Node.js 22 was not installed correctly!'",
      "  exit 1",
      "fi",
      
      "npm --version"
    ]
  }

  # Install pnpm
  provisioner "shell" {
    inline = [
      "echo '=== Installing pnpm ===' ",
      "sudo npm install -g pnpm@10",
      "pnpm --version"
    ]
  }

  # Install PM2 for process management
  provisioner "shell" {
    inline = [
      "echo '=== Installing PM2 ===' ",
      "sudo npm install -g pm2",
      "pm2 --version"
    ]
  }

  # Install AWS CLI v2 (AWS only, but doesn't hurt to have on local)
  provisioner "shell" {
    inline = [
      "echo '=== Installing AWS CLI v2 ===' ",
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
      "echo '=== Cloning F2F Directus ===' ",
      "sudo mkdir -p /opt/directus",
      "sudo chown $(whoami):$(whoami) /opt/directus",
      "git clone --depth 1 --branch $DIRECTUS_BRANCH $DIRECTUS_REPO /opt/directus",

      "echo '=== Installing dependencies ===' ",
      "cd /opt/directus",
      "pnpm install",

      "echo '=== Building Directus ===' ",
      "pnpm build",

      "echo '=== Creating directories ===' ",
      "mkdir -p /opt/directus/uploads",
      "mkdir -p /opt/directus/extensions",
      "mkdir -p /opt/directus/logs",
      "sudo mkdir -p /etc/directus",

      "echo '=== Creating default .env template ===' ",
      "cat > /opt/directus/.env.example << 'ENVFILE'",
      "# Directus Configuration",
      "HOST=0.0.0.0",
      "PORT=8055",
      "PUBLIC_URL=http://localhost:8055",
      "",
      "# Database (change for production)",
      "DB_CLIENT=sqlite3",
      "DB_FILENAME=/opt/directus/database.sqlite",
      "",
      "# Security (generate new values for production!)",
      "SECRET=change-me-to-a-random-string",
      "KEY=change-me-to-another-random-string",
      "",
      "# Admin Account",
      "ADMIN_EMAIL=admin@example.com",
      "ADMIN_PASSWORD=change-me",
      "",
      "# Telemetry",
      "TELEMETRY=false",
      "ENVFILE"
    ]
  }

  # Install Template API from GitHub repository
  provisioner "shell" {
    inline = [
      "echo '=== Installing Directus Template API ===' ",
      "sudo mkdir -p /opt/template-api",
      "sudo chown $(whoami):$(whoami) /opt/template-api",
      "cd /opt/template-api",
      
      "# Initialize package.json",
      "pnpm init",
      
      "# Install directly from GitHub repo (avoids GitHub Packages auth issues)",
      "# Using the specific tag/version from the repo",
      "pnpm add github:Face-to-Face-IT/directus-template-api#v0.7.4-ftf.1",
      
      "# Create logs directory",
      "mkdir -p /opt/template-api/logs",
      
      "# Create symlink to bin for easier access",
      "ln -sf /opt/template-api/node_modules/directus-template-cli/bin /opt/template-api/bin",
      
      "echo '  Template API installed at /opt/template-api'"
    ]
  }

  # NOTE: Directus Template is now cloned at boot time (configure-tenant.sh)
  # with a specific version tag. This allows versioned template deployments.
  # The TEMPLATE_VERSION and GITHUB_TOKEN are passed via user-data.

  # Install Nginx
  provisioner "shell" {
    inline = [
      "echo '=== Installing Nginx ===' ",
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
      "echo '=== Installing Certbot ===' ",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx"
    ]
  }

  # Install CloudWatch Agent (AWS only, skipped on local)
  provisioner "shell" {
    only = ["amazon-ebs.directus-base"]
    inline = [
      "echo '=== Installing CloudWatch Agent ===' ",
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
    source      = "${path.root}/files/ecosystem.config.cjs.template"
    destination = "/tmp/ecosystem.config.cjs.template"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/ecosystem.config.cjs.template /opt/directus/"
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

  # Upload local configuration script (QEMU/KVM)
  provisioner "file" {
    only        = ["qemu.directus-local"]
    source      = "${path.root}/files/configure-local.sh"
    destination = "/tmp/configure-local.sh"
  }

  provisioner "shell" {
    only = ["qemu.directus-local"]
    inline = [
      "sudo mv /tmp/configure-local.sh /usr/local/bin/configure-local.sh",
      "sudo chmod +x /usr/local/bin/configure-local.sh"
    ]
  }

  # Create systemd service for PM2
  provisioner "shell" {
    inline = [
      "echo '=== Setting up PM2 startup ===' ",
      "sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME || true",
      "sudo systemctl enable pm2-$(whoami) || true"
    ]
  }

  # =============================================================================
  # Validate Directus and Template API start correctly
  # =============================================================================
  provisioner "shell" {
    inline = [
      "echo '=== Validating Directus starts correctly ===' ",
      "cd /opt/directus",
      
      "# Create temporary .env for validation",
      "cat > /opt/directus/.env << 'TESTENV'",
      "HOST=0.0.0.0",
      "PORT=8055",
      "PUBLIC_URL=http://localhost:8055",
      "DB_CLIENT=sqlite3",
      "DB_FILENAME=/opt/directus/test-validation.sqlite",
      "SECRET=test-secret-for-validation-only",
      "KEY=test-key-for-validation-only",
      "ADMIN_EMAIL=test@example.com",
      "ADMIN_PASSWORD=testpassword123",
      "TELEMETRY=false",
      "TESTENV",
      
      "# Bootstrap the database (creates tables)",
      "echo 'Bootstrapping Directus database...'",
      "node ./directus/cli.js bootstrap",
      
      "# Start Directus with PM2",
      "echo 'Starting Directus for validation...'",
      "pm2 start 'node ./directus/cli.js start' --name directus-test",
      
      "# Start Template API with PM2",
      "echo 'Starting Template API for validation...'",
      "cd /opt/template-api",
      "PORT=3000 pm2 start bin/api-server.js --name template-api-test",
      
      "# Wait for Directus health check with timeout",
      "echo 'Waiting for Directus to be healthy...'",
      "TIMEOUT=120",
      "ELAPSED=0",
      "while [ $ELAPSED -lt $TIMEOUT ]; do",
      "  if curl -sf http://localhost:8055/server/health > /dev/null 2>&1; then",
      "    echo '✓ Directus health check passed!'",
      "    curl -s http://localhost:8055/server/health | head -c 200",
      "    echo ''",
      "    break",
      "  fi",
      "  sleep 5",
      "  ELAPSED=$((ELAPSED + 5))",
      "  echo \"  Waiting... ($ELAPSED/$TIMEOUT seconds)\"",
      "done",
      
      "# Check if Directus timed out",
      "if [ $ELAPSED -ge $TIMEOUT ]; then",
      "  echo '✗ ERROR: Directus health check failed!'",
      "  pm2 logs --nostream --lines 100 || true",
      "  exit 1",
      "fi",
      
      "# Wait for Template API health check",
      "echo 'Waiting for Template API to be healthy...'",
      "TIMEOUT=60",
      "ELAPSED=0",
      "while [ $ELAPSED -lt $TIMEOUT ]; do",
      "  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then",
      "    echo '✓ Template API health check passed!'",
      "    curl -s http://localhost:3000/health | head -c 200",
      "    echo ''",
      "    break",
      "  fi",
      "  sleep 5",
      "  ELAPSED=$((ELAPSED + 5))",
      "  echo \"  Waiting... ($ELAPSED/$TIMEOUT seconds)\"",
      "done",
      
      "# Check if Template API timed out",
      "if [ $ELAPSED -ge $TIMEOUT ]; then",
      "  echo '✗ ERROR: Template API health check failed!'",
      "  pm2 logs template-api-test --nostream --lines 50 || true",
      "  exit 1",
      "fi",
      
      "# Stop all services and clean up",
      "echo 'Stopping services and cleaning up validation files...'",
      "pm2 delete all || true",
      "rm -f /opt/directus/.env",
      "rm -f /opt/directus/test-validation.sqlite",
      
      "echo '=== Validation complete! Both Directus and Template API start successfully ===' "
    ]
  }

  # Security hardening
  provisioner "shell" {
    inline = [
      "echo '=== Security hardening ===' ",
      
      "# Lock the ubuntu password - SSH keys only",
      "sudo passwd -l ubuntu",
      "echo 'Password authentication disabled for ubuntu user'",
      
      "# Ensure SSH password auth is disabled",
      "sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config",
      "sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config"
    ]
  }

  # Clean up
  provisioner "shell" {
    inline = [
      "echo '=== Cleaning up ===' ",
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
      "rm -f ~/.bash_history || true",
      
      "# Clear SSH host keys (regenerated on first boot)",
      "sudo rm -f /etc/ssh/ssh_host_*"
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
