# terraform/main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}


provider "aws" {
  region  = "us-east-1"
}


resource "aws_security_group" "web_sg" {
  name        = "photodrop_sg"
  description = "Allow HTTP and SSH traffic"

  # Allow SSH (so we can log in to fix things)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP (so the world can see the website)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Allow traffic to our backend API port
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic (so the server can download updates)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_instance" "app_server" {
  ami           = "ami-080e1f13689e07408" 
  
  instance_type = "t3.micro"
  
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  tags = {
    Name = "PhotoDrop-Production"
  }
  
  user_data = <<-EOF
              #!/bin/bash
              
              # 1. Install Docker & Docker Compose
              sudo apt-get update
              sudo apt-get install -y docker.io
              sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              sudo chmod +x /usr/local/bin/docker-compose
              
              # 2. Create a project directory
              mkdir -p /home/ubuntu/photodrop
              cd /home/ubuntu/photodrop

              # 3. Create docker-compose.yml
              # We write the file directly to the server using 'cat'
              cat <<EOT > docker-compose.yml
              version: '3.8'
              services:
                backend:
                  image: spacebreak/photodrop-backend:latest
                  ports:
                    - "3001:3001"
                  restart: always
                  command: node dist/index.js

                frontend:
                  image: spacebreak/photodrop-frontend:latest
                  ports:
                    - "80:80"
                  restart: always
                  depends_on:
                    - backend
              EOT

              # 4. Start the application
              # The -d flag runs it in the background
              sudo docker-compose up -d
              EOF
}

output "public_ip" {
  value = aws_instance.app_server.public_ip
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "photos" {
  bucket = "photodrop-files-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_cors_configuration" "photos_cors" {
  bucket = aws_s3_bucket.photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["*"] # In production, change this to your Netlify URL
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "photos_public" {
  bucket = aws_s3_bucket.photos.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.photos.id
  depends_on = [aws_s3_bucket_public_access_block.photos_public]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.photos.arn}/*"
      },
    ]
  })
}

output "s3_bucket_name" {
  value = aws_s3_bucket.photos.id
}