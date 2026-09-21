import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "fr" | "en";

// ─── Translation dictionary ───────────────────────────────────────────────────

const translations = {
  // ── Common ─────────────────────────────────────────────────────────────────
  common: {
    save:       { fr: "Enregistrer",       en: "Save" },
    cancel:     { fr: "Annuler",           en: "Cancel" },
    delete:     { fr: "Supprimer",         en: "Delete" },
    edit:       { fr: "Modifier",          en: "Edit" },
    create:     { fr: "Créer",             en: "Create" },
    close:      { fr: "Fermer",            en: "Close" },
    confirm:    { fr: "Confirmer",         en: "Confirm" },
    search:     { fr: "Rechercher...",     en: "Search..." },
    filter:     { fr: "Filtrer",           en: "Filter" },
    all:        { fr: "Tous",              en: "All" },
    actions:    { fr: "Actions",           en: "Actions" },
    status:     { fr: "Statut",            en: "Status" },
    date:       { fr: "Date",              en: "Date" },
    amount:     { fr: "Montant",           en: "Amount" },
    total:      { fr: "Total",             en: "Total" },
    subtotal:   { fr: "Sous-total HT",     en: "Subtotal (excl. tax)" },
    tva:        { fr: "TVA",               en: "VAT" },
    totalttc:   { fr: "Total TTC",         en: "Total (incl. tax)" },
    quantity:   { fr: "Quantité",          en: "Quantity" },
    unitprice:  { fr: "Prix Unitaire",     en: "Unit Price" },
    designation:{ fr: "Désignation",       en: "Designation" },
    reference:  { fr: "Référence",         en: "Reference" },
    description:{ fr: "Description",       en: "Description" },
    add:        { fr: "Ajouter",           en: "Add" },
    nodata:     { fr: "Aucune donnée",     en: "No data" },
    loading:    { fr: "Chargement...",     en: "Loading..." },
    print:      { fr: "Imprimer",          en: "Print" },
    download:   { fr: "Télécharger",       en: "Download" },
    back:       { fr: "Retour",            en: "Back" },
    view:       { fr: "Voir",              en: "View" },
    preview:    { fr: "Aperçu",            en: "Preview" },
    validate:   { fr: "Valider",           en: "Validate" },
    refuse:     { fr: "Refuser",           en: "Refuse" },
    export:     { fr: "Exporter",          en: "Export" },
    import:     { fr: "Importer",          en: "Import" },
    yes:        { fr: "Oui",               en: "Yes" },
    no:         { fr: "Non",               en: "No" },
    warning:    { fr: "Attention",         en: "Warning" },
    success:    { fr: "Succès",            en: "Success" },
    error:      { fr: "Erreur",            en: "Error" },
    required:   { fr: "obligatoire",       en: "required" },
    page:       { fr: "Page",              en: "Page" },
    of:         { fr: "sur",               en: "of" },
    previous:   { fr: "Précédent",         en: "Previous" },
    next:       { fr: "Suivant",           en: "Next" },
    perpage:    { fr: "par page",          en: "per page" },
    currency:   { fr: "FCFA",             en: "FCFA" },
    noResults:  { fr: "Aucun résultat trouvé", en: "No results found" },
  },

  // ── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    dashboard:         { fr: "Tableau de bord",       en: "Dashboard" },
    achat:             { fr: "Achat",                  en: "Purchasing" },
    vente:             { fr: "Vente",                  en: "Sales" },
    purchaseOrders:    { fr: "Bons de commande",       en: "Purchase Orders" },
    supplierDeliveries:{ fr: "Livraison fournisseur",  en: "Supplier Deliveries" },
    supplierInvoices:  { fr: "Factures fournisseurs",  en: "Supplier Invoices" },
    supplierPayments:  { fr: "Paiement fournisseur",   en: "Supplier Payments" },
    quotes:            { fr: "Devis",                  en: "Quotes" },
    clientOrders:      { fr: "Bons de commande client",en: "Client Orders" },
    clientDeliveries:  { fr: "Livraison client",       en: "Client Deliveries" },
    clientInvoices:    { fr: "Factures clients",       en: "Client Invoices" },
    clientPayments:    { fr: "Paiement client",        en: "Client Payments" },
    products:          { fr: "Produits",               en: "Products" },
    users:             { fr: "Utilisateurs",           en: "Users" },
    collections:       { fr: "Autres encaissements",   en: "Other Collections" },
    disbursements:     { fr: "Autres décaissements",   en: "Other Disbursements" },
    documents:         { fr: "Liasse comptable",        en: "Accounting File" },
    dailyTreasury:     { fr: "Trésorerie journalière", en: "Daily Treasury" },
    settings:          { fr: "Paramètres",             en: "Settings" },
    logout:            { fr: "Se déconnecter",         en: "Log out" },
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
  auth: {
    loginTitle:        { fr: "DIPERFLO",                    en: "DIPERFLO" },
    loginSubtitle:     { fr: "Connectez-vous à votre compte", en: "Sign in to your account" },
    email:             { fr: "Email",                      en: "Email" },
    password:          { fr: "Mot de passe",               en: "Password" },
    rememberMe:        { fr: "Se souvenir de moi",         en: "Remember me" },
    forgotPassword:    { fr: "Mot de passe oublié ?",      en: "Forgot password?" },
    login:             { fr: "Se connecter",               en: "Sign in" },
    noAccount:         { fr: "Pas encore de compte ?",     en: "No account yet?" },
    createAccount:     { fr: "Créer un compte",            en: "Create account" },
    copyright:         { fr: "© 2026 DIPERFLO. Tous droits réservés.", en: "© 2026 DIPERFLO. All rights reserved." },
    signupTitle:       { fr: "Créer un compte",            en: "Create an account" },
    signupSubtitle:    { fr: "Commencez à gérer votre trésorerie", en: "Start managing your treasury" },
    fullName:          { fr: "Nom complet",                en: "Full name" },
    company:           { fr: "Entreprise",                 en: "Company" },
    confirmPassword:   { fr: "Confirmer le mot de passe",  en: "Confirm password" },
    signupBtn:         { fr: "Créer mon compte",           en: "Create my account" },
    hasAccount:        { fr: "Vous avez déjà un compte ?", en: "Already have an account?" },
    signIn:            { fr: "Se connecter",               en: "Sign in" },
    passwordMismatch:  { fr: "Les mots de passe ne correspondent pas", en: "Passwords do not match" },
    forgotTitle:       { fr: "Mot de passe oublié",        en: "Forgot password" },
    forgotSubtitle:    { fr: "Entrez votre email pour recevoir un lien de réinitialisation", en: "Enter your email to receive a reset link" },
    sendLink:          { fr: "Envoyer le lien",            en: "Send link" },
    backToLogin:       { fr: "Retour à la connexion",      en: "Back to login" },
    emailSent:         { fr: "Email envoyé ! Vérifiez votre boîte mail.", en: "Email sent! Check your inbox." },
    resetTitle:        { fr: "Réinitialiser le mot de passe", en: "Reset password" },
    resetSubtitle:     { fr: "Entrez votre nouveau mot de passe", en: "Enter your new password" },
    newPassword:       { fr: "Nouveau mot de passe",       en: "New password" },
    resetBtn:          { fr: "Réinitialiser",              en: "Reset password" },
  },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    title:             { fr: "Tableau de bord",            en: "Dashboard" },
    subtitle:          { fr: "Vue d'ensemble de votre trésorerie", en: "Overview of your treasury" },
    totalBalance:      { fr: "Solde Total",                en: "Total Balance" },
    monthlyRevenue:    { fr: "Revenus du mois",            en: "Monthly Revenue" },
    monthlyExpenses:   { fr: "Dépenses du mois",           en: "Monthly Expenses" },
    pendingOrders:     { fr: "Commandes en attente",       en: "Pending Orders" },
    recentActivity:    { fr: "Activité récente",           en: "Recent Activity" },
    cashflow:          { fr: "Flux de trésorerie",         en: "Cash Flow" },
    quickActions:      { fr: "Actions rapides",            en: "Quick Actions" },
  },

  // ── Purchase Orders ─────────────────────────────────────────────────────────
  purchaseOrders: {
    title:             { fr: "Bons de Commande",           en: "Purchase Orders" },
    subtitle:          { fr: "Gérez vos commandes fournisseurs", en: "Manage your supplier orders" },
    newOrder:          { fr: "Nouveau Bon de Commande",    en: "New Purchase Order" },
    supplier:          { fr: "Fournisseur",                en: "Supplier" },
    articles:          { fr: "Articles",                   en: "Articles" },
    requestedBy:       { fr: "Demandé par",                en: "Requested by" },
    requestedDate:     { fr: "Date demande",               en: "Request date" },
    pending:           { fr: "En attente",                 en: "Pending" },
    approved:          { fr: "Approuvé",                   en: "Approved" },
    rejected:          { fr: "Rejeté",                     en: "Rejected" },
    delivered:         { fr: "Livré",                      en: "Delivered" },
    addArticle:        { fr: "Ajouter un article",         en: "Add article" },
    validateOrder:     { fr: "Valider la commande",        en: "Validate order" },
    rejectOrder:       { fr: "Rejeter la commande",        en: "Reject order" },
    noOrders:          { fr: "Aucun bon de commande",      en: "No purchase orders" },
  },

  // ── Quotes ──────────────────────────────────────────────────────────────────
  quotes: {
    title:             { fr: "Gestion des Devis",          en: "Quote Management" },
    subtitle:          { fr: "Créez et gérez les devis clients", en: "Create and manage client quotes" },
    newQuote:          { fr: "Nouveau Devis",              en: "New Quote" },
    quoteNumber:       { fr: "N° Devis",                   en: "Quote #" },
    client:            { fr: "Client",                     en: "Client" },
    clientEmail:       { fr: "Email",                      en: "Email" },
    clientPhone:       { fr: "Téléphone",                  en: "Phone" },
    clientAddress:     { fr: "Adresse",                    en: "Address" },
    pending:           { fr: "En attente",                 en: "Pending" },
    validated:         { fr: "Validé",                     en: "Validated" },
    refused:           { fr: "Refusé",                     en: "Refused" },
    totalQuotes:       { fr: "Total devis",                en: "Total quotes" },
    pendingCount:      { fr: "En attente",                 en: "Pending" },
    validatedCount:    { fr: "Validés",                    en: "Validated" },
    refuseReason:      { fr: "Motif du refus",             en: "Refusal reason" },
    refuseReasonPh:    { fr: "Décrivez la raison du refus...", en: "Describe the reason for refusal..." },
    refuseRequired:    { fr: "Le motif est obligatoire.",  en: "The reason is required." },
    refuseModal:       { fr: "Refuser le devis",           en: "Refuse quote" },
    refuseDesc:        { fr: "Veuillez indiquer le motif du refus. Le workflow sera arrêté définitivement.", en: "Please state the reason for refusal. The workflow will be permanently stopped." },
    confirmRefuse:     { fr: "Confirmer le refus",         en: "Confirm refusal" },
    validateConfirm:   { fr: "Valider le devis",           en: "Validate quote" },
    validateDesc:      { fr: "Un bon de commande sera automatiquement généré dans la liste des BDC.", en: "A purchase order will be automatically generated in the PO list." },
    validateBtn:       { fr: "Valider et générer BDC",     en: "Validate and generate PO" },
    linkedPO:          { fr: "Bon de commande généré",     en: "Generated purchase order" },
    createSuccess:     { fr: "Devis créé avec succès !",   en: "Quote created successfully!" },
    updateSuccess:     { fr: "Devis modifié avec succès !", en: "Quote updated successfully!" },
    deleteSuccess:     { fr: "Devis supprimé.",            en: "Quote deleted." },
    validateSuccess:   { fr: "Devis validé. BDC généré !", en: "Quote validated. PO generated!" },
    refuseSuccess:     { fr: "Devis refusé.",              en: "Quote refused." },
    deleteConfirm:     { fr: "Supprimer ce devis définitivement ? Cette action est irréversible.", en: "Permanently delete this quote? This action cannot be undone." },
    noQuotes:          { fr: "Aucun devis",                en: "No quotes" },
    tvaRate:           { fr: "Taux TVA (%)",               en: "VAT Rate (%)" },
    addArticle:        { fr: "Ajouter un article",         en: "Add article" },
    object:            { fr: "Objet",                      en: "Subject" },
    createdDate:       { fr: "Date création",              en: "Created date" },
    validatedDate:     { fr: "Validé le",                  en: "Validated on" },
    refusedReason:     { fr: "Motif du refus",             en: "Refusal reason" },
    editQuote:         { fr: "Modifier le Devis",          en: "Edit Quote" },
    newQuoteTitle:     { fr: "Nouveau Devis",              en: "New Quote" },
  },

  // ── Supplier Deliveries ─────────────────────────────────────────────────────
  supplierDeliveries: {
    title:             { fr: "Livraisons Fournisseurs",    en: "Supplier Deliveries" },
    subtitle:          { fr: "Gestion des bons de livraison fournisseurs", en: "Manage supplier delivery notes" },
    newDelivery:       { fr: "Nouvelle Livraison",         en: "New Delivery" },
    blNumber:          { fr: "N° BL",                      en: "DN #" },
    bdcNumber:         { fr: "N° BDC",                     en: "PO #" },
    supplier:          { fr: "Fournisseur",                en: "Supplier" },
    deliveryDate:      { fr: "Date livraison",             en: "Delivery date" },
    complete:          { fr: "Complète",                   en: "Complete" },
    partial:           { fr: "Partielle",                  en: "Partial" },
    pending:           { fr: "En attente",                 en: "Pending" },
    product:           { fr: "Produit",                    en: "Product" },
    orderedQty:        { fr: "Qté commandée",              en: "Ordered qty" },
    deliveredQty:      { fr: "Qté livrée",                 en: "Delivered qty" },
    remainingQty:      { fr: "Reste à livrer",             en: "Remaining qty" },
    unit:              { fr: "Unité",                      en: "Unit" },
    attachFile:        { fr: "Joindre BL (PDF/image)",     en: "Attach DN (PDF/image)" },
    fileAttached:      { fr: "Fichier joint",              en: "File attached" },
    addProduct:        { fr: "Ajouter un produit",         en: "Add product" },
    noDeliveries:      { fr: "Aucune livraison fournisseur", en: "No supplier deliveries" },
    notes:             { fr: "Notes / Observations",       en: "Notes / Observations" },
    createSuccess:     { fr: "Livraison enregistrée avec succès !", en: "Delivery recorded successfully!" },
    deleteSuccess:     { fr: "Livraison supprimée.",       en: "Delivery deleted." },
  },

  // ── Client Deliveries ───────────────────────────────────────────────────────
  clientDeliveries: {
    title:             { fr: "Livraisons Clients",         en: "Client Deliveries" },
    subtitle:          { fr: "Gestion des bons de livraison clients", en: "Manage client delivery notes" },
    newDelivery:       { fr: "Nouvelle Livraison",         en: "New Delivery" },
    blNumber:          { fr: "N° BL",                      en: "DN #" },
    devisNumber:       { fr: "N° Devis",                   en: "Quote #" },
    client:            { fr: "Client",                     en: "Client" },
    clientAddress:     { fr: "Adresse client",             en: "Client address" },
    deliveryDate:      { fr: "Date livraison",             en: "Delivery date" },
    complete:          { fr: "Complète",                   en: "Complete" },
    partial:           { fr: "Partielle",                  en: "Partial" },
    pending:           { fr: "En attente",                 en: "Pending" },
    downloadBL:        { fr: "Télécharger BL (PDF)",       en: "Download DN (PDF)" },
    noDeliveries:      { fr: "Aucune livraison client",    en: "No client deliveries" },
    addProduct:        { fr: "Ajouter un produit",         en: "Add product" },
    notes:             { fr: "Notes / Observations",       en: "Notes / Observations" },
    createSuccess:     { fr: "Livraison client enregistrée !", en: "Client delivery recorded!" },
    deleteSuccess:     { fr: "Livraison supprimée.",       en: "Delivery deleted." },
  },

  // ── Supplier Payments ───────────────────────────────────────────────────────
  supplierPayments: {
    title:             { fr: "Paiements Fournisseurs",     en: "Supplier Payments" },
    subtitle:          { fr: "Gérez les paiements à vos fournisseurs", en: "Manage payments to your suppliers" },
    newPayment:        { fr: "Nouveau Paiement",           en: "New Payment" },
    paymentNumber:     { fr: "N° Paiement",                en: "Payment #" },
    supplier:          { fr: "Fournisseur",                en: "Supplier" },
    invoiceAmount:     { fr: "Montant facture",            en: "Invoice amount" },
    paidAmount:        { fr: "Montant payé",               en: "Amount paid" },
    remainingAmount:   { fr: "Reste à payer",              en: "Remaining" },
    paymentDate:       { fr: "Date paiement",              en: "Payment date" },
    method:            { fr: "Mode",                       en: "Method" },
    transfer:          { fr: "Virement",                   en: "Transfer" },
    check:             { fr: "Chèque",                     en: "Check" },
    cash:              { fr: "Espèces",                    en: "Cash" },
    complete:          { fr: "Soldé",                      en: "Settled" },
    partial:           { fr: "Partiel",                    en: "Partial" },
    pending:           { fr: "En attente",                 en: "Pending" },
    noPayments:        { fr: "Aucun paiement fournisseur", en: "No supplier payments" },
    createSuccess:     { fr: "Paiement enregistré avec succès !", en: "Payment recorded successfully!" },
    deleteSuccess:     { fr: "Paiement supprimé.",         en: "Payment deleted." },
  },

  // ── Client Payments ─────────────────────────────────────────────────────────
  clientPayments: {
    title:             { fr: "Encaissements Clients",      en: "Client Collections" },
    subtitle:          { fr: "Suivi des encaissements clients", en: "Track client collections" },
    newPayment:        { fr: "Nouvel Encaissement",        en: "New Collection" },
    paymentNumber:     { fr: "N° Encaissement",            en: "Collection #" },
    client:            { fr: "Client",                     en: "Client" },
    invoice:           { fr: "Facture",                    en: "Invoice" },
    invoiceAmount:     { fr: "Montant facture",            en: "Invoice amount" },
    paidAmount:        { fr: "Montant encaissé",           en: "Amount collected" },
    remainingAmount:   { fr: "Reste à encaisser",          en: "Remaining" },
    paymentDate:       { fr: "Date encaissement",          en: "Collection date" },
    method:            { fr: "Mode",                       en: "Method" },
    recoveryRate:      { fr: "Taux de recouvrement",       en: "Recovery rate" },
    complete:          { fr: "Soldé",                      en: "Settled" },
    partial:           { fr: "Partiel",                    en: "Partial" },
    pending:           { fr: "En attente",                 en: "Pending" },
    generateReceipt:   { fr: "Générer reçu (PDF)",         en: "Generate receipt (PDF)" },
    noPayments:        { fr: "Aucun encaissement",         en: "No collections" },
    createSuccess:     { fr: "Encaissement enregistré. La trésorerie a été mise à jour.", en: "Collection recorded. Treasury has been updated." },
    deleteSuccess:     { fr: "Encaissement supprimé.",     en: "Collection deleted." },
    totalCollected:    { fr: "Total encaissé",             en: "Total collected" },
    totalInvoiced:     { fr: "Total facturé",              en: "Total invoiced" },
    totalRemaining:    { fr: "Total restant",              en: "Total remaining" },
  },

  // ── Client Orders ───────────────────────────────────────────────────────────
  clientOrders: {
    title:             { fr: "Bons de Commande Clients",   en: "Client Orders" },
    subtitle:          { fr: "Commandes générées depuis les devis validés", en: "Orders generated from validated quotes" },
    orderNumber:       { fr: "N° Commande",                en: "Order #" },
    client:            { fr: "Client",                     en: "Client" },
    quote:             { fr: "Devis",                      en: "Quote" },
    confirmed:         { fr: "Confirmé",                   en: "Confirmed" },
    inDelivery:        { fr: "En livraison",               en: "In delivery" },
    delivered:         { fr: "Livré",                      en: "Delivered" },
    cancelled:         { fr: "Annulé",                     en: "Cancelled" },
    noOrders:          { fr: "Aucun bon de commande client", en: "No client orders" },
    infoBanner:        { fr: "Les bons de commande clients sont automatiquement créés lors de la validation d'un devis.", en: "Client orders are automatically created when a quote is validated." },
    totalOrders:       { fr: "Total commandes",            en: "Total orders" },
    confirmedCount:    { fr: "Confirmées",                 en: "Confirmed" },
    deliveredCount:    { fr: "Livrées",                    en: "Delivered" },
    inDeliveryCount:   { fr: "En livraison",               en: "In delivery" },
  },

  // ── Supplier Invoices ───────────────────────────────────────────────────────
  supplierInvoices: {
    title:             { fr: "Factures Fournisseurs",      en: "Supplier Invoices" },
    subtitle:          { fr: "Gestion des factures fournisseurs", en: "Manage supplier invoices" },
    newInvoice:        { fr: "Nouvelle Facture",           en: "New Invoice" },
    invoiceNumber:     { fr: "N° Facture",                 en: "Invoice #" },
    supplier:          { fr: "Fournisseur",                en: "Supplier" },
    dueDate:           { fr: "Date d'échéance",            en: "Due date" },
    pending:           { fr: "En attente",                 en: "Pending" },
    paid:              { fr: "Payée",                      en: "Paid" },
    overdue:           { fr: "En retard",                  en: "Overdue" },
    noInvoices:        { fr: "Aucune facture fournisseur", en: "No supplier invoices" },
  },

  // ── Client Invoices ─────────────────────────────────────────────────────────
  clientInvoices: {
    title:             { fr: "Factures Clients",           en: "Client Invoices" },
    subtitle:          { fr: "Gestion des factures clients", en: "Manage client invoices" },
    newInvoice:        { fr: "Nouvelle Facture",           en: "New Invoice" },
    invoiceNumber:     { fr: "N° Facture",                 en: "Invoice #" },
    client:            { fr: "Client",                     en: "Client" },
    dueDate:           { fr: "Date d'échéance",            en: "Due date" },
    pending:           { fr: "En attente",                 en: "Pending" },
    paid:              { fr: "Payée",                      en: "Paid" },
    overdue:           { fr: "En retard",                  en: "Overdue" },
    noInvoices:        { fr: "Aucune facture client",      en: "No client invoices" },
  },

  // ── Products ─────────────────────────────────────────────────────────────────
  products: {
    title:             { fr: "Catalogue Produits",         en: "Product Catalog" },
    subtitle:          { fr: "Gérez vos produits et services", en: "Manage your products and services" },
    newProduct:        { fr: "Nouveau Produit",            en: "New Product" },
    name:              { fr: "Nom",                        en: "Name" },
    category:          { fr: "Catégorie",                  en: "Category" },
    defaultPrice:      { fr: "Prix par défaut",            en: "Default price" },
    stock:             { fr: "Stock",                      en: "Stock" },
    noProducts:        { fr: "Aucun produit",              en: "No products" },
    createSuccess:     { fr: "Produit créé avec succès !", en: "Product created successfully!" },
    updateSuccess:     { fr: "Produit modifié avec succès !", en: "Product updated successfully!" },
    deleteSuccess:     { fr: "Produit supprimé.",          en: "Product deleted." },
    deleteConfirm:     { fr: "Supprimer ce produit définitivement ?", en: "Permanently delete this product?" },
  },

  // ── Daily Treasury ──────────────────────────────────────────────────────────
  dailyTreasury: {
    title:             { fr: "Trésorerie Journalière",     en: "Daily Treasury" },
    subtitle:          { fr: "Suivi quotidien des flux de trésorerie", en: "Daily cash flow tracking" },
    newEntry:          { fr: "Nouvelle Opération",         en: "New Entry" },
    entryNumber:       { fr: "N° Opération",               en: "Entry #" },
    entryDate:         { fr: "Date opération",             en: "Entry date" },
    type:              { fr: "Type",                       en: "Type" },
    encaissement:      { fr: "Encaissement",               en: "Collection" },
    decaissement:      { fr: "Décaissement",               en: "Disbursement" },
    category:          { fr: "Catégorie",                  en: "Category" },
    amount:            { fr: "Montant",                    en: "Amount" },
    balance:           { fr: "Solde cumulé",               en: "Running balance" },
    bank:              { fr: "Banque",                     en: "Bank" },
    bankInfo:          { fr: "Informations bancaires",     en: "Bank information" },
    accountHolder:     { fr: "Titulaire du compte",        en: "Account holder" },
    importExcel:       { fr: "Importer Excel",             en: "Import Excel" },
    exportExcel:       { fr: "Exporter Excel",             en: "Export Excel" },
    totalIn:           { fr: "Total encaissements",        en: "Total collections" },
    totalOut:          { fr: "Total décaissements",        en: "Total disbursements" },
    netBalance:        { fr: "Solde net",                  en: "Net balance" },
    openingBalance:    { fr: "Solde d'ouverture",          en: "Opening balance" },
    noEntries:         { fr: "Aucune opération",           en: "No entries" },
    createSuccess:     { fr: "Opération enregistrée !",    en: "Entry recorded!" },
    updateSuccess:     { fr: "Opération mise à jour !",    en: "Entry updated!" },
    deleteSuccess:     { fr: "Opération supprimée.",       en: "Entry deleted." },
    deleteConfirm:     { fr: "Supprimer cette opération ?", en: "Delete this entry?" },
    byCategory:        { fr: "Par catégorie",              en: "By category" },
    fluxByDate:        { fr: "Flux par date",              en: "Flux by date" },
    evolutionSolde:    { fr: "Évolution du solde",         en: "Balance evolution" },
    fluctuations:      { fr: "Fluctuations",               en: "Fluctuations" },
    circulating:       { fr: "Valeurs circulantes",        en: "Circulating values" },
    collections:       { fr: "Encaissements",              en: "Collections" },
  },

  // ── Other Collections ───────────────────────────────────────────────────────
  otherCollections: {
    title:             { fr: "Autres Encaissements",       en: "Other Collections" },
    subtitle:          { fr: "Encaissements hors ventes courantes", en: "Collections outside regular sales" },
    newCollection:     { fr: "Nouvel Encaissement",        en: "New Collection" },
    noCollections:     { fr: "Aucun encaissement",         en: "No collections" },
  },

  // ── Other Disbursements ─────────────────────────────────────────────────────
  otherDisbursements: {
    title:             { fr: "Autres Décaissements",       en: "Other Disbursements" },
    subtitle:          { fr: "Dépenses hors achats courants", en: "Expenses outside regular purchases" },
    newDisbursement:   { fr: "Nouveau Décaissement",       en: "New Disbursement" },
    noDisbursements:   { fr: "Aucun décaissement",         en: "No disbursements" },
  },

  // ── Document Generator ──────────────────────────────────────────────────────
  documentGenerator: {
    title:             { fr: "Générateur de Documents",    en: "Document Generator" },
    subtitle:          { fr: "Créez des factures et devis professionnels", en: "Create professional invoices and quotes" },
    newDocument:       { fr: "Nouveau Document",           en: "New Document" },
    invoice:           { fr: "Facture",                    en: "Invoice" },
    quote:             { fr: "Devis",                      en: "Quote" },
    receipt:           { fr: "Reçu",                       en: "Receipt" },
  },

  // ── User Management ─────────────────────────────────────────────────────────
  userManagement: {
    title:             { fr: "Gestion des Utilisateurs",   en: "User Management" },
    subtitle:          { fr: "Gérez les accès et permissions", en: "Manage access and permissions" },
    newUser:           { fr: "Nouvel Utilisateur",         en: "New User" },
    name:              { fr: "Nom",                        en: "Name" },
    email:             { fr: "Email",                      en: "Email" },
    role:              { fr: "Rôle",                       en: "Role" },
    admin:             { fr: "Administrateur",             en: "Administrator" },
    manager:           { fr: "Gestionnaire",               en: "Manager" },
    viewer:            { fr: "Lecteur",                    en: "Viewer" },
    active:            { fr: "Actif",                      en: "Active" },
    inactive:          { fr: "Inactif",                    en: "Inactive" },
    noUsers:           { fr: "Aucun utilisateur",          en: "No users" },
  },

  // ── User Settings ───────────────────────────────────────────────────────────
  userSettings: {
    title:             { fr: "Paramètres",                 en: "Settings" },
    subtitle:          { fr: "Gérez votre profil et vos préférences", en: "Manage your profile and preferences" },
    profile:           { fr: "Profil",                     en: "Profile" },
    security:          { fr: "Sécurité",                   en: "Security" },
    notifications:     { fr: "Notifications",              en: "Notifications" },
    language:          { fr: "Langue",                     en: "Language" },
    saveChanges:       { fr: "Enregistrer les modifications", en: "Save changes" },
  },
} as const;

// ─── Context ──────────────────────────────────────────────────────────────────

type TranslationsType = typeof translations;

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslationsType;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("app_lang");
      return stored === "en" ? "en" : "fr";
    } catch {
      return "fr";
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("app_lang", l); } catch { /* noop */ }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// ─── Convenience hook: returns a simple (key) => string resolver ──────────────
export function useT() {
  const { lang, t } = useLanguage();
  return function<
    TSection extends keyof TranslationsType,
    TKey extends keyof TranslationsType[TSection]
  >(section: TSection, key: TKey): string {
    const entry = t[section][key] as { fr: string; en: string };
    return entry[lang];
  };
}
