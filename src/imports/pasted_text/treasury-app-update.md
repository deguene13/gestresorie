Je souhaite mettre à jour mon application Gestion de la Trésorerie déjà existante. Les modifications doivent être intégrées sans modifier le design actuel, en conservant la même charte graphique, les mêmes composants, la même navigation et les mêmes interactions.

Toutes les modifications doivent être cohérentes avec les autres modules de l'application et être entièrement connectées entre elles.

1. Module Livraisons (Achats et Ventes)
Bon de Livraison (BL)

Dans Nouveau Bon de Livraison, ajouter les champs suivants :

Articles
Quantité par article

Les articles doivent provenir automatiquement du Bon de Commande associé.

Le Bon de Livraison doit permettre d'ajouter plusieurs lignes d'articles.

Génération automatique des factures

Lorsqu'un Bon de Livraison est entièrement validé (statut Exécuté ou Livraison terminée) :

générer automatiquement la facture correspondante (achat ou vente) ;
empêcher toute création manuelle d'une facture liée à ce BL.

Les factures générées automatiquement doivent contenir :

Numéro de facture
Fournisseur ou Client
Bon de Commande associé
Bon de Livraison associé
Montant TTC
Date de facture
Date d'échéance
Statut
Actions
Gestion visuelle des échéances

Afficher automatiquement une couleur selon la date d'échéance :

🟢 Vert

facture payée

🟠 Orange

échéance proche

🔴 Rouge

échéance dépassée
2. Module Paiements (Achats et Ventes)

Créer un suivi complet des étapes de paiement.

Chaque paiement doit afficher son état :

Demande créée
En attente de validation
Validée
Paiement exécuté
Paiement terminé

Ajouter une frise chronologique ou un indicateur d'avancement.

Création d'une demande de paiement

Remplacer le champ :

Mode de paiement

par

Moyen de paiement

Les moyens disponibles sont :

Chèque

Afficher automatiquement :

Numéro du chèque
Virement bancaire

Afficher automatiquement :

Numéro d'ordre de virement
Traite

Afficher automatiquement :

Numéro de traite
Ordre de transfert

Afficher automatiquement :

Numéro d'ordre de transfert

Chaque champ doit devenir obligatoire lorsque le moyen correspondant est sélectionné.

3. Module Trésorerie Journalière

Dans la page

Point de Situation — Pilotage en Temps Réel

Ajouter en haut de la page une liste déroulante :

Banque / Caisse

Cette liste doit permettre :

sélectionner une banque existante
sélectionner une caisse existante
ajouter une nouvelle banque
ajouter une nouvelle caisse
modifier une banque
supprimer une banque
modifier une caisse
supprimer une caisse

Lorsque l'utilisateur sélectionne une banque ou une caisse, afficher immédiatement :

Solde d'ouverture
Encaissements
Décaissements
Solde actuel
Solde prévisionnel
Historique des mouvements
Prévisions de trésorerie
Graphiques associés

Toutes les données doivent être filtrées selon la banque ou la caisse sélectionnée.

4. Nouveau module : Trésorerie Globale

Créer un nouvel onglet dans le menu principal nommé :

Trésorerie Globale

Ce module doit regrouper l'ensemble des comptes bancaires et des caisses.

Il doit contenir :

Consultation de la trésorerie globale

Afficher :

Solde global
Total Banques
Total Caisses
Encaissements
Décaissements
Solde disponible
États financiers consolidés

Afficher :

Situation financière consolidée
Totaux par banque
Totaux par caisse
Totaux par société (si plusieurs sociétés)
Soldes par période

Permettre de consulter :

Aujourd'hui
Cette semaine
Ce mois
Ce trimestre
Cette année
Période personnalisée

Afficher également :

graphiques
tableaux
export Excel
export PDF
5. Notifications et alertes par email

Créer un système automatique d'alertes.

Envoyer un email lorsqu'un événement survient.

Les alertes concernent :

échéance de paiement proche
paiement en retard
livraison en retard
opération en attente de validation
délai de traitement dépassé
commande incomplète
facture non réglée
trésorerie insuffisante
nouveau Bon de Commande
nouvelle facture
validation demandée

Ajouter un centre de notifications dans l'application.

Afficher les notifications en temps réel.

6. Authentification et gestion des utilisateurs

Corriger le système d'authentification.

Actuellement seul l'administrateur peut se connecter.

Je souhaite que tous les profils puissent se connecter selon leurs droits :

Administrateur
Comptable
Gestionnaire des achats
Directeur Général

Chaque utilisateur doit :

pouvoir se connecter avec son identifiant et son mot de passe ;
accéder uniquement aux modules autorisés par son rôle ;
voir uniquement les actions autorisées ;
disposer d'un tableau de bord personnalisé selon son profil.

Mettre en place un système complet de gestion des rôles et des permissions (RBAC), afin que les autorisations soient appliquées de manière cohérente dans toute l'application.

Exigences générales
Conserver le design actuel de l'application.
Conserver la même charte graphique, les mêmes couleurs, les mêmes composants et la même navigation.
Toutes les nouvelles fonctionnalités doivent être entièrement intégrées aux modules existants (Devis, Bons de commande, Livraisons, Factures, Paiements, Encaissements, Décaissements, Documents et Trésorerie Journalière).
Les données doivent être synchronisées entre les modules : une action réalisée dans un module doit mettre automatiquement à jour les informations des autres modules concernés.
Générer une interface responsive (ordinateur, tablette et mobile) avec une logique fonctionnelle prête à être développée en React et connectée à l'API Django existante.