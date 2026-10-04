# One lambda per route. Each lambdas/<file>.mjs is zipped as index.mjs.
locals {
  functions = {
    teams  = { file = "teams.mjs", route = "GET /teams" }
    roster = { file = "roster.mjs", route = "GET /roster" }
    coach  = { file = "coach.mjs", route = "GET /coach", timeout = 10 }
  }
}

# --- Lambda --------------------------------------------------------------

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "fn" {
  for_each    = local.functions
  type        = "zip"
  output_path = "${path.module}/.build/${each.key}.zip"

  source {
    content  = file("${path.module}/../lambdas/${each.value.file}")
    filename = "index.mjs"
  }
}

resource "aws_cloudwatch_log_group" "fn" {
  for_each          = local.functions
  name              = "/aws/lambda/${var.name}-${each.key}"
  retention_in_days = 14
}

resource "aws_lambda_function" "fn" {
  for_each         = local.functions
  function_name    = "${var.name}-${each.key}"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.fn[each.key].output_path
  source_code_hash = data.archive_file.fn[each.key].output_base64sha256
  memory_size      = 256
  timeout          = lookup(each.value, "timeout", 5)

  # Hard cap on simultaneous runs per function, independent of API Gateway throttling.
  reserved_concurrent_executions = var.lambda_max_concurrency

  depends_on = [aws_cloudwatch_log_group.fn, aws_iam_role_policy_attachment.lambda_logs]
}

# --- API Gateway (HTTP API) ----------------------------------------------

resource "aws_apigatewayv2_api" "api" {
  name          = var.name
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET"]
    allow_headers = ["content-type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  # Keep a public, unauthenticated API from running up a bill. A page load makes
  # ~3 requests, so this is plenty for real users.
  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 3
  }
}

resource "aws_apigatewayv2_integration" "fn" {
  for_each               = local.functions
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fn[each.key].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "fn" {
  for_each  = local.functions
  api_id    = aws_apigatewayv2_api.api.id
  route_key = each.value.route
  target    = "integrations/${aws_apigatewayv2_integration.fn[each.key].id}"
}

resource "aws_lambda_permission" "api" {
  for_each      = local.functions
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# --- Billing alert ---------------------------------------------------------
# Account-wide: emails when actual spend passes 80% of the budget, or when AWS
# forecasts the month will go over it. Alerts only; nothing is shut off.

resource "aws_budgets_budget" "monthly" {
  name         = "${var.name}-monthly"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
