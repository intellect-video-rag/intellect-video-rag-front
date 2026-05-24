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

*(Note: Docker Compose setup documentation coming soon)*

```text
git clone [https://github.com/YOUR_USERNAME/scribe-ai-pipeline.git](https://github.com/YOUR_USERNAME/scribe-ai-pipeline.git)
cd scribe-ai-pipeline



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

