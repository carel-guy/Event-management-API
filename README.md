Event Management API
====================

API de gestion d'événements multi-tenant construite avec NestJS. Le service expose des endpoints REST documentés par Swagger et un serveur gRPC (proto `src/proto/event.proto`) pour les intégrations entre microservices. La configuration privilégie HashiCorp Vault avec un repli sur les variables d'environnement locales.

Principaux outils et services
-----------------------------
- NestJS 11 (TypeScript) avec pipes de validation globaux et Swagger pour la doc.
- MongoDB + Mongoose pour la persistance multi-tenant.
- Redis + Bull pour la file d'attente (envoi d'e-mails, tâches asynchrones).
- Keycloak (`nest-keycloak-connect` + admin client) pour l'authentification et la gestion des rôles.
- HashiCorp Vault pour charger la configuration sensible.
- MinIO pour le stockage des fichiers (assets d'événement, profils).
- gRPC (`@grpc/grpc-js`) pour l'exposition des configurations d'événement à d'autres services.
- Nodemailer + MJML pour les e-mails transactionnels.
- Swagger UI disponible sur `/api`.

Fonctionnalités métiers
-----------------------
- Gestion des événements (création, filtrage, mise à jour) avec rôles et contexte locataire.
- Modules dédiés : assets, programmes/schedules, tarification (`tariff-rule`), champs personnalisés, documents requis, partenaires, speakers, actualités.
- Stockage objet via MinIO avec génération d’URL signées et gestion des pièces jointes e-mail.
- Intercepteur multi-tenant qui rattache le contexte utilisateur (ou un utilisateur fictif en dev via les en-têtes `x-temp-tenant-id` et `x-temp-user-id`).
- Service e-mail asynchrone piloté par Bull/Redis et templates MJML.
- Exposition gRPC du contexte utilisateur et des configurations événementielles.

Prérequis
---------
- Node.js 18+ et npm.
- MongoDB accessible.
- Redis pour Bull.
- MinIO (ou S3 compatible).
- Keycloak configuré (realm + client bearer-only).
- HashiCorp Vault (sinon fichier `.env` local).

Installation
------------
```
npm install
```

Démarrage
---------
```
# Mode développement (REST + gRPC)
npm run start:dev

# Production (compilation puis exécution)
npm run build && npm run start:prod
```
Swagger : `http://APP_HOST:APP_PORT/api`  
gRPC : `EVENT_SERVICE_URL` (voir `src/proto/event.proto`).

Tests et qualité
----------------
```
npm run test       # unitaires
npm run test:e2e   # end-to-end
npm run test:cov   # couverture
npm run lint       # ESLint
npm run format     # Prettier
```

Notes d’utilisation
-------------------
- Fournir le contexte locataire/authentification via Keycloak ; en développement, les en-têtes `x-temp-tenant-id` et `x-temp-user-id` activent un contexte fictif.
- Les fichiers sont envoyés à MinIO et référencés via `file-reference`; des URL pré-signées peuvent être générées.
- Les e-mails utilisent Gmail SMTP ; adapter le fournisseur si nécessaire.

