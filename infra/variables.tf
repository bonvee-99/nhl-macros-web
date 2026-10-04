variable "region" {
  type    = string
  default = "us-west-1"
}

variable "name" {
  description = "Prefix for all resource names."
  type        = string
  default     = "nhl-macros"
}

variable "allowed_origins" {
  description = "Origins allowed to call the API from a browser."
  type        = list(string)
  default = [
    "https://sports-macros.benvinnick.com",
    "http://sports-macros.benvinnick.com",
    "https://bonvee-nhl-macros.s3.us-west-1.amazonaws.com",
    "http://localhost:5173",
  ]
}

variable "lambda_max_concurrency" {
  description = "Reserved concurrency per Lambda (max simultaneous runs)."
  type        = number
  default     = 5
}

variable "monthly_budget_usd" {
  description = "Monthly AWS spend (account-wide) that triggers a billing alert."
  type        = string
  default     = "5"
}

variable "budget_alert_email" {
  description = "Where billing alerts go. Set in terraform.tfvars (gitignored)."
  type        = string
}
