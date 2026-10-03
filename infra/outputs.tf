output "api_url" {
  description = "Base URL for the frontend (VITE_API_URL)."
  value       = trimsuffix(aws_apigatewayv2_stage.default.invoke_url, "/")
}

output "site_bucket" {
  description = "Upload dist/ here: aws s3 sync dist s3://<bucket> --delete"
  value       = aws_s3_bucket.site.id
}

output "site_url" {
  value = "https://${local.site_domain}"
}
