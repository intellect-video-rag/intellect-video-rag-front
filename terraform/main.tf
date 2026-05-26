terraform {
  required_providers {
    keycloak = {
      source  = "mrparkers/keycloak"
      version = ">= 4.4.0"
    }
  }
}

provider "keycloak" {
  client_id = "admin-cli"
  username  = var.keycloak_user
  password  = var.keycloak_password
  url       = var.keycloak_url
}

resource "keycloak_realm" "realm" {
  realm             = var.realm_name
  enabled           = true
  display_name      = "ScribeAI Realm"
  display_name_html = "<b>ScribeAI</b> Realm"

  # In development, disable strict SSL requirements (allow HTTP)
  ssl_required = "none"
}

resource "keycloak_openid_client" "angular_client" {
  realm_id  = keycloak_realm.realm.id
  client_id = var.client_id
  name      = "ScribeAI Frontend Application"
  enabled   = true

  # PUBLIC access type disables Client Authentication (no Client Secret needed)
  access_type = "PUBLIC"

  # Enable standard OAuth2 Authorization Code Flow
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false

  # Enforce PKCE (Proof Key for Code Exchange)
  pkce_code_challenge_method = "S256"

  # Local URLs for client redirection and origin access
  root_url = "http://localhost:4200"
  valid_redirect_uris = [
    "http://localhost:4200/*"
  ]
  web_origins = [
    "http://localhost:4200"
  ]

  base_url = "/"
}
