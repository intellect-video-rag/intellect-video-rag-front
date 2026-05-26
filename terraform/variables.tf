variable "keycloak_url" {
  type        = string
  description = "The base URL of the Keycloak instance"
  default     = "http://localhost:8080"
}

variable "keycloak_user" {
  type        = string
  description = "The admin username for Keycloak"
  default     = "admin"
}

variable "keycloak_password" {
  type        = string
  description = "The admin password for Keycloak"
  default     = "admin"
  sensitive   = true
}

variable "realm_name" {
  type        = string
  description = "The name of the realm to be created"
  default     = "scribeai"
}

variable "client_id" {
  type        = string
  description = "The client ID for the Angular application"
  default     = "scribeai-frontend"
}
