import { useState, useRef, useEffect } from "react";

import { apiRequest } from "../../apiClient";

import {
  Package, Search, Upload, FileText, Truck, ShoppingCart, Download, X,
  ChevronDown, Filter, Send, CheckCircle2, AlertCircle, Clock, Eye,
  Building2, Phone, Mail, Tag, Plus, ClipboardCheck, History,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";

/* ─── Seed data ─────────────────────────────────────────────────────── */

const CATEGORIES = ["Toutes catégories", "Fournitures bureau", "Mobilier", "Informatique", "Maintenance", "Services"];

const FOURNISSEURS = [
  {
    id: "f1",
    name: "Alpha Fournisseurs SARL",
    contact: "Moustapha Diop",
    phone: "+221 77 123 45 67",
    email: "fournisseur@tresor.sn",
    adresse: "Zone Industrielle Dakar-Yoff, Lot 42",
    ninea: "SN-0011234567",
    status: "Actif",
    category: "Fournitures bureau",
    solde: 1770000,
  },
  {
    id: "f2",
    name: "Société ABC",
    contact: "Aminata Sarr",
    phone: "+221 77 234 56 78",
    email: "abc@fournisseur.sn",
    adresse: "Rue 10 x 11, Médina, Dakar",
    ninea: "SN-0022345678",
    status: "Actif",
    category: "Mobilier",
    solde: 0,
  },
  {
    id: "f3",
    name: "Entreprise XYZ",
    contact: "Ibrahima Ndiaye",
    phone: "+221 33 123 45 67",
    email: "xyz@fournisseur.sn",
    adresse: "Avenue Bourguiba, Plateau, Dakar",
    ninea: "SN-0033456789",
    status: "Actif",
    category: "Informatique",
    solde: 1486800,
  },
  {
    id: "f4",
    name: "Service DEF",
    contact: "Fatoumata Balde",
    phone: "+221 76 987 65 43",
    email: "def@service.sn",
    adresse: "HLM Grand Yoff, Villa 12",
    ninea: "SN-0044567890",
    status: "Inactif",
    category: "Maintenance",
    solde: 0,
  },
];

type BDCStatus = "Brouillon" | "Envoyé" | "Confirmé" | "Validé" | "Livré" | "En cours";
type BLStatus = "Complète" | "Partielle" | "En attente" | "Conforme" | "Litige";
type InvStatus = "En attente" | "Payée" | "Rejetée" | "En cours de traitement";

interface BDCRow {
  id: string;
  reference: string;
  fournisseurId: string;
  date: string;
  items: string;
  bdcItems: any[];
  amount: number;
  status: BDCStatus;
}
interface BLRow {
  id: string;
  reference: string;
  fournisseurId: string;
  bdcRef: string;
  date: string;
  items: string;
  status: BLStatus;
  conformite?: string;
}
interface InvRow {
  id: string;
  reference: string;
  invoiceNumber: string;
  fournisseurId: string;
  bdcRef: string;
  blRef?: string;
  amount: number;
  date: string;
  dueDate: string;
  status: InvStatus;
  fileName?: string;
}
interface SupplierUI {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  logo: string | null;
  adresse: string;
  ninea: string;
  rccm: string;
  contactPrincipalEmail: string;
  contactPrincipalPhone: string;
  paymentTerms: number;
  currency: string;
  status: "Actif" | "Inactif";
  category: string;
  solde: number;
  createdAt?: string;
  updatedAt?: string;
}


/* ─── Helpers ───────────────────────────────────────────────────────── */

function fmt(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

function bdcStatusBadge(s: BDCStatus) {
  const map: Record<BDCStatus, string> = {
    Brouillon: "bg-gray-100 text-gray-600",
    Envoyé: "bg-blue-100 text-blue-700",
    Confirmé: "bg-cyan-100 text-cyan-700",
    Validé: "bg-indigo-100 text-indigo-700",
    Livré: "bg-green-100 text-green-700",
    "En cours": "bg-amber-100 text-amber-700",
  };
  return map[s] ?? "bg-gray-100 text-gray-600";
}

function blStatusBadge(s: BLStatus) {
  const map: Record<BLStatus, string> = {
    Complète: "bg-blue-100 text-blue-700",
    Partielle: "bg-amber-100 text-amber-700",
    "En attente": "bg-gray-100 text-gray-500",
    Conforme: "bg-green-100 text-green-700",
    Litige: "bg-red-100 text-red-700",
  };
  return map[s] ?? "bg-gray-100 text-gray-600";
}

function invStatusBadge(s: InvStatus) {
  const map: Record<InvStatus, string> = {
    "En attente": "bg-orange-100 text-orange-700",
    Payée: "bg-green-100 text-green-700",
    Rejetée: "bg-red-100 text-red-700",
    "En cours de traitement": "bg-blue-100 text-blue-700",
  };
  return map[s] ?? "bg-gray-100 text-gray-600";
}

/* ─── Fiche fournisseur detail card ─────────────────────────────────── */

function FicheCard({ f }: { f: typeof FOURNISSEURS[0] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-base">{f.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status === "Actif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {f.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{f.contact} · {f.category}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{f.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{f.email}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">NINEA : {f.ninea}</span>
        </div>
      </div>
      {f.solde > 0 && (
        <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="text-xs text-orange-700">Solde dû : <strong>{fmt(f.solde)}</strong></span>
        </div>
      )}
    </div>
  );
}

/* ─── Conformity modal ──────────────────────────────────────────────── */

function ConformiteModal({
  bl, onClose, onConfirm,
}: {
  bl: BLRow;
  onClose: () => void;
  onConfirm: (note: string, status: BLStatus) => void;
}) {
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<"Conforme" | "Litige">("Conforme");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            Vérification de conformité
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <span className="font-semibold">BL :</span> {bl.id} · <span className="font-semibold">BDC :</span> {bl.bdcRef}<br />
            <span className="text-gray-600 mt-1 block">{bl.items}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Résultat de la vérification</label>
            <div className="flex gap-3">
              {(["Conforme", "Litige"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdict(v)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                    verdict === v
                      ? v === "Conforme"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {v === "Conforme" ? <CheckCircle2 className="w-4 h-4 inline mr-1.5" /> : <AlertCircle className="w-4 h-4 inline mr-1.5" />}
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observation / Commentaire <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder={verdict === "Conforme" ? "Ex : Livraison conforme au BDC, tous les articles présents..." : "Ex : 3 articles manquants sur 10 commandés..."}
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
            Annuler
          </button>
          <button
            onClick={() => { if (note.trim()) onConfirm(note, verdict); }}
            disabled={!note.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Send BDC modal ────────────────────────────────────────────────── */

function SendBDCModal({
  bdc, fournisseurEmail, onClose, onConfirm,
}: {
  bdc: BDCRow;
  fournisseurEmail: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            Envoyer le BDC
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 text-sm">
            <p className="font-semibold text-blue-900">{bdc.id}</p>
            <p className="text-blue-700 text-xs mt-0.5">{bdc.items}</p>
            <p className="text-blue-600 text-xs mt-1">Montant : <strong>{fmt(bdc.amount)}</strong></p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            Destinataire : <strong>{fournisseurEmail}</strong>
          </div>
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Le statut du BDC passera à <strong>Envoyé</strong> et une notification sera générée.
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Confirmer l&apos;envoi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── BL PDF ─────────────────────────────────────────────────────────  */

function generateBLPdf(bl: BLRow, fournisseur: typeof FOURNISSEURS[0] | undefined) {
  const w = window.open("", "_blank", "width=800,height=640");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>BL ${bl.id}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1a1a1a}
    .header{display:flex;justify-content:space-between;border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:30px}
    .company h1{font-size:20px;color:#1e40af;margin:0}
    .doc-title h2{font-size:24px;font-weight:900;color:#1e40af;margin:0;text-transform:uppercase;letter-spacing:2px;text-align:right}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}
    .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px}
    .info-box h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin:0 0 8px}
    table{width:100%;border-collapse:collapse;margin:24px 0}
    thead tr{background:#1e40af;color:white}
    thead th{padding:10px 12px;text-align:left;font-size:12px}
    tbody td{padding:10px 12px;font-size:13px;border-bottom:1px solid #e2e8f0}
    .conformite{margin:16px 0;padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:12px;color:#166534}
    .footer{margin-top:40px;display:flex;justify-content:space-between}
    .sig{border:1px solid #e2e8f0;border-radius:8px;padding:16px;width:180px;text-align:center}
    .sig .line{height:60px;border-bottom:1px dashed #ccc;margin-bottom:8px}
    .sig .lbl{font-size:11px;color:#64748b;text-transform:uppercase}
  </style>
  </head><body>
  <div class="header">
    <div class="company"><h1>TRÉSOR — SÉNÉGAL</h1><p>Gestion de Trésorerie et Comptabilité</p></div>
    <div class="doc-title"><h2>Bordereau de Livraison</h2><p style="text-align:right;font-size:14px;color:#555">${bl.id}</p></div>
  </div>
  <div class="info-grid">
    <div class="info-box"><h4>Informations BL</h4><p><strong>N° BL :</strong> ${bl.id}</p><p><strong>BDC :</strong> ${bl.bdcRef}</p><p><strong>Date :</strong> ${bl.date}</p><p><strong>Statut :</strong> ${bl.status}</p></div>
    <div class="info-box"><h4>Fournisseur</h4><p><strong>${fournisseur?.name ?? ""}</strong></p><p>${fournisseur?.phone ?? ""}</p><p>${fournisseur?.email ?? ""}</p><p>NINEA : ${fournisseur?.ninea ?? ""}</p></div>
  </div>
  <table><thead><tr><th>Désignation</th><th>Statut livraison</th></tr></thead>
  <tbody><tr><td>${bl.items}</td><td>${bl.status}</td></tr></tbody></table>
  ${bl.conformite ? `<div class="conformite">✓ Vérification de conformité : ${bl.conformite}</div>` : ""}
  <div class="footer">
    <div class="sig"><div class="line"></div><div class="lbl">Fournisseur</div></div>
    <div class="sig"><div class="line"></div><div class="lbl">Réception</div></div>
    <div class="sig"><div class="line"></div><div class="lbl">Visa Gestionnaire</div></div>
  </div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

/* ─── Main component ─────────────────────────────────────────────────  */

export function FournisseursEspace() {
 const [suppliers, setSuppliers] = useState<SupplierUI[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
 useEffect(() => {
  const loadSuppliers = async () => {
    console.log("=== CHARGEMENT FOURNISSEURS DJANGO ===");

    try {
      const response = await apiRequest(
  `/v1/suppliers/?page=${currentPage}`
);

setTotalPages(
  response.count ? Math.ceil(response.count / 20) : 1
);
console.log(
  "=== PAGINATION FOURNISSEURS ===",
  "Page actuelle :", currentPage,
  "Total éléments :", response.count,
  "Total pages :", response.count
    ? Math.ceil(response.count / 20)
    : 1
);
      console.log(
        "=== FOURNISSEURS DJANGO ===",
        JSON.stringify(response, null, 2)
      );



      const normalizedSuppliers: SupplierUI[] = response.results.map(
  (supplier: any) => ({
    id: supplier.id,
    name: supplier.raison_sociale || "",
    contact: supplier.contact_principal_nom || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    logo: supplier.logo || null,
    adresse: supplier.address || "",
    ninea: supplier.ninea || "",
    rccm: supplier.rccm || "",
    contactPrincipalEmail: supplier.contact_principal_email || "",
    contactPrincipalPhone: supplier.contact_principal_phone || "",
    paymentTerms: Number(supplier.payment_terms || 0),
    currency: supplier.currency || "XOF",
    status: supplier.is_active ? "Actif" : "Inactif",
    category: "Toutes catégories",
    solde: 0,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
  })
);
      console.log(
        "=== FOURNISSEURS NORMALISES ===",
        normalizedSuppliers
      );

      setSuppliers(normalizedSuppliers);

    } catch (error) {
      console.error(
        "=== ERREUR FOURNISSEURS DJANGO ===",
        error
      );
    }
  };

  loadSuppliers();
}, [currentPage]);

useEffect(() => {
  const loadPurchaseOrders = async () => {
    console.log("=== CHARGEMENT BDC DJANGO ESPACE FOURNISSEURS ===");

    try {
      const response = await apiRequest("/v1/purchase-orders/");

      console.log(
        "=== BDC DJANGO ESPACE FOURNISSEURS ===",
        JSON.stringify(response, null, 2)
      );

      const normalizedBdc: BDCRow[] = response.results.map(
  (bdc: any) => ({
    id: bdc.id,
    reference: bdc.reference,
    fournisseurId: bdc.supplier,
    date: bdc.order_date,
    items: bdc.items
      ?.map((item: any) => item.product_detail?.name)
      .join(", ") || "",
      bdcItems: bdc.items || [],
    amount: Number(bdc.total_amount_ttc || 0),
    status:
      bdc.status === "DRAFT"
        ? "Brouillon"
        : bdc.status === "SENT"
        ? "Envoyé"
        : bdc.status === "APPROVED"
        ? "Validé"
        : bdc.status === "REJECTED"
        ? "En cours"
        : "Brouillon",
  })
);

console.log(
  "=== BDC NORMALISES ===",
  normalizedBdc
);

console.log("=== PREMIER BDC NORMALISE ===", normalizedBdc[0]);
setBdcList(normalizedBdc);

    } catch (error) {
      console.error(
        "=== ERREUR BDC DJANGO ESPACE FOURNISSEURS ===",
        error
      );
    }
  };

  loadPurchaseOrders();
}, []);

useEffect(() => {
  const loadDeliveries = async () => {
    console.log("=== CHARGEMENT LIVRAISONS DJANGO ESPACE FOURNISSEURS ===");

    try {
      const response = await apiRequest("/v1/deliveries/");

      console.log(
        "=== LIVRAISONS DJANGO ESPACE FOURNISSEURS ===",
        JSON.stringify(response, null, 2)
      );

      const normalizedBl: BLRow[] = response.results.map(
        (delivery: any) => ({
          id: delivery.id,
          reference: delivery.reference,
          fournisseurId: delivery.supplier,
          bdcRef: delivery.purchase_order_reference || "",
          date: delivery.delivery_date,
         items:
  delivery.items
    ?.map(
      (item: any) =>
        item.product_detail?.name ||
        item.product_name ||
        item.product?.name ||
        ""
    )
    .filter(Boolean)
    .join(", ") || "",
          status:
            delivery.status === "PENDING"
              ? "En attente"
              : delivery.status === "PARTIAL"
              ? "Partielle"
              : delivery.status === "COMPLETE"
              ? "Complète"
              : delivery.status === "VALIDATED"
              ? "Conforme"
              : delivery.status === "WITH_DISCREPANCY"
              ? "Litige"
              : "En attente",
          conformite: delivery.notes || "",
        })
      );

      console.log(
        "=== LIVRAISONS NORMALISEES ===",
        normalizedBl
      );

      setBlList(normalizedBl);
    } catch (error) {
      console.error(
        "=== ERREUR LIVRAISONS DJANGO ESPACE FOURNISSEURS ===",
        error
      );
    }
  };

  loadDeliveries();
}, []);

useEffect(() => {
  const loadSupplierInvoices = async () => {
    console.log("=== CHARGEMENT FACTURES FOURNISSEURS DJANGO ESPACE FOURNISSEURS ===");

    try {
      const response = await apiRequest("/v1/invoices/supplier/");

      console.log(
        "=== FACTURES FOURNISSEURS DJANGO ESPACE FOURNISSEURS ===",
        JSON.stringify(response, null, 2)
      );

      const normalizedInvoices: InvRow[] = response.results.map(
        (invoice: any) => ({
          id: invoice.id,
          reference: invoice.reference || "",
          invoiceNumber: invoice.invoice_number || "",
          fournisseurId: invoice.supplier,
          bdcRef: invoice.purchase_order_reference || "",
          blRef: invoice.delivery_reference || "",
          amount: Number(invoice.total_amount || 0),
          date: invoice.invoice_date,
          dueDate: invoice.due_date,
          status:
            invoice.status === "PAID"
              ? "Payée"
              : invoice.status === "REJECTED"
              ? "Rejetée"
              : invoice.status === "DRAFT"
              ? "En attente"
              : invoice.status === "APPROVED"
              ? "En cours de traitement"
              : "En attente",
          fileName: invoice.attachment || "",
        })
      );

      console.log(
        "=== FACTURES NORMALISEES ===",
        normalizedInvoices
      );

      setInvList(normalizedInvoices);
    } catch (error) {
      console.error(
        "=== ERREUR FACTURES FOURNISSEURS DJANGO ESPACE FOURNISSEURS ===",
        error
      );
    }
  };

  loadSupplierInvoices();
}, []);
  const { user } = useAuth();
  const { addNotification, addAuditEntry } = useAppData();

  /* Filters */
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Toutes catégories");
  const [statusFilter, setStatusFilter] = useState<"Tous" | "Actif" | "Inactif">("Tous");
 

  /* Selection */
  const [selectedF, setSelectedF] = useState<typeof FOURNISSEURS[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"bdc" | "livraisons" | "factures" | "historique">("bdc");

  /* Local data state */
  const [bdcList, setBdcList] = useState<BDCRow[]>([]);
  const [blList, setBlList] = useState<BLRow[]>([]);
  const [invList, setInvList] = useState<InvRow[]>([]);

  /* Modals */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [conformiteTarget, setConformiteTarget] = useState<BLRow | null>(null);
  const [sendBDCTarget, setSendBDCTarget] = useState<BDCRow | null>(null);

  /* Fournisseur - détail / CRUD */
const [supplierDetail, setSupplierDetail] = useState<SupplierUI | null>(null);
const [showSupplierDetail, setShowSupplierDetail] = useState(false);
const [loadingSupplierDetail, setLoadingSupplierDetail] = useState(false);
const [showSupplierForm, setShowSupplierForm] = useState(false);
const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
const [supplierForm, setSupplierForm] = useState({
  raison_sociale: "",
  ninea: "",
  rccm: "",
  email: "",
  phone: "",
  address: "",
  logo: null as File | null,
  contact_principal_nom: "",
  contact_principal_email: "",
  contact_principal_phone: "",
  payment_terms: 30,
  currency: "XOF",
  is_active: true,
});

  /* Upload state */
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBdcRef, setUploadBdcRef] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Audit log local (in-component for display) */
  const [localAudit, setLocalAudit] = useState<{
    id: string; action: string; fournisseur: string; ref: string; timestamp: string;
  }[]>([]);

  const logAudit = (action: string, ref: string, fournisseurName: string) => {
    const ts = new Date().toISOString();
    setLocalAudit((prev) => [
      { id: crypto.randomUUID(), action, fournisseur: fournisseurName, ref, timestamp: ts },
      ...prev,
    ]);
    if (user) {
      addAuditEntry({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action,
        module: "fournisseurs_espace",
        documentRef: ref,
      });
    }
  };

  /* Filtered list */
 const filtered = suppliers.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || f.contact.toLowerCase().includes(q);
    const matchCat = catFilter === "Toutes catégories" || f.category === catFilter;
    const matchStatus = statusFilter === "Tous" || f.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  /* Per-fournisseur subsets */
  const fBDC = selectedF ? bdcList.filter((o) => o.fournisseurId === selectedF.id) : [];
  const fBL = selectedF ? blList.filter((d) => d.fournisseurId === selectedF.id) : [];
  const fFAC = selectedF ? invList.filter((i) => i.fournisseurId === selectedF.id) : [];
  const fAudit = selectedF ? localAudit.filter((a) => a.fournisseur === selectedF.name) : [];

  /* Stats */
  const totalActif = suppliers.filter((f) => f.status === "Actif").length;
  const totalInactif = suppliers.filter((f) => f.status === "Inactif").length;
  const totalPending = invList.filter((i) => i.status === "En attente").length;

  /* ── Handlers ─────────────────────────────────────────────────────── */

const handleViewSupplier = async (supplier: SupplierUI) => {
  console.log("=== DETAIL FOURNISSEUR DJANGO ===");
  console.log("=== FOURNISSEUR ID ===", supplier.id);

  setLoadingSupplierDetail(true);
  setShowSupplierDetail(true);

  try {
    const response = await apiRequest(
      `/v1/suppliers/${supplier.id}/`
    );

    console.log(
      "=== DETAIL FOURNISSEUR DJANGO ===",
      JSON.stringify(response, null, 2)
    );

    const normalizedSupplier: SupplierUI = {
      id: response.id,
      name: response.raison_sociale || "",
      contact: response.contact_principal_nom || "",
      phone: response.phone || "",
      email: response.email || "",
      logo: response.logo || null,
      adresse: response.address || "",
      ninea: response.ninea || "",
      rccm: response.rccm || "",
      contactPrincipalEmail:
        response.contact_principal_email || "",
      contactPrincipalPhone:
        response.contact_principal_phone || "",
      paymentTerms: Number(response.payment_terms || 0),
      currency: response.currency || "XOF",
      status: response.is_active ? "Actif" : "Inactif",
      category: "Toutes catégories",
      solde: 0,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    };

    setSupplierDetail(normalizedSupplier);

  } catch (error) {
    console.error(
      "=== ERREUR DETAIL FOURNISSEUR DJANGO ===",
      error
    );

    addNotification({
      type: "warning",
      title: "Erreur",
      message: "Impossible de charger le détail du fournisseur.",
      module: "fournisseurs_espace",
      documentRef: supplier.id,
    });

    setShowSupplierDetail(false);

  } finally {
    setLoadingSupplierDetail(false);
  }
};
const handleCreateSupplier = async () => {
  console.log("=== CREATION / MODIFICATION FOURNISSEUR DJANGO ===");

  console.log("=== ID FOURNISSEUR ===", editingSupplierId);
  console.log("=== DONNEES ENVOYEES ===", supplierForm);

  try {
    const response = await apiRequest(
      editingSupplierId
        ? `/v1/suppliers/${editingSupplierId}/`
        : "/v1/suppliers/",
      {
        method: editingSupplierId ? "PUT" : "POST",
        body: JSON.stringify({
          raison_sociale: supplierForm.raison_sociale,
          ninea: supplierForm.ninea,
          rccm: supplierForm.rccm,
          email: supplierForm.email,
          phone: supplierForm.phone,
          address: supplierForm.address,
          contact_principal_nom: supplierForm.contact_principal_nom,
          contact_principal_email: supplierForm.contact_principal_email,
          contact_principal_phone: supplierForm.contact_principal_phone,
          payment_terms: Number(supplierForm.payment_terms),
          currency: supplierForm.currency,
          is_active: supplierForm.is_active,
        }),
      }
    );

    console.log(
      "=== FOURNISSEUR ENREGISTRE DJANGO ===",
      JSON.stringify(response, null, 2)
    );

    const supplierId = editingSupplierId || response.id;

    if (supplierForm.logo) {
      const logoData = new FormData();
      logoData.append("logo", supplierForm.logo);

      const logoResponse = await apiRequest(
        `/v1/suppliers/${supplierId}/`,
        {
          method: "PATCH",
          body: logoData,
        }
      );

      console.log(
        "=== LOGO FOURNISSEUR ENREGISTRE DJANGO ===",
        JSON.stringify(logoResponse, null, 2)
      );
    }

    addNotification({
      type: "success",
      title: editingSupplierId
        ? "Fournisseur modifié"
        : "Fournisseur créé",
      message: editingSupplierId
        ? `Le fournisseur ${response.raison_sociale} a été modifié avec succès.`
        : `Le fournisseur ${response.raison_sociale} a été créé avec succès.`,
      module: "fournisseurs_espace",
      documentRef: response.id,
    });

    if (editingSupplierId) {
      setSuppliers((currentSuppliers) =>
        currentSuppliers.map((supplier) =>
          supplier.id === editingSupplierId
            ? {
                ...supplier,
                name: response.raison_sociale || "",
                contact: response.contact_principal_nom || "",
                phone: response.phone || "",
                email: response.email || "",
                logo: supplierForm.logo
                  ? URL.createObjectURL(supplierForm.logo)
                  : response.logo || supplier.logo,
                adresse: response.address || "",
                ninea: response.ninea || "",
                rccm: response.rccm || "",
                contactPrincipalEmail:
                  response.contact_principal_email || "",
                contactPrincipalPhone:
                  response.contact_principal_phone || "",
                paymentTerms: Number(response.payment_terms || 0),
                currency: response.currency || "XOF",
                status: response.is_active ? "Actif" : "Inactif",
                updatedAt: response.updated_at,
              }
            : supplier
        )
      );
    }

    setShowSupplierForm(false);
    setEditingSupplierId(null);

  } catch (error) {
    console.error(
      "=== ERREUR ENREGISTREMENT FOURNISSEUR DJANGO ===",
      error
    );

    addNotification({
      type: "warning",
      title: "Erreur",
      message: editingSupplierId
        ? "Impossible de modifier le fournisseur."
        : "Impossible de créer le fournisseur.",
      module: "fournisseurs_espace",
    });
  }
};
const handleDeleteSupplier = async (supplier: SupplierUI) => {
  console.log("=== SUPPRESSION FOURNISSEUR DJANGO ===");
  console.log("=== FOURNISSEUR ID ===", supplier.id);

  const confirmed = window.confirm(
    `Voulez-vous vraiment supprimer le fournisseur "${supplier.name}" ?`
  );

  if (!confirmed) {
    console.log("=== SUPPRESSION ANNULÉE ===");
    return;
  }

  try {
    const response = await apiRequest(
      `/v1/suppliers/${supplier.id}/`,
      {
        method: "DELETE",
      }
    );

    console.log(
      "=== FOURNISSEUR SUPPRIMÉ DJANGO ===",
      response
    );

  } catch (error) {
    console.error(
      "=== ERREUR SUPPRESSION FOURNISSEUR DJANGO ===",
      error
    );
  }
};

  const handleSendBDC = async () => {
  if (!sendBDCTarget || !selectedF) return;

  console.log("=== ENVOI BDC AU FOURNISSEUR ===");
  console.log("=== ID BDC ===", sendBDCTarget.id);
  console.log("=== REFERENCE BDC ===", sendBDCTarget.reference);
  console.log("=== FOURNISSEUR ===", selectedF.name);

  try {
    const response = await apiRequest(
      `/v1/purchase-orders/${sendBDCTarget.id}/send-to-supplier/`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    console.log(
      "=== REPONSE ENVOI BDC DJANGO ===",
      JSON.stringify(response, null, 2)
    );

    setBdcList((prev) =>
      prev.map((b) =>
        b.id === sendBDCTarget.id
          ? { ...b, status: "Envoyé" as BDCStatus }
          : b
      )
    );

    addNotification({
      type: "info",
      title: "BDC envoyé au fournisseur",
      message: `Le BDC ${sendBDCTarget.reference} a été envoyé à ${selectedF.name}.`,
      module: "fournisseurs_espace",
      documentRef: sendBDCTarget.id,
    });

    logAudit(
      `BDC envoyé au fournisseur ${selectedF.name}`,
      sendBDCTarget.id,
      selectedF.name
    );

    setSendBDCTarget(null);
  } catch (error) {
    console.error(
      "=== ERREUR ENVOI BDC AU FOURNISSEUR ===",
      error
    );

    addNotification({
      type: "warning",
      title: "Erreur d'envoi du BDC",
      message: `Impossible d'envoyer le BDC ${sendBDCTarget.reference} au fournisseur.`,
      module: "fournisseurs_espace",
      documentRef: sendBDCTarget.id,
    });
  }
};
  const handleConformite = (note: string, status: BLStatus) => {
    if (!conformiteTarget || !selectedF) return;
    setBlList((prev) =>
      prev.map((b) => b.id === conformiteTarget.id ? { ...b, status, conformite: note } : b)
    );
    addNotification({
      type: status === "Conforme" ? "success" : "warning",
      title: status === "Conforme" ? "BL conforme vérifié" : "Litige signalé sur BL",
      message: `${conformiteTarget.id} — ${selectedF.name} : ${note}`,
      module: "fournisseurs_espace",
      documentRef: conformiteTarget.id,
    });
    logAudit(`Vérification conformité BL : ${status}`, conformiteTarget.id, selectedF.name);
    setConformiteTarget(null);
  };

  const handleFileInput = (f: File) => {
    const ACCEPTED = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!ACCEPTED.includes(f.type) || f.size > 10 * 1024 * 1024) return;
    setUploadFile(f);
  };

  const handleUploadSubmit = async () => {
  if (!uploadBdcRef.trim() || !uploadFile || !selectedF) return;

  setUploading(true);
  setUploadProgress(10);

  try {
    // Retrouver le BDC sélectionné
    const selectedBdc = fBDC.find(
      (b) => b.id === uploadBdcRef || b.reference === uploadBdcRef
    );

    if (!selectedBdc) {
      throw new Error("BDC introuvable.");
    }

    const invoiceNumber = `FAC-${Date.now()}`;

    const today = new Date();
    const invoiceDate = today.toISOString().slice(0, 10);

    const due = new Date(today);
    due.setDate(due.getDate() + 30);
    const dueDate = due.toISOString().slice(0, 10);

    const invoiceLines = (selectedBdc.bdcItems || []).map((item: any) => ({
  product: item.product,
  designation: item.product_detail?.name || "",
  quantity: String(item.quantity || item.quantity_ordered || 0),
  unit_price: String(item.unit_price || item.product_detail?.unit_price || 0),
}));

console.log("=== LIGNES FACTURE ===");
console.log(invoiceLines);

const payload = {
  invoice_number: invoiceNumber,
  supplier: selectedF.id,
  purchase_order: selectedBdc.id,
  invoice_date: invoiceDate,
  due_date: dueDate,
  currency: "XOF",
  tva_percent: "18",
  attachment: "",
  notes: `Facture déposée depuis l'espace fournisseur ${selectedF.name}`,
  lines: invoiceLines,
};

console.log("=== JSON FACTURE FOURNISSEUR ===");
console.log(payload);

setUploadProgress(30);

    console.log("=== DÉPÔT FACTURE FOURNISSEUR DJANGO ===");
    console.log("Fournisseur :", selectedF.id);
    console.log("BDC :", selectedBdc.id);
    console.log("Référence BDC :", selectedBdc.reference);
    console.log("Fichier :", uploadFile.name);

    console.log("=== FORMDATA ENVOYÉ ===");



   const response = await apiRequest(
  "/v1/invoices/supplier/",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);

    setUploadProgress(100);

    console.log("=== FACTURE FOURNISSEUR CRÉÉE ===", response.data);

    addNotification({
      type: "success",
      title: "Facture déposée",
      message: `La facture "${uploadFile.name}" a été déposée pour ${selectedF.name}.`,
      module: "fournisseurs_espace",
      documentRef: selectedBdc.reference,
    });

    logAudit(
      `Dépôt facture pour fournisseur ${selectedF.name}`,
      selectedBdc.reference,
      selectedF.name
    );

    setTimeout(() => {
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadBdcRef("");
      setUploading(false);
      setUploadProgress(0);
    }, 300);

  } catch (error: any) {
    console.error("=== ERREUR DÉPÔT FACTURE FOURNISSEUR ===", error);

    setUploading(false);
    setUploadProgress(0);

    addNotification({
      type: "error",
      title: "Erreur",
      message:
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Impossible de déposer la facture.",
      module: "fournisseurs_espace",
      documentRef: uploadBdcRef,
    });
  }
};
  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Espace Fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez les fournisseurs et opérez en leur nom dans le cadre du cycle d&apos;achats.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 font-medium">Toutes les actions sont tracées dans le journal d&apos;audit</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total fournisseurs", value: suppliers.length, icon: Building2, color: "text-blue-600 bg-blue-50" },
          { label: "Actifs", value: totalActif, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Inactifs", value: totalInactif, icon: Clock, color: "text-gray-500 bg-gray-100" },
          { label: "Factures en attente", value: totalPending, icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Supplier list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Liste des fournisseurs</h2>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rechercher..."
              />
            </div>
            <div className="flex items-center justify-between mb-3">
  <h2 className="text-sm font-semibold text-gray-800">
    Fournisseurs
  </h2>

  <button
    type="button"
   onClick={() => {
  console.log("=== NOUVEAU FOURNISSEUR ===");
  setShowSupplierForm(true);
}}
    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
  >
    <Plus className="w-4 h-4" />
    Nouveau fournisseur
  </button>
</div>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>Tous</option>
                <option>Actif</option>
                <option>Inactif</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Aucun fournisseur trouvé</div>
            ) : filtered.map((f) => {
              const pendingInv = invList.filter((i) => i.fournisseurId === f.id && i.status === "En attente").length;
              return (
               <div
  key={f.id}
  className={`px-4 py-3.5 hover:bg-blue-50 transition-colors ${
    selectedF?.id === f.id
      ? "bg-blue-50 border-r-2 border-blue-600"
      : ""
  }`}
>
  <div className="flex items-start justify-between gap-2">

    <button
      onClick={() => {
        setSelectedF(f);
        setActiveTab("bdc");
      }}
      className="flex-1 text-left min-w-0"
    ><div className="flex items-start gap-3">
  {f.logo ? (
    <img
      src={f.logo}
      alt={`Logo ${f.name}`}
      className="h-10 w-10 shrink-0 object-contain border border-gray-200 rounded-lg p-1 bg-white"
    />
  ) : (
    <div className="h-10 w-10 shrink-0 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-[10px] text-gray-400">
      Logo
    </div>
  )}

  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-gray-800 truncate">
        {f.name}
      </p>

      <div className="flex items-center gap-1 shrink-0">
        {pendingInv > 0 && (
          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
            {pendingInv}
          </span>
        )}

        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            f.status === "Actif"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {f.status}
        </span>
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-0.5">
      {f.category}
    </p>

    <p className="text-xs text-gray-400 mt-0.5">
      {f.contact}
    </p>
  </div>
</div>
    </button>

    <div className="flex items-center gap-2 shrink-0">

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleViewSupplier(f);
    }}
    className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-white hover:text-blue-600 transition"
    title="Voir le fournisseur"
  >
    <Eye className="w-3.5 h-3.5" />
    Voir
  </button>

  <button
   onClick={(e) => {
  e.stopPropagation();

  console.log("=== MODIFIER FOURNISSEUR ===", f.id);

  setEditingSupplierId(f.id);

  setSupplierForm({
    raison_sociale: f.name || "",
    ninea: f.ninea || "",
    rccm: f.rccm || "",
    email: f.email || "",
    phone: f.phone || "",
    address: f.adresse || "",
    logo: null,
    contact_principal_nom: f.contact || "",
    contact_principal_email: f.contactPrincipalEmail || "",
    contact_principal_phone: f.contactPrincipalPhone || "",
    payment_terms: f.paymentTerms || 30,
    currency: f.currency || "XOF",
    is_active: f.status === "Actif",
  });

  setShowSupplierForm(true);
}}
    className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-white hover:text-blue-600 transition"
    title="Modifier le fournisseur"
  >
    Modifier
  </button>

</div>
<button
  onClick={(e) => {
    e.stopPropagation();

    console.log("=== SUPPRIMER FOURNISSEUR ===", f.id);

    handleDeleteSupplier(f);
  }}
  className="flex items-center gap-1 px-2 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50 transition"
  title="Supprimer le fournisseur"
>
  Supprimer
</button>

  </div>
</div>
              );
            })}
                   </div>

          {/* Pagination fournisseurs */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Précédent
            </button>

            <span className="font-bold text-sm">
              Page {currentPage} sur {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedF ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-14 text-center">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Sélectionnez un fournisseur pour consulter ses documents</p>
            </div>
          ) : (
            <>
              {/* Fiche fournisseur */}
              <FicheCard f={selectedF} />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Upload className="w-4 h-4" />
                  Déposer facture
                </button>
                <button
                  onClick={() => setActiveTab("historique")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  <History className="w-4 h-4" />
                  Journal d&apos;audit
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {([
                    ["bdc", "Bons de commande", ShoppingCart, fBDC.length],
                    ["livraisons", "Livraisons (BL)", Truck, fBL.length],
                    ["factures", "Factures", FileText, fFAC.length],
                    ["historique", "Historique", History, fAudit.length],
                  ] as const).map(([id, label, Icon, count]) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4 overflow-x-auto">

                  {/* ── BDC Tab ── */}
                  {activeTab === "bdc" && (
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">N° BDC</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Date</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Articles</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Montant</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Statut</th>
                          <th className="pb-2 font-medium text-gray-500 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fBDC.length === 0 ? (
                          <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Aucun bon de commande</td></tr>
                        ) : fBDC.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-3 font-mono text-blue-700 text-xs font-bold">{o.reference}</td>
                            <td className="py-2.5 pr-3 text-gray-500 text-xs">{o.date}</td>
                            <td className="py-2.5 pr-3 text-gray-700 text-xs max-w-[140px] truncate" title={o.items}>{o.items}</td>
                            <td className="py-2.5 pr-3 text-gray-900 font-semibold text-xs whitespace-nowrap">{fmt(o.amount)}</td>
                            <td className="py-2.5 pr-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bdcStatusBadge(o.status)}`}>{o.status}</span>
                            </td>
                            <td className="py-2.5">
                              {(o.status === "Brouillon" || o.status === "En cours") && (
                                <button
                                  onClick={() => setSendBDCTarget(o)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                >
                                  <Send className="w-3 h-3" />
                                  Envoyer
                                </button>
                              )}
                              
                              {(o.status === "Validé" || o.status === "Confirmé" || o.status === "Livré") && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Eye className="w-3 h-3" />
                                  Consultation
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* ── BL Tab ── */}
                  {activeTab === "livraisons" && (
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">N° BL</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">BDC</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Date</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Articles</th>
                          <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Statut</th>
                          <th className="pb-2 font-medium text-gray-500 text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fBL.length === 0 ? (
                          <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Aucun bordereau de livraison</td></tr>
                        ) : fBL.map((d) => (
                          <tr key={d.reference} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-3 font-mono text-blue-700 text-xs font-bold">{d.reference}</td>
                            <td className="py-2.5 pr-3 text-gray-500 text-xs">{d.bdcRef}</td>
                            <td className="py-2.5 pr-3 text-gray-500 text-xs">{d.date}</td>
                            <td className="py-2.5 pr-3 text-gray-700 text-xs max-w-[140px] truncate" title={d.items}>{d.items}</td>
                            <td className="py-2.5 pr-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${blStatusBadge(d.status)}`}>{d.status}</span>
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => generateBLPdf(d, selectedF)}
                                  className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50 transition"
                                >
                                  <Download className="w-3 h-3" />
                                  PDF
                                </button>
                                {(d.status === "Complète" || d.status === "Partielle" || d.status === "En attente") && (
                                  <button
                                    onClick={() => setConformiteTarget(d)}
                                    className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                                  >
                                    <ClipboardCheck className="w-3 h-3" />
                                    Vérifier
                                  </button>
                                )}
                                {d.conformite && (
                                  <span title={d.conformite} className="cursor-help">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* ── Factures Tab ── */}
                  {activeTab === "factures" && (
                    <>
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Déposer une facture
                        </button>
                      </div>
                      <table className="w-full text-sm min-w-[520px]">
                        <thead>
                          <tr className="text-left border-b border-gray-200">
                            <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">N° Facture</th>
                            <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">BDC / BL</th>
                            <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Montant TTC</th>
                            <th className="pb-2 pr-3 font-medium text-gray-500 text-xs">Échéance</th>
                            <th className="pb-2 font-medium text-gray-500 text-xs">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fFAC.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">Aucune facture</td></tr>
                          ) : fFAC.map((inv) => (
                            <tr key={inv.reference} className="hover:bg-gray-50">
                              <td className="py-2.5 pr-3 font-mono text-blue-700 text-xs font-bold">
                               {inv.reference}
                                {inv.fileName && (
                                  <span className="ml-1 text-[10px] text-gray-400 font-normal font-sans">({inv.fileName})</span>
                                )}
                              </td>
                              <td className="py-2.5 pr-3 text-xs text-gray-500">
                                <div>{inv.bdcRef}</div>
                                {inv.blRef && <div className="text-gray-400">{inv.blRef}</div>}
                              </td>
                              <td className="py-2.5 pr-3 text-gray-900 font-semibold text-xs whitespace-nowrap">
                                {inv.amount > 0 ? fmt(inv.amount) : <span className="text-gray-400 font-normal">—</span>}
                              </td>
                              <td className="py-2.5 pr-3 text-gray-500 text-xs">{inv.dueDate}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${invStatusBadge(inv.status)}`}>{inv.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* ── Historique (audit) Tab ── */}
                  {activeTab === "historique" && (
                    <div className="space-y-2">
                      {fAudit.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                          <History className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                          Aucune action enregistrée pour ce fournisseur
                        </div>
                      ) : fAudit.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                            <History className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-800">{entry.action}</p>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(entry.timestamp).toLocaleString("fr-FR")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-500">Réf : <span className="font-mono text-blue-600">{entry.ref}</span></span>
                              <span className="text-xs text-gray-400">Opérateur : <strong className="text-gray-600">{user?.name ?? "—"}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
{/* ── Supplier Detail Modal ─────────────────────────────────────── */}
{showSupplierDetail && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
  {supplierDetail?.logo ? (
    <img
      src={supplierDetail.logo}
      alt={`Logo ${supplierDetail.name}`}
      className="w-full h-full object-contain p-1 bg-white"
    />
  ) : (
    <Building2 className="w-5 h-5 text-blue-700" />
  )}
</div>

          <div>
            <h3 className="font-semibold text-gray-900">
              Détail du fournisseur
            </h3>

            {supplierDetail && (
              <p className="text-xs text-gray-500 mt-0.5">
                {supplierDetail.name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setShowSupplierDetail(false);
            setSupplierDetail(null);
          }}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-5">

        {loadingSupplierDetail ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Chargement du fournisseur...
          </div>
        ) : supplierDetail ? (
          <div className="space-y-5">

            {/* Informations générales */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Informations générales
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-gray-400">
                    Raison sociale
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.name || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    NINEA
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.ninea || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    RCCM
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.rccm || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Statut
                  </p>
                  <span
                    className={`inline-flex mt-1 text-xs px-2 py-1 rounded-full font-medium ${
                      supplierDetail.status === "Actif"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {supplierDetail.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Téléphone
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.phone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.email || "—"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400">
                    Adresse
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.adresse || "—"}
                  </p>
                </div>

              </div>
            </div>

            {/* Contact principal */}
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Contact principal
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-gray-400">
                    Nom
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.contact || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Téléphone
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.contactPrincipalPhone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.contactPrincipalEmail || "—"}
                  </p>
                </div>

              </div>
            </div>

            {/* Conditions */}
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Conditions commerciales
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-gray-400">
                    Conditions de paiement
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.paymentTerms} jour
                    {supplierDetail.paymentTerms > 1 ? "s" : ""}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Devise
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {supplierDetail.currency || "—"}
                  </p>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            Aucun détail disponible.
          </div>
        )}

      </div>

      <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
        <button
          onClick={() => {
            setShowSupplierDetail(false);
            setSupplierDetail(null);
          }}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>

    </div>
  </div>
)}

{showSupplierForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div>
          <h2>
           {editingSupplierId ? "Modifier le fournisseur" : "Nouveau fournisseur"}
         </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Créer un nouveau fournisseur
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSupplierForm(false)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulaire */}
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

        {/* Informations fournisseur */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Informations du fournisseur
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Raison sociale *
              </label>
              <input
                type="text"
                value={supplierForm.raison_sociale}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    raison_sociale: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'entreprise"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                NINEA
              </label>
              <input
                type="text"
                value={supplierForm.ninea}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    ninea: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SN-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                RCCM
              </label>
              <input
                type="text"
                value={supplierForm.rccm}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    rccm: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Numéro RCCM"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    phone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+221 ..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="fournisseur@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Devise
              </label>
              <input
                type="text"
                value={supplierForm.currency}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    currency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <textarea
              value={supplierForm.address}
              onChange={(e) =>
                setSupplierForm({
                  ...supplierForm,
                  address: e.target.value,
                })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Adresse complète"
            />
          </div>
         <div className="mt-4">
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Logo du fournisseur
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setSupplierForm({
        ...supplierForm,
        logo: e.target.files?.[0] || null,
      })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
  />

  <p className="mt-1 text-xs text-gray-500">
    Facultatif — formats image uniquement.
  </p>

  {editingSupplierId &&
    suppliers.find((supplier) => supplier.id === editingSupplierId)?.logo && (
      <div className="mt-3">
        <p className="text-sm text-gray-600 mb-2">
          Logo actuel
        </p>

        <img
          src={
            suppliers.find(
              (supplier) => supplier.id === editingSupplierId
            )?.logo || ""
          }
          alt="Logo du fournisseur"
          className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-1"
        />
      </div>
    )}
</div>
        </div>

        {/* Contact principal */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Contact principal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nom du contact
              </label>
              <input
                type="text"
                value={supplierForm.contact_principal_nom}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    contact_principal_nom: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom et prénom"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Téléphone du contact
              </label>
              <input
                type="text"
                value={supplierForm.contact_principal_phone}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    contact_principal_phone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+221 ..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email du contact
              </label>
              <input
                type="email"
                value={supplierForm.contact_principal_email}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    contact_principal_email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Conditions de paiement (jours)
              </label>
              <input
                type="number"
                min="0"
                value={supplierForm.payment_terms}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    payment_terms: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={supplierForm.is_active}
            onChange={(e) =>
              setSupplierForm({
                ...supplierForm,
                is_active: e.target.checked,
              })
            }
            className="w-4 h-4"
          />

          <label className="text-sm text-gray-700">
            Fournisseur actif
          </label>
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">

        <button
          type="button"
          onClick={() => setShowSupplierForm(false)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-white transition"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleCreateSupplier}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {editingSupplierId
         ? "Enregistrer les modifications"
         : "Créer le fournisseur"}
        </button>


      </div>

    </div>
  </div>
)}
      {/* ── Upload Modal ──────────────────────────────────────────────── */}
      {showUploadModal && selectedF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Déposer une facture — {selectedF.name}
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Vous agissez au nom du fournisseur <strong>{selectedF.name}</strong>. Cette action sera tracée dans le journal d&apos;audit.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Référence BDC <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadBdcRef}
                  onChange={(e) => setUploadBdcRef(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner un BDC...</option>
                  {fBDC.map((b) => (
                   <option key={b.id} value={b.id}>
                    {b.reference} — {b.items.slice(0, 30)}
                   </option>
                 ))}
                  <option value="autre">Autre référence...</option>
                </select>
                {uploadBdcRef === "autre" && (
                  <input
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Saisir la référence BDC..."
                    onChange={(e) => setUploadBdcRef(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fichier facture <span className="text-red-500">*</span>
                </label>
                {!uploadFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileInput(f); }}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
                  >
                    <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Glissez ou cliquez pour sélectionner</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 Mo</p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileInput(f); }}
                    />
                  </div>
                ) : (
                  <div className="border border-green-300 bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{uploadFile.name}</p>
                          <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(1)} Ko</p>
                        </div>
                      </div>
                      <button onClick={() => setUploadFile(null)} className="p-1 hover:bg-red-100 rounded">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {uploading && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Envoi en cours...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadBdcRef(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadBdcRef || uploadBdcRef === "autre" || !uploadFile}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {uploading ? "Envoi..." : "Déposer la facture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conformité Modal ──────────────────────────────────────────── */}
      {conformiteTarget && (
        <ConformiteModal
          bl={conformiteTarget}
          onClose={() => setConformiteTarget(null)}
          onConfirm={handleConformite}
        />
      )}

      {/* ── Send BDC Modal ────────────────────────────────────────────── */}
      {sendBDCTarget && selectedF && (
        <SendBDCModal
          bdc={sendBDCTarget}
          fournisseurEmail={selectedF.email}
          onClose={() => setSendBDCTarget(null)}
          onConfirm={() => { handleSendBDC(); setSendBDCTarget(null); }}
        />
      )}
    </div>
  );
}
