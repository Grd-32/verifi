# RDS Configuration

resource "aws_db_subnet_group" "main" {
  name       = "kyc-vault-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "kyc-vault-db-subnet"
  }
}

resource "aws_db_instance" "main" {
  identifier            = "kyc-vault-db"
  engine               = var.db_engine
  engine_version       = var.db_engine == "postgres" ? "15.3" : "8.0"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  db_name              = "kyc_vault"
  username             = "kyc_admin"
  password             = random_password.db_password.result
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = "kyc-vault-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  multi_az               = var.environment == "prod" ? true : false
  backup_retention_period = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name = "kyc-vault-db"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "kyc-vault/db-password"
  
  tags = {
    Name = "kyc-vault-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = aws_db_instance.main.password
    host     = aws_db_instance.main.endpoint
  })
}
