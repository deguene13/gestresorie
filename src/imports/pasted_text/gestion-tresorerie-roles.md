Pour l’application Gestion de la Trésorerie, qui couvre les processus Achats (Décaissements) et Ventes (Encaissements), voici une répartition des rôles 

1. Administrateur (Admin)
           Mission : Administrer l'application et gérer les utilisateurs.
         Responsabilités
•	Créer, modifier, suspendre et supprimer les comptes utilisateurs. 
•	Attribuer les rôles et les permissions. 
•	Configurer les paramètres généraux de l'application. 
•	Gérer les référentiels (articles, catégories, modes de paiement, etc.). 
•	Consulter tous les modules. 
•	Consulter les journaux d'activité (audit). 
•	Exporter les données et les rapports. 
Accès
•	Accès complet (lecture, création, modification, suppression). 
________________________________________
2. Gestionnaire d'achat
Mission : Gérer le cycle des achats fournisseurs.
Responsabilités
•	Créer les demandes d'achat. 
•	Créer les devis d'achat. 
•	Créer les Bons de Commande (BDC). 
•	Modifier les BDC avant validation. 
•	Envoyer les BDC au fournisseur. 
•	Enregistrer les Bordereaux de Livraison (BL). 
•	Vérifier la conformité des livraisons. 
•	Consulter les factures fournisseurs. 
•	Suivre l'état des commandes. 
Ne peut pas
•	Valider les paiements. 
•	Modifier la trésorerie. 
•	Gérer les utilisateurs. 
________________________________________
3. Fournisseur
Mission : Répondre aux commandes reçues.
Responsabilités
•	Consulter les Bons de Commande reçus. 
•	Accepter ou refuser une commande. 
•	Préparer les articles commandés. 
•	Enregistrer le Bordereau de Livraison. 
•	Déposer ou transmettre la facture fournisseur. 
•	Consulter l'état de ses paiements. 
•	Consulter l'historique de ses commandes. 
Accès limité
Uniquement à ses propres informations.
________________________________________
4. Client
Mission : Consulter les documents liés à ses achats auprès de votre entreprise.
Responsabilités
•	Demander un devis. 
•	Consulter les devis. 
•	Accepter ou refuser un devis. 
•	Consulter ses Bons de Commande. 
•	Consulter les livraisons. 
•	Télécharger ses factures. 
•	Consulter ses paiements. 
•	Consulter l'historique de ses commandes. 
Accès limité
Uniquement à ses propres documents.
________________________________________
5. Directeur Général
Mission : Contrôler et valider les opérations.
Responsabilités
•	Valider ou rejeter les devis. 
•	Valider les Bons de Commande. 
•	Valider les Bordereaux de Livraison. 
•	Valider les factures. 
•	Autoriser les paiements. 
•	Valider les autres décaissements. 
•	Consulter les tableaux de bord. 
•	Consulter les historiques. 
Ne peut pas
•	Effectuer les paiements. 
•	Modifier la comptabilité. 
•	Gérer les utilisateurs. 
________________________________________
6. Comptable
Mission : Gérer les opérations financières.
Responsabilités
•	Enregistrer les factures fournisseurs. 
•	Enregistrer les factures clients. 
•	Exécuter les paiements fournisseurs. 
•	Enregistrer les encaissements clients. 
•	Gérer les autres encaissements. 
•	Gérer les autres décaissements. 
•	Mettre à jour la trésorerie journalière. 
•	Effectuer les rapprochements bancaires. 
•	Exporter les états financiers. 
•	Générer les rapports. 
________________________________________
Tableau des droits
Module	Admin	Gestionnaire d'achat	Fournisseur	Client	Directeur Général	Comptable
Tableau de bord	✅	✅	Consultation	Consultation	✅	✅
Utilisateurs	✅	❌	❌	❌	❌	❌
Produits	✅	✅	Consultation	Consultation	Consultation	Consultation
Fournisseurs	✅	✅	Son profil	❌	Consultation	Consultation
Clients	✅	Consultation	❌	Son profil	Consultation	Consultation
Devis	✅	Créer	Consultation	Demander / Valider	Valider	Consultation
Bons de Commande	✅	Créer	Consulter	Consulter	Valider	Consultation
Livraison Fournisseur	✅	Gérer	Créer	❌	Valider	Consultation
Livraison Client	✅	Gérer	❌	Consulter	Valider	Consultation
Factures Fournisseur	✅	Consultation	Déposer	❌	Valider	Gérer
Factures Client	✅	Consultation	❌	Consulter	Valider	Gérer
Paiements Fournisseurs	✅	Consultation	Consulter	❌	Autoriser	Exécuter
Encaissements Clients	✅	Consultation	❌	Consulter	Consultation	Gérer
Décaissements	✅	Demander	❌	❌	Valider	Gérer
Trésorerie Journalière	✅	Consultation	❌	❌	Consultation	Gérer
Rapports	✅	Consultation	❌	❌	Consultation	Exporter
Workflow du cycle d'achat (Décaissement)
Gestionnaire d'achat
        │
        ▼
Création du Bon de Commande
        │
        ▼
Directeur Général
        │
        ├── Refus → Retour au Gestionnaire
        │
        └── Validation
                │
                ▼
Fournisseur
(Accepte la commande)
                │
                ▼
Livraison (BL)
                │
                ▼
Facture fournisseur
                │
                ▼
Gestionnaire d'achat
(Vérification de la conformité)
                │
                ▼
Directeur Général
(Validation du paiement)
                │
                ▼
Comptable
(Exécution du paiement)
                │
                ▼
Trésorerie mise à jour
Workflow du cycle de vente (Encaissement)
Client
(Demande de devis)
        │
        ▼
Gestionnaire
(Création du devis)
        │
        ▼
Directeur Général
(Validation)
        │
        ▼
Client
(Accepte le devis)
        │
        ▼
Bon de Commande
        │
        ▼
Livraison Client
        │
        ▼
Facture Client
        │
        ▼
Comptable
(Enregistrement de l'encaissement)
        │
        ▼
Trésorerie mise à jour
