# intellect-video-rag-front
Production-ready asynchronous video transcription platform featuring FIPS-compliant Keycloak IAM, NoSQL analytics, and AI-powered semantic search.
# ScribeAI: Event-Driven Transcription Pipeline & Semantic Search (RAG)

ScribeAI is an enterprise-grade, asynchronous video and audio transcription platform designed for high availability, security, and scalability. The system features a secure, multi-tenant architecture that ingests heavy media files, processes them through distributed AI workers, and enables advanced semantic search over the generated transcripts using Retrieval-Augmented Generation (RAG).

---

## 🏛️ High-Level Architecture Overview

The platform is designed following a **Microservices and Event-Driven Architecture** to decouple heavy CPU/GPU processing from the main business logic:

1. **Identity & Access Management (IAM):** Fully secured via **Keycloak SSO** (configured for FIPS compliance, HA deployments, and federated environments).
2. **Frontend UI:** Responsive, minimalist SaaS dashboard built with **Angular** and **DaisyUI/Tailwind CSS** using real-time reactive states.
3. **Core Orchestrator:** A robust **Spring Boot** API managing business logic, users, ingestion queues, and data persistence.
4. **Asynchronous Ingestion Worker:** Spring Boot workers handle chunking and heavy file processing asynchronously before delegating storage.
5. **Storage Layer:** High-performance storage managed locally via **MinIO** (S3-compatible API) for media objects and **PostgreSQL** for relational business states.
6. **Message Broker:** **Apache Kafka** orchestrates the transcription events, ensuring resilience, fault tolerance, and loose coupling.
7. **AI Processing Engine:** Distributed **FastAPI** pods scale horizontally in **Kubernetes** to process Whisper models (supporting both localized `faster-whisper` and OpenAI API endpoints).
8. **NoSQL Persistence:** Transcripts are stored as rich document payloads (including timestamps and diarization metadata) inside **MongoDB**.
9. **Semantic Search (RAG):** Full-text and vector-based conceptual search powered by embedding chunking models integrated with **Elasticsearch (ELK)** and OpenAI's synthesis layer.

---

## 🛠️ Tech Stack & Ecosystem

- **Frontend:** Angular | Tailwind CSS | DaisyUI
- **Backend Frameworks:** Java (Spring Boot) | Python (FastAPI)
- **Event Streaming & DevOps:** Apache Kafka | Docker | Kubernetes (OKD/K8s) | Helm Charts
- **Databases & Storage:** PostgreSQL | MongoDB | Elasticsearch (Vector DB) | MinIO (AWS S3 API)
- **Security:** Keycloak (OIDC / OAuth2 / FIPS Compliant)
- **AI/ML:** OpenAI API | Whisper Open Source (`faster-whisper`)

---

## 🚀 Key Architectural Highlights (Interview Topics)

- **FIPS-Compliant Security:** Deep implementation of enterprise Keycloak, handling token verification, secure scopes, and external LDAP federation.
- **Resilient Event-Driven Scaling:** Kafka consumers handle backpressure gracefully. FastAPI instances auto-scale horizontally based on queue lag metrics.
- **Polglot Persistence Strategy:** Using ACID relational storage for business boundaries, NoSQL Document storage for metadata-heavy transcripts, and Vector-based indexes for semantic AI capabilities.
- **RAG Implementation:** Bypassing traditional keyword-matching limitations by embedding transcript chunks into Elasticsearch to run Cosine Similarity queries for intelligent semantic responses.

---

## 🔧 Getting Started (Local Development)

To run the application locally, follow these steps to spin up the Keycloak IAM infrastructure, configure it, and run the Angular frontend.

### 📋 Prerequisites
- **Docker** and **Docker Compose**
- **Node.js** (v20+ recommended) and **npm**
- **Terraform** (optional, for automated Keycloak configuration)

---

### Step 1: Start the Identity & Database Infrastructure
Spin up the local PostgreSQL database, clustered Keycloak instances, and the Nginx load balancer:
```bash
docker compose up -d
```

#### 🔍 Verifying the Setup
You can check if the services started correctly by looking at the logs. They should show that:
1. `keycloak-db` is ready to accept connections.
2. `keycloak-1` and `keycloak-2` started successfully and joined the Infinispan cluster.
3. `keycloak-lb` (Nginx load balancer) is listening on port `8080`.

---

### Step 2: Access & Configure Keycloak IAM
The load balancer exposes Keycloak on port `8080`.

- **Admin UI Console**: [http://localhost:8080/admin/](http://localhost:8080/admin/) (or simply [http://localhost:8080](http://localhost:8080))
- **Default Credentials**:
  - **Username**: `admin`
  - **Password**: `admin`

Choose **one** of the options below to configure the `scribeai` realm and `scribeai-frontend` client:

#### Option A: Automated Configuration via Terraform (Recommended)
We provide a Terraform configuration to automatically set up the realm and client:
```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

#### Option B: Manual Configuration via Admin UI
If you prefer configuring it manually:
1. Log in to the Keycloak Admin Console.
2. In the top-left dropdown, click **Create Realm**. Enter `scribeai` as the realm name and click **Create**.
3. Go to the **Clients** section and click **Create client**.
   - **Client type**: `OpenID Connect`
   - **Client ID**: `scribeai-frontend`
   - Click **Next**.
4. In **Capability config**:
   - Ensure **Client authentication** is turned **Off** (Public client).
   - Ensure **Standard flow** (Authorization Code Flow) is **Checked**.
   - Click **Next**.
5. In **Login settings**:
   - **Root URL**: `http://localhost:4200`
   - **Valid redirect URIs**: `http://localhost:4200/*`
   - **Web origins**: `http://localhost:4200`
   - Click **Save**.
6. Create a test user:
   - Go to **Users** -> **Add user**. Enter a username (e.g., `testuser`) and save.
   - Go to the **Credentials** tab of the user, click **Set password**, enter a password, turn **Temporary** **Off**, and click **Save**.

---

### Step 3: Run the Angular Application
Once Keycloak is configured, you can run the Angular development server:

```bash
# Navigate to the frontend directory
cd frontend-web

# Install dependencies
npm install

# Start the local development server
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

- To test the Keycloak login integration, click the **Login** button. You will be redirected to the Keycloak login screen at `http://localhost:8080`.
- Enter the credentials of the user you created to log in. You will be redirected back to the Angular app and see your username displayed!


---

## 🧱 Implementación en Angular: El Auth Interceptor

Ahora que el repositorio tiene identidad, arranquemos con el código del Front. Para conectar tu UI con Keycloak de forma limpia, necesitamos un **HttpInterceptor**. Este componente intercepta automáticamente cualquier llamada `HTTP` saliente que vaya a tu Backend y le inyecta la cabecera `Authorization: Bearer <JWT_TOKEN>`.

Asumiendo que estás usando **Angular 15+ o 17/19 con enfoque funcional** (que es el estándar moderno que piden afuera), este es el código que debés crear:

### 1. El código del Interceptor (`auth.interceptor.ts`)

```typescript
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
// Asumiendo que usas la librería oficial keycloak-angular o un servicio propio
import { KeycloakService } from 'keycloak-angular'; 

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  const keycloakService = inject(KeycloakService);

  // Excluir llamadas a archivos públicos o endpoints de login si fuera necesario
  if (req.url.includes('/assets/') || req.url.includes('/public/')) {
    return next(req);
  }

  // Convertimos la Promesa de Keycloak que obtiene el token en un Observable de RxJS
  return from(keycloakService.getToken()).pipe(
    switchMap((token: string) => {
      if (token) {
        // Clonamos la petición original e inyectamos el JWT de Keycloak en las cabeceras
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        return next(clonedRequest);
      }
      
      // Si por alguna razón no hay token, continúa con la petición original
      return next(req);
    })
  );
};

