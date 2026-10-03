# Static site bucket. The name must match the domain: Cloudflare (DNS + HTTPS)
# proxies sports-macros.benvinnick.com to the S3 website endpoint, and S3 picks
# the bucket from the Host header. This bucket pre-dates Terraform and was
# imported, so it's protected from being destroyed.

locals {
  site_domain = "sports-macros.benvinnick.com"
}

import {
  to = aws_s3_bucket.site
  id = local.site_domain
}

resource "aws_s3_bucket" "site" {
  bucket = local.site_domain

  lifecycle {
    prevent_destroy = true
  }
}

import {
  to = aws_s3_bucket_website_configuration.site
  id = local.site_domain
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "index.html"
  }
}

import {
  to = aws_s3_bucket_public_access_block.site
  id = local.site_domain
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

import {
  to = aws_s3_bucket_ownership_controls.site
  id = local.site_domain
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

import {
  to = aws_s3_bucket_server_side_encryption_configuration.site
  id = local.site_domain
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = false
  }
}

import {
  to = aws_s3_bucket_policy.site
  id = local.site_domain
}

data "aws_iam_policy_document" "site_public_read" {
  statement {
    sid       = "PublicReadGetObject"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::${local.site_domain}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket     = aws_s3_bucket.site.id
  policy     = data.aws_iam_policy_document.site_public_read.json
  depends_on = [aws_s3_bucket_public_access_block.site]
}

# --- Site files ------------------------------------------------------------
# Uploads the Vite build. Run `npm run build` first (or just `npm run deploy`).
# Files that disappear from dist/ (old hashed bundles) are deleted from the bucket.

locals {
  dist_dir   = "${path.module}/../dist"
  dist_files = fileset(local.dist_dir, "**")

  content_types = {
    html = "text/html"
    js   = "text/javascript"
    css  = "text/css"
    json = "application/json"
    svg  = "image/svg+xml"
    png  = "image/png"
    jpg  = "image/jpeg"
    ico  = "image/x-icon"
    txt  = "text/plain"
    map  = "application/json"
  }
}

# Guard: an empty/missing dist/ would otherwise plan to delete the whole site.
resource "terraform_data" "dist_built" {
  lifecycle {
    precondition {
      condition     = fileexists("${local.dist_dir}/index.html")
      error_message = "dist/index.html not found. Run `npm run build` first (or use `npm run deploy`)."
    }
  }
}

resource "aws_s3_object" "site" {
  for_each = local.dist_files

  bucket       = aws_s3_bucket.site.id
  key          = each.value
  source       = "${local.dist_dir}/${each.value}"
  etag         = filemd5("${local.dist_dir}/${each.value}")
  content_type = lookup(local.content_types, reverse(split(".", each.value))[0], "application/octet-stream")

  # Hashed assets never change, so cache them forever; index.html must always be fresh.
  cache_control = startswith(each.value, "assets/") ? "public, max-age=31536000, immutable" : "no-cache"

  depends_on = [terraform_data.dist_built]
}
