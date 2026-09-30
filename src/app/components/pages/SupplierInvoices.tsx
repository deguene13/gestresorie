import { useEffect, useState } from "react";
import { Search, Upload, Eye, CheckCircle, XCircle, Trash2, X, FileText, UserCheck, Download, Printer, ArrowLeft, Plus, Lock, Unlock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { DocumentTemplate } from "../documents/DocumentTemplate";
import { RejectModal } from "../shared/RejectModal";
import { apiRequest } from "../../apiClient";

// ---------- types ----------
type InvoiceStatus =
  | "DRAFT"
  | "PENDING_ACCOUNTANT"
  | "PENDING_DAF"
  | "PENDING_DG"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELLED"
  | "PENDING_APPROVAL"
  | "PENDING_MATCHING"
  | "MATCHED"
  | "DISPUTED";

type Invoice = {
  id: string;
  reference: string;
  invoice_number: string;

  supplier: string;
  supplier_detail?: {
    id: string;
    raison_sociale: string;
    ninea?: string;
    email?: string;
  } | null;

  purchase_order?: string | null;
  purchase_order_reference?: string | null;

  delivery?: string | null;
  delivery_reference?: string | null;

  created_by?: string;
  created_by_detail?: {
    id: string;
    full_name: string;
  } | null;

  accountant_validated_by_detail?: {
    id: string;
    full_name: string;
  } | null;

  accountant_validated_at?: string | null;

  daf_approved_by_detail?: {
    id: string;
    full_name: string;
  } | null;

  daf_approved_at?: string | null;

  dg_approved_by_detail?: {
    id: string;
    full_name: string;
  } | null;

  dg_approved_at?: string | null;

  rejected_by_detail?: {
    id: string;
    full_name: string;
  } | null;

  rejected_at?: string | null;
  rejection_reason?: string | null;

  status: InvoiceStatus;

  invoice_date: string;
  due_date: string;
  currency: string;

  tva_percent: number | string;
  total_amount: number | string;

  amount_paid: number | string;
  balance_due: number | string;
  is_overdue: boolean;

  attachment?: string | null;
  notes?: string | null;

  matching_result?: any;
  matched_at?: string | null;
  matching_overridden: boolean;
  matching_override_reason?: string | null;

  lines: {
    id: string;
    product?: string | null;
    product_detail?: {
      id: string;
      code: string;
      name: string;
      unit?: string;
    } | null;
    designation?: string;
    quantity: number | string;
    unit_price: number | string;
    total_price: number | string;
  }[];

  created_at: string;
  updated_at: string;
};

type InvoiceItem = {
  id: number;
  designation: string;
  quantity: number;
  unitPrice: number;
};

// ---------- static data ----------
const SUPPLIER_DATA = [
  {
    ref: "FOUR-001", name: "Société ABC", bdcRef: "BDC-2024-158", blRef: "BL-F-2024-002",
    blDate: "2026-04-20",
    items: [
      { designation: "Chaises de bureau", qty: 20, unitPrice: 45000, total: 900000 },
      { designation: "Tables de réunion", qty: 5, unitPrice: 120000, total: 600000 },
    ],
    tvaRate: 18,
  },
  {
    ref: "FOUR-002", name: "Entreprise XYZ", bdcRef: "BDC-2024-157", blRef: "BL-F-2024-001",
    blDate: "2026-04-18",
    items: [
      { designation: "Imprimantes laser", qty: 5, unitPrice: 180000, total: 900000 },
      { designation: "Cartouches d'encre", qty: 30, unitPrice: 12000, total: 360000 },
    ],
    tvaRate: 18,
  },
  {
    ref: "FOUR-003", name: "Fournisseur GHI", bdcRef: "BDC-2024-156", blRef: "BL-F-2024-003",
    blDate: "2026-04-22",
    items: [
      { designation: "Ordinateurs portables", qty: 10, unitPrice: 650000, total: 6500000 },
    ],
    tvaRate: 18,
  },
];



const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-700",
  },
  PENDING_ACCOUNTANT: {
    label: "En attente Comptable",
    color: "bg-orange-100 text-orange-700",
  },
  PENDING_MATCHING: {
    label: "En attente rapprochement",
    color: "bg-yellow-100 text-yellow-700",
  },
  MATCHED: {
    label: "Rapprochée",
    color: "bg-cyan-100 text-cyan-700",
  },
  PENDING_DAF: {
    label: "En attente DAF",
    color: "bg-blue-100 text-blue-700",
  },
  PENDING_DG: {
    label: "En attente DG",
    color: "bg-indigo-100 text-indigo-700",
  },
  PENDING_APPROVAL: {
    label: "En attente approbation",
    color: "bg-indigo-100 text-indigo-700",
  },
  APPROVED: {
    label: "Approuvée",
    color: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "Rejetée",
    color: "bg-red-100 text-red-700",
  },
  PAID: {
    label: "Payée",
    color: "bg-purple-100 text-purple-700",
  },
  CANCELLED: {
    label: "Annulée",
    color: "bg-gray-100 text-gray-700",
  },
  DISPUTED: {
    label: "En litige",
    color: "bg-red-100 text-red-700",
  },
};

const getDueDateStatus = (dueDate: string, isPaid: boolean) => {
  if (isPaid) return { color: "bg-green-500", label: "Payée", textColor: "text-green-700" };
  const days = Math.floor((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { color: "bg-red-500", label: "Dépassée", textColor: "text-red-700" };
  if (days <= 7) return { color: "bg-orange-500", label: "Proche", textColor: "text-orange-700" };
  return { color: "bg-gray-300", label: "À venir", textColor: "text-gray-500" };
};

export function SupplierInvoices() {
  const { lang, t } = useLanguage();
  const { autoInvoices, updateInvoiceStatus, addNotification } = useAppData();
  const { hasPermission, hasRole } = useAuth();

  // RBAC
  const canCreate =
  hasPermission("supplier_invoices:create") ||
  hasPermission("supplier_invoices:manage");

const canEdit =
  hasPermission("supplier_invoices:manage");

const canValidateStep1 =
  hasRole(["comptable", "admin"]);

const canValidateStep2 =
  hasRole(["daf", "admin"]);

const canValidateStep3 =
  hasRole(["dg", "admin"]);

const canReject =
  hasRole([
    "daf",
    "comptable",
    "dg",
    "admin",
  ]);

const canDelete =
  hasRole(["admin"]);

const isViewOnly =
  !canCreate &&
  !canValidateStep1 &&
  !canValidateStep2 &&
  !canValidateStep3;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [validatedDeliveries, setValidatedDeliveries] = useState<any[]>([]);
  const [invoicedDeliveryIds, setInvoicedDeliveryIds] = useState<string[]>([]);
const mapDjangoInvoice = (invoice: any): Invoice => {
  console.log("=== DONNÉES REJET FACTURE DJANGO ===", {
  id: invoice.id,
  status: invoice.status,
  rejection_reason: invoice.rejection_reason,
  rejected_by_detail: invoice.rejected_by_detail,
  rejected_at: invoice.rejected_at,
});
  return {
    id: invoice.id,
    reference: invoice.reference,
    invoice_number: invoice.invoice_number,

    supplier:
      invoice.supplier_detail?.raison_sociale ||
      invoice.supplier ||
      "—",

    supplier_detail: invoice.supplier_detail,

    purchase_order: invoice.purchase_order,
    purchase_order_reference: invoice.purchase_order_reference,

    delivery: invoice.delivery,
    delivery_reference: invoice.delivery_reference,

    created_by: invoice.created_by,
    created_by_detail: invoice.created_by_detail,

    accountant_validated_by_detail:
      invoice.accountant_validated_by_detail,

    accountant_validated_at:
      invoice.accountant_validated_at,

    daf_approved_by_detail:
      invoice.daf_approved_by_detail,

    daf_approved_at:
      invoice.daf_approved_at,

    dg_approved_by_detail:
      invoice.dg_approved_by_detail,

    dg_approved_at:
      invoice.dg_approved_at,

    rejected_by_detail:
      invoice.rejected_by_detail,

    rejected_at:
      invoice.rejected_at,

    rejection_reason:
      invoice.rejection_reason,

    status: invoice.status,

    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    currency: invoice.currency,

    tva_percent: Number(invoice.tva_percent || 0),
    total_amount: Number(invoice.total_amount || 0),

    amount_paid: Number(invoice.amount_paid || 0),
    balance_due: Number(invoice.balance_due || 0),

    is_overdue: Boolean(invoice.is_overdue),

    attachment: invoice.attachment,
    notes: invoice.notes,

    matching_result: invoice.matching_result,
    matched_at: invoice.matched_at,

    matching_overridden:
      Boolean(invoice.matching_overridden),

    matching_override_reason:
      invoice.matching_override_reason,

    lines: (invoice.lines || []).map((line: any) => ({
      id: line.id,
      product: line.product,
      product_detail: line.product_detail,

      designation:
        line.designation ||
        line.product_detail?.name ||
        "—",

      quantity: Number(line.quantity || 0),
      unit_price: Number(line.unit_price || 0),
      total_price: Number(line.total_price || 0),
    })),

    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  };
};


 useEffect(() => {
  const loadSupplierInvoices = async () => {
    try {
      console.log("=== CHARGEMENT FACTURES FOURNISSEURS DJANGO ===");

      const data = await apiRequest(
  `/v1/invoices/supplier/?page=${currentPage}`
);

      console.log("=== RÉPONSE DJANGO FACTURES FOURNISSEURS ===");
      console.log(data);
      setTotalPages(
  data.count ? Math.ceil(data.count / 20) : 1
);
console.log(
  "=== PAGINATION FACTURES ===",
  "count =", data.count,
  "totalPages =", data.count ? Math.ceil(data.count / 20) : 1,
  "currentPage =", currentPage
);
      
const factureTest = data.results?.find(
  (invoice: any) =>
    invoice.id === "a0153e0f-201d-4d3a-b298-3ee6a3e272ec"
);

console.log("=== FACTURE À ANALYSER ===");

console.log("=== FACTURE À ANALYSER ===");
console.log("ID :", factureTest?.id);
console.log("Référence :", factureTest?.reference);
console.log("Numéro facture :", factureTest?.invoice_number);
console.log("Sous-total :", factureTest?.subtotal);
console.log("TVA % :", factureTest?.tva_percent);
console.log("Montant TVA :", factureTest?.tva_amount);
console.log("Total :", factureTest?.total_amount);
console.log("BDC :", factureTest?.purchase_order_reference);
console.log("BL :", factureTest?.delivery_reference);
console.log("Lignes :", factureTest?.lines);
console.table(factureTest?.lines);
      const results = Array.isArray(data)
        ? data
        : data?.results ?? [];

      console.log("=== FACTURES REÇUES ===", results.length);
      console.log(results);

      const djangoInvoices = results.map(mapDjangoInvoice);

      console.log("=== FACTURES MAPPÉES FRONTEND ===");
      console.log(djangoInvoices);

      setInvoices(djangoInvoices);

    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT FACTURES FOURNISSEURS ===",
        error
      );
    }
  };

  loadSupplierInvoices();
}, [currentPage]);

useEffect(() => {
  const loadSuppliers = async () => {
    try {
      console.log("=== CHARGEMENT FOURNISSEURS DJANGO ===");

      const data = await apiRequest("/v1/suppliers/");

      const results = Array.isArray(data)
        ? data
        : data?.results ?? [];

      console.log("=== FOURNISSEURS CHARGÉS ===");
      console.log(results);

      setSuppliers(results);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT FOURNISSEURS ===",
        error
      );
    }
  };

  loadSuppliers();
}, []);

useEffect(() => {
  const loadValidatedDeliveries = async () => {
    try {
      console.log("=== CHARGEMENT BL VALIDÉS DJANGO ===");

      const data = await apiRequest("/v1/deliveries/");

      const results = Array.isArray(data)
        ? data
        : data?.results ?? [];

      console.log("=== TOUS LES BL ===");
      console.log(results);

      const validated = results.filter(
        (delivery: any) =>
          delivery.status === "VALIDATED" ||
          delivery.status === "COMPLETED"
      );

      console.log("=== BL VALIDÉS ===");
      console.log(validated);

      setValidatedDeliveries(validated);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT BL VALIDÉS ===",
        error
      );
    }
  };

  loadValidatedDeliveries();
}, []);

useEffect(() => {
  const loadInvoicedDeliveries = async () => {
    try {
      console.log("=== CHARGEMENT BL DÉJÀ FACTURÉS ===");

      const data = await apiRequest("/v1/invoices/supplier/");

      const results = Array.isArray(data)
        ? data
        : data?.results ?? [];

      console.log("=== FACTURES EXISTANTES ===");
      console.log(results);

      const deliveryIds = results
        .map((invoice: any) => invoice.delivery)
        .filter(Boolean);

      console.log("=== BL DÉJÀ FACTURÉS ===");
      console.log(deliveryIds);

      setInvoicedDeliveryIds(deliveryIds);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT BL DÉJÀ FACTURÉS ===",
        error
      );
    }
  };

  loadInvoicedDeliveries();
}, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState<{ invoiceId: string; ref: string } | null>(null);

  // Track which auto-invoice IDs have been deleted locally
  const [deletedAutoIds, setDeletedAutoIds] = useState<Set<string>>(new Set());
  // Track extra fields (validatedBy, validatedAt, rejectedReason) for auto-invoices
  const [autoOverrides, setAutoOverrides] = useState<Record<string, Partial<Invoice>>>({});

  const today = new Date().toISOString().split("T")[0];

  // Form state
  const [selectedSupplierRef, setSelectedSupplierRef] = useState<string>("");
 const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<string>("");
const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");

  const [formLocked, setFormLocked] = useState(false);
  const [formData, setFormData] = useState({
  supplier: "",
  supplierRef: "",
  bdcRef: "",
  blRef: "",
  invoiceNumber: "",
  issueDate: today,
  dueDate: "",
  tvaRate: 18,
});

  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { id: 1, designation: "", quantity: 1, unitPrice: 0 },
  ]);
  useEffect(() => {
  console.log("=== FORM ITEMS STATE ===");
  console.log(JSON.stringify(formItems, null, 2));
}, [formItems]);

  // Merge auto-generated supplier invoices
 
 const allInvoices = invoices;

  const filteredInvoices = allInvoices.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  

  // Form calculations
  const calcSubtotal = () => formItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const calcTVA = () => calcSubtotal() * (formData.tvaRate / 100);
  const calcTotal = () => calcSubtotal() + calcTVA();

  const handleAddFormItem = () => {
    setFormItems([...formItems, { id: Date.now(), designation: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveFormItem = (id: number) => {
    if (formItems.length > 1) setFormItems(formItems.filter(i => i.id !== id));
  };

  const handleFormItemChange = (id: number, field: string, value: any) => {
    setFormItems(formItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const handleDeliverySelect = async (deliveryId: string) => {
  console.log("=== BL SÉLECTIONNÉ ===");
  console.log("BL ID :", deliveryId);

  setSelectedDeliveryId(deliveryId);

  if (!deliveryId) {
    setSelectedPurchaseOrderId("");
    setSelectedSupplierRef("");
    setFormLocked(false);

    setFormData((prev) => ({
      ...prev,
      supplier: "",
      supplierRef: "",
      bdcRef: "",
      blRef: "",
    }));

    setFormItems([
      {
        id: 1,
        designation: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);

    return;
  }

  const delivery = validatedDeliveries.find(
    (item: any) => item.id === deliveryId
  );

  if (!delivery) {
    console.error("=== BL INTROUVABLE ===");
    return;
  }

  console.log("=== BL TROUVÉ ===");
  console.log(delivery);

  setSelectedSupplierRef(delivery.supplier || "");
  setSelectedPurchaseOrderId(delivery.purchase_order || "");

 setFormData((prev) => ({
  ...prev,
  supplier:
    delivery.supplier_detail?.raison_sociale ||
    delivery.supplier ||
    "",
  supplierRef:
    delivery.supplier_detail?.ninea ||
    "",
  bdcRef:
    delivery.purchase_order_reference ||
    "",
  blRef:
    delivery.reference ||
    "",
  invoiceNumber: generateInvoiceNumber(
  delivery.reference || ""
),
}));

  const deliveryItems = (delivery.items || []).map(
    (item: any, index: number) => ({
      id: index + 1,
      designation:
        item.product_detail?.name ||
        item.designation ||
        "",
      quantity: Number(item.quantity_received || 0),
      unitPrice: Number(
        item.product_detail?.unit_price ||
        item.unit_price ||
        0
      ),
    })
  );

  console.log("=== ARTICLES DU BL ===");
  console.log(deliveryItems);

  setFormItems(
    deliveryItems.length > 0
      ? deliveryItems
      : [
          {
            id: 1,
            designation: "",
            quantity: 1,
            unitPrice: 0,
          },
        ]
  );

  setFormLocked(true);
};

  // Supplier auto-fill
const handleSupplierSelect = async (id: string) => {

  setSelectedSupplierRef(id);

  if (!id) {
    setFormLocked(false);

    setFormData(prev => ({
      ...prev,
      supplier: "",
      supplierRef: "",
      bdcRef: "",
      blRef: "",
    }));

    setFormItems([
      {
        id: 1,
        designation: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);

    return;
  }

  const supplier = suppliers.find(
    (item: any) => item.id === id
  );
  console.log("=== CHARGEMENT LIVRAISONS DU FOURNISSEUR ===");

const deliveriesResponse = await apiRequest(
  "/v1/deliveries/"
);

const deliveries = Array.isArray(deliveriesResponse)
  ? deliveriesResponse
  : deliveriesResponse?.results ?? [];

console.log("=== LIVRAISONS DJANGO ===");
console.log(deliveries);

console.log("=== FOURNISSEURS DE TOUS LES BL ===");

deliveries.forEach((delivery: any, index: number) => {
  console.log(
    index,
    "| BL :", delivery.reference,
    "| supplier :", delivery.supplier,
    "| supplier_detail :",
    delivery.supplier_detail?.raison_sociale
  );
});
console.log("=== FOURNISSEUR SÉLECTIONNÉ ===");
console.log("ID :", id);

console.log("=== PREMIER BL DJANGO ===");
console.log(deliveries[0]);

console.log("=== SUPPLIER DU PREMIER BL ===");
console.log(deliveries[0]?.supplier);

console.log("=== SUPPLIER DETAIL DU PREMIER BL ===");
console.log(deliveries[0]?.supplier_detail);
console.log("=== ENTREPRISE DU PREMIER BL ===");
console.log("BL company :", deliveries[0]?.company);
console.log("BL company_detail :", deliveries[0]?.company_detail);
const supplierDeliveries = deliveries.filter(
  (delivery: any) => delivery.supplier === id
);

console.log("=== BL DU FOURNISSEUR SÉLECTIONNÉ ===");
console.log(supplierDeliveries);

if (supplierDeliveries.length === 0) {
  console.warn("=== AUCUN BL TROUVÉ POUR CE FOURNISSEUR ===");

  setSelectedDeliveryId("");
  setSelectedPurchaseOrderId("");

  return;
}

const delivery = supplierDeliveries[0];

setSelectedDeliveryId(delivery.id);

console.log("=== BL SÉLECTIONNÉ ===");
console.log(delivery);

console.log("=== BL SÉLECTIONNÉ ===");
console.log(delivery);
console.log("=== CHARGEMENT BDC ASSOCIÉ ===");

const purchaseOrderResponse = await apiRequest(
  `/v1/purchase-orders/${delivery.purchase_order}/`
);

console.log("=== BDC ASSOCIÉ AU BL ===");
console.log(purchaseOrderResponse);
setSelectedPurchaseOrderId(purchaseOrderResponse.id);
console.log("=== REFERENCE BDC ===", purchaseOrderResponse.reference);
console.log("=== REFERENCE BL ===", delivery.reference);

setFormData((prev) => ({
  ...prev,
  supplier: supplier.raison_sociale || "",
  supplierRef: supplier.ninea || "",
  bdcRef: purchaseOrderResponse.reference || "",
  blRef: delivery.reference || "",
}));

console.log("=== FORM DATA APRÈS REMPLISSAGE ===");
console.log({
  supplier: supplier.raison_sociale,
  supplierRef: supplier.ninea,
  bdcRef: purchaseOrderResponse.reference,
  blRef: delivery.reference,
});
console.log("=== ARTICLES DU BDC ===");
console.log(JSON.stringify(purchaseOrderResponse.items, null, 2));

const bdcItems = purchaseOrderResponse.items || [];

console.log("=== FORM ITEMS À ENVOYER ===");

const newFormItems = bdcItems.map((item: any, index: number) => ({
  id: index + 1,
  designation: item.product_detail?.name || item.designation || "",
  quantity: Number(item.quantity || 0),
  unitPrice: Number(item.unit_price || 0),
}));

console.log(newFormItems);

setFormItems(newFormItems);
console.log("=== setFormItems EXÉCUTÉ ===");
console.log(newFormItems);
  console.log("=== FOURNISSEUR SÉLECTIONNÉ ===");
  console.log(JSON.stringify(supplier, null, 2));

  if (!supplier) {
    console.error(
      "=== FOURNISSEUR INTROUVABLE ===",
      id
    );
    return;
  }

  
 
  setFormLocked(true);
};


const generateInvoiceNumber = (deliveryReference: string) => {
  const blNumber = deliveryReference.replace("BL-", "");

  return `FAC-${blNumber}`;
};
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log("=== CRÉATION FACTURE FOURNISSEUR ===");

  if (!formData.dueDate) {
    alert("Veuillez renseigner la date d'échéance.");
    return;
  }

  if (formData.dueDate < formData.issueDate) {
    alert(
      "La date d'échéance ne peut pas être antérieure à la date de facture."
    );
    return;
  }
   console.log("=== RECHERCHE FOURNISSEUR DJANGO ===");
console.log("Nom recherché :", formData.supplier);

const suppliersResponse = await apiRequest(
  "/v1/suppliers/"
);

const suppliers = Array.isArray(suppliersResponse)
  ? suppliersResponse
  : suppliersResponse?.results ?? [];

console.log("=== FOURNISSEURS DJANGO ===");
console.log(suppliers);

const djangoSupplier = suppliers.find(
  (supplier: any) => supplier.id === selectedSupplierRef
);

console.log("=== FOURNISSEUR DJANGO TROUVÉ ===");
console.log(djangoSupplier);

const lines = formItems.map((item) => ({
  designation: item.designation,
  quantity: Number(item.quantity),
  unit_price: Number(item.unitPrice),
}));
const hasInvalidQuantity = lines.some(
  (line) => line.quantity <= 0
);

if (hasInvalidQuantity) {
  alert(
    "Impossible de créer la facture : une ou plusieurs lignes ont une quantité reçue nulle."
  );
  return;
}

console.log("=== LIGNES FACTURE DJANGO ===");
console.log(lines);


console.log("Fournisseur :", {
  id: selectedSupplierRef,
  raison_sociale: djangoSupplier?.raison_sociale,
  entreprise: djangoSupplier?.company,
  entreprise_detail: djangoSupplier?.company_detail,
});

console.log("=== VÉRIFICATION RESSOURCES FACTURE ===");
console.log("Fournisseur ID :", selectedSupplierRef);
console.log("BDC ID :", selectedPurchaseOrderId);
console.log("BL ID :", selectedDeliveryId);
console.log("Fournisseur Django :", djangoSupplier);

const payload = {
  invoice_number: formData.invoiceNumber,
  supplier: selectedSupplierRef,
  purchase_order: selectedPurchaseOrderId,
  delivery: selectedDeliveryId,
  invoice_date: formData.issueDate,
  due_date: formData.dueDate,
  currency: djangoSupplier?.currency || "XOF",
  tva_percent: formData.tvaRate,
  notes: "",
  lines: lines,
};

console.log("=== PAYLOAD FACTURE DJANGO ===");
console.log(JSON.stringify(payload, null, 2));
console.log("=== ID BDC ENVOYÉ ===", selectedPurchaseOrderId);
console.log("=== ID BL ENVOYÉ ===", selectedDeliveryId);
  const totalTTC = calcTotal();

  console.log("Total TTC :", totalTTC);
  console.log("Formulaire :", formData);
  console.log("Lignes :", formItems);
try {
  console.log("=== PAYLOAD FACTURE FOURNISSEUR ===");
console.log(JSON.stringify(payload, null, 2));

console.log("=== IDS UTILISÉS ===");
console.log("supplier :", selectedSupplierRef);
console.log("purchase_order :", selectedPurchaseOrderId);
console.log("delivery :", selectedDeliveryId);

  const response = await apiRequest(
    "/v1/invoices/supplier/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  console.log("=== FACTURE CRÉÉE DANS DJANGO ===");

console.log(response);

const refreshedData = await apiRequest("/v1/invoices/supplier/");

console.log("=== FACTURES EXISTANTES APRÈS RECHARGEMENT ===");
console.log(refreshedData);

const refreshedResults = Array.isArray(refreshedData)
  ? refreshedData
  : refreshedData?.results ?? [];

const refreshedInvoices = refreshedResults.map(mapDjangoInvoice);

console.log("=== FACTURES APRÈS CRÉATION ===");
console.log(refreshedInvoices);

setInvoices(refreshedInvoices);
} catch (error) {
  console.error("=== ERREUR CRÉATION FACTURE DJANGO ===");
  console.error(error);
}

};
  const resetForm = () => {
    setSelectedSupplierRef("");
    setFormLocked(false);
   setFormData({
  supplier: "",
  supplierRef: "",
  bdcRef: "",
  blRef: "",
  invoiceNumber: "",
  issueDate: today,
  dueDate: "",
  tvaRate: 18
});
   
  };

  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleViewDocument = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDocumentPreview(true);
  };

  const handleDownloadPDF = () => {
    const printContent = document.getElementById("document-content");
    if (!printContent) return;
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Facture Fournisseur - ${selectedInvoice?.id}</title><style>body{margin:0;padding:0;font-family:Arial,sans-serif;}@media print{@page{size:A4;margin:0;}}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  const handlePrint = () => { window.print(); };

  const getDocumentData = () => {
  if (!selectedInvoice) return null;

  // Conversion des lignes Django vers le format
  // attendu par DocumentTemplate
  const documentItems = selectedInvoice.lines.map((line) => ({
    designation: line.designation || "—",
    quantity: Number(line.quantity || 0),
    unitPrice: Number(line.unit_price || 0),
    total: Number(line.total_price || 0),
  }));

  const subtotal = documentItems.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const tvaRate = Number(selectedInvoice.tva_percent || 0);

  const tvaAmount =
    subtotal * (tvaRate / 100);

  const total =
  Number(selectedInvoice.total_amount || 0);

console.log("=== MONTANTS FACTURE ===");
console.table(documentItems);
console.log("Sous-total :", subtotal);
console.log("TVA rate :", tvaRate);
console.log("TVA :", tvaAmount);
console.log("Total Django :", selectedInvoice.total_amount);
console.log("Total final :", total);

return {
    type: "Facture" as const,

    number:
      selectedInvoice.invoice_number ||
      selectedInvoice.reference ||
      selectedInvoice.id,

    date: selectedInvoice.invoice_date,

    clientName: selectedInvoice.supplier,

    clientAddress: "",

    clientPhone: "",

    items: documentItems,

    subtotal,

    tvaRate,

    tvaAmount,

    total,

    isPaid:
      selectedInvoice.status === "PAID",

    notes:
      `BDC: ${
        selectedInvoice.purchase_order_reference || "—"
      } | BL: ${
        selectedInvoice.delivery_reference || "—"
      }`,
  };
};
  // ---------- action handlers ----------

// ---------- action handlers ----------
const handleValidate = async (invoiceId: string) => {
  try {
    console.log("=== VALIDATION COMPTABLE ===");
    console.log("Invoice ID :", invoiceId);

    const invoice = invoices.find(
      (item) => item.id === invoiceId
    );

    console.log("=== FACTURE À VALIDER ===");
    console.log(invoice);

    console.log("=== ID FACTURE ===", invoice?.id);
    console.log(
      "=== BDC ID ===",
      invoice?.purchase_order
    );
    console.log(
      "=== BL ID ===",
      invoice?.delivery
    );
    console.log(
      "=== FOURNISSEUR ID ===",
      invoice?.supplier
    );
    console.log("=== LIGNES FACTURE ===", invoice?.lines);
    const purchaseOrder = await apiRequest(
  `/v1/purchase-orders/${invoice?.purchase_order}/`
);

console.log("=== BDC CORRESPONDANT ===");
console.log(purchaseOrder);

console.log(
  "=== MONTANT BDC ===",
  purchaseOrder?.total_amount
);

console.log(
  "=== TVA BDC ===",
  purchaseOrder?.tva_percent
);

console.log(
  "=== LIGNES BDC ===",
  purchaseOrder?.items
);

invoice?.lines?.forEach((line: any, index: number) => {
  console.log(`=== LIGNE FACTURE ${index + 1} ===`);
  console.log("Désignation :", line.designation);
  console.log("Quantité :", line.quantity);
  console.log("Prix unitaire :", line.unit_price);
  console.log("Produit :", line.product);
  console.log("Détail produit :", line.product_detail);
});

    const response = await apiRequest(
      `/v1/invoices/supplier/${invoiceId}/validate-accountant/`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: "",
        }),
      }
    );

    console.log("=== RÉPONSE VALIDATION COMPTABLE ===");
    console.log(response);

    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId
          ? mapDjangoInvoice(response)
          : invoice
      )
    );

    setSelectedInvoice(null);
    setShowDetailModal(false);
  } catch (error) {
    console.error(
      "=== ERREUR VALIDATION COMPTABLE ===",
      error
    );

    alert("Erreur lors de la validation Comptable.");
  }
};


const handleApproveDaf = async (invoiceId: string) => {
  try {
    console.log("=== APPROBATION DAF ===");
    console.log("Invoice ID :", invoiceId);

    const response = await apiRequest(
      `/v1/invoices/supplier/${invoiceId}/approve-daf/`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: "",
        }),
      }
    );

    console.log("=== RÉPONSE APPROBATION DAF ===");
    console.log(response);

    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId
          ? mapDjangoInvoice(response)
          : invoice
      )
    );

    setSelectedInvoice(null);
    setShowDetailModal(false);
  } catch (error) {
    console.error(
      "=== ERREUR APPROBATION DAF ===",
      error
    );

    alert("Erreur lors de l'approbation DAF.");
  }
};

 const handleApprove = async (invoiceId: string) => {
  const invoice = allInvoices.find(
    (inv) => inv.id === invoiceId
  );

  if (!invoice) return;

  if (invoice.status !== "PENDING_DG") {
    alert(
      "Cette facture doit d'abord être approuvée par le DAF."
    );
    return;
  }

  try {
    console.log("=== APPROBATION DG ===");
    console.log("Invoice ID :", invoiceId);

    const response = await apiRequest(
      `/v1/invoices/supplier/${invoiceId}/approve-dg/`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: "",
        }),
      }
    );

    console.log("=== RÉPONSE APPROBATION DG ===");
    console.log(response);

    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId
          ? mapDjangoInvoice(response)
          : invoice
      )
    );

    setSelectedInvoice(null);
    setShowDetailModal(false);
  } catch (error) {
    console.error(
      "=== ERREUR APPROBATION DG ===",
      error
    );

    alert("Erreur lors de l'approbation DG.");
  }
};

 const handleReject = async (
  invoiceId: string,
  motif: string
) => {
  try {
    console.log("=== REJET FACTURE ===");
    console.log("Invoice ID :", invoiceId);
    console.log("Motif :", motif);

    const response = await apiRequest(
      `/v1/invoices/supplier/${invoiceId}/reject/`,
      {
        method: "POST",
        body: JSON.stringify({
          reason: motif,
        }),
      }
    );

    console.log("=== RÉPONSE REJET DJANGO ===");
    console.log(response);

    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId
          ? mapDjangoInvoice(response)
          : invoice
      )
    );

    setRejectModal(null);
    setSelectedInvoice(null);
    setShowDetailModal(false);
  } catch (error) {
    console.error(
      "=== ERREUR REJET FACTURE ===",
      error
    );

    alert("Erreur lors du rejet de la facture.");
  }
};
  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.supplierInvoices.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.supplierInvoices.subtitle[lang]}</p>
        </div>
        <div className="flex gap-3">
          {isViewOnly && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Eye className="w-4 h-4" />
              Mode consultation uniquement
            </div>
          )}
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle facture
            </button>
          )}
        </div>
      </div>

      {/* Workflow Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Workflow de validation</h3>
            <p className="text-sm text-blue-700">
            <span className="font-medium">Étape 1:</span> Le Comptable valide →{" "}
            <span className="font-medium">Étape 2:</span> Le DAF approuve →{" "}
            <span className="font-medium">Étape 3:</span> Le DG approuve
         </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une facture..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total des factures</div>
          <div className="text-2xl text-gray-900">{allInvoices.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Montant total</div>
          <div className="text-2xl text-gray-900">
            {allInvoices
             .reduce(
             (sum, inv) => sum + Number(inv.total_amount || 0),
                 0
             )
              .toLocaleString()} FCFA
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">En attente Comptable</div>
          <div className="text-2xl text-cyan-600">
            {allInvoices.filter((i) => i.status === "PENDING_ACCOUNTANT").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Validées Comptable</div>
          <div className="text-2xl text-blue-600">
            {allInvoices.filter((i) => i.status === "PENDING_DAF").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Approuvées DG</div>
          <div className="text-2xl text-green-600">
            {allInvoices.filter((i) => i.status === "APPROVED").length}
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">N° Facture</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Réf. BDC / BL</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Montant TTC</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewDetails(invoice)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoice_number || invoice.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                   {invoice.purchase_order_reference || "—"} /{" "}
                    {invoice.delivery_reference || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {Number(invoice.total_amount || 0).toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                         getDueDateStatus(
                        invoice.due_date,
                        invoice.status === "PAID"
                        ).color
                          }`}
                         />
                      <span
                         className={`text-sm ${
                         getDueDateStatus(
                         invoice.due_date,
                         invoice.status === "PAID"
                         ).textColor
                           }`}
                       >
                        {new Date(invoice.due_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 text-xs rounded-full ${statusConfig[invoice.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-700"}`}>
                        {statusConfig[invoice.status as keyof typeof statusConfig]?.label ?? invoice.status}
                      </span>
                      
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
  <button
    onClick={() => handleViewDocument(invoice)}
    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
    title="Aperçu document"
  >
    <FileText className="w-4 h-4" />
  </button>

  {canValidateStep1 && invoice.status === "PENDING_ACCOUNTANT" && (
    <button
      onClick={() => handleValidate(invoice.id)}
      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition"
      title="Valider (Comptable)"
    >
      <UserCheck className="w-4 h-4" />
    </button>
  )}

  {canValidateStep2 && invoice.status === "PENDING_DAF" && (
    <button
      onClick={() => handleApproveDaf(invoice.id)}
      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
      title="Approuver (DAF)"
    >
      <CheckCircle className="w-4 h-4" />
    </button>
  )}

  {canValidateStep3 && invoice.status === "PENDING_DG" && (
    <button
      onClick={() => handleApprove(invoice.id)}
      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
      title="Approuver (DG)"
    >
      <CheckCircle className="w-4 h-4" />
    </button>
  )}

 {canReject &&
  invoice.status !== "APPROVED" &&
  invoice.status !== "PAID" &&
  invoice.status !== "CANCELLED" &&
  invoice.status !== "REJECTED" && (
      <button
        onClick={() =>
          setRejectModal({
            invoiceId: invoice.id,
            ref: invoice.reference,
          })
        }
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        title="Rejeter"
      >
        <XCircle className="w-4 h-4" />
      </button>
    )}
</div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    Aucune facture trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-4 p-4 border border-gray-200">

  <button
    onClick={() => setCurrentPage((page) => page - 1)}
    disabled={currentPage === 1}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Précédent
  </button>

  <span className="font-bold">
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
      </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
         <div className="bg-white rounded-xl max-w-3xl w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900">Nouvelle facture fournisseur</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Supplier selector */}
              <div>
               <label className="block text-sm text-gray-700 mb-1">
                 Référence BL
             </label>
                <div className="flex gap-2">
                 <select
  value={selectedDeliveryId}
  onChange={(e) => handleDeliverySelect(e.target.value)}
  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
>
  <option value="">— Choisir un BL validé —</option>

  {validatedDeliveries
  .filter(
    (delivery: any) =>
      !invoicedDeliveryIds.includes(delivery.id)
  )
  .map((delivery: any) => (
    <option key={delivery.id} value={delivery.id}>
      {delivery.reference}
    </option>
  ))}
</select>
                  {formLocked && (
                    <button
                      type="button"
                      onClick={() => setFormLocked(false)}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                      title="Modifier les champs"
                    >
                      <Unlock className="w-4 h-4" />
                      Modifier
                    </button>
                  )}
                </div>
                {formLocked && (
                  <p className="mt-1 text-xs text-blue-600">Champs pré-remplis depuis le fournisseur sélectionné. Cliquez sur "Modifier" pour éditer manuellement.</p>
                )}
              </div>

              {/* Supplier info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Fournisseur *</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                    placeholder="Nom du fournisseur"
                    readOnly={formLocked}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Référence fournisseur</label>
                  <input
                    type="text"
                    value={formData.supplierRef}
                    onChange={(e) => setFormData({ ...formData, supplierRef: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                    placeholder="Réf. interne fournisseur"
                    readOnly={formLocked}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Référence BDC</label>
                  <input
                    type="text"
                    value={formData.bdcRef}
                    onChange={(e) => setFormData({ ...formData, bdcRef: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                    placeholder="Ex: BDC-2024-160"
                    readOnly={formLocked}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Référence BL</label>
                  <input
                    type="text"
                    value={formData.blRef}
                    onChange={(e) => setFormData({ ...formData, blRef: e.target.value })}
                   className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                    placeholder="Ex: BL-2024-340"
                    readOnly={formLocked}
                  />
                  
                </div>
                <div>
  <label className="block text-sm text-gray-700 mb-1">
    N° facture fournisseur
  </label>
  <input
    type="text"
    value={formData.invoiceNumber}
    onChange={(e) =>
      setFormData({ ...formData, invoiceNumber: e.target.value })
    }
    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
      formLocked ? "bg-gray-50 text-gray-500" : ""
    }`}
    placeholder="Ex: FAC-FOUR-2026-001"
    readOnly={formLocked}
  />
</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date de facture *</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date d'échéance *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">TVA %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tvaRate}
                    onChange={(e) => setFormData({ ...formData, tvaRate: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                    readOnly={formLocked}
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Lignes de facture *</label>
                  {!formLocked && (
                    <button
                      type="button"
                      onClick={handleAddFormItem}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une ligne
                    </button>
                  )}
                </div>
                <div className="border border-gray-300 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-200">
                    <div className="col-span-5 text-xs text-gray-500 uppercase">Désignation</div>
                    <div className="col-span-2 text-xs text-gray-500 uppercase">Quantité</div>
                    <div className="col-span-3 text-xs text-gray-500 uppercase">Prix HT</div>
                    <div className="col-span-2 text-xs text-gray-500 uppercase">Total</div>
                  </div>
                  {formItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Désignation"
                        value={item.designation}
                        onChange={(e) => handleFormItemChange(item.id, "designation", e.target.value)}
                        className={`col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                        readOnly={formLocked}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qté"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleFormItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                        className={`col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                        readOnly={formLocked}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Prix unitaire"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleFormItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className={`col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 ${formLocked ? "bg-gray-50 text-gray-500" : ""}`}
                        readOnly={formLocked}
                        required
                      />
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm text-gray-900">{(item.quantity * item.unitPrice).toLocaleString()}</span>
                        {!formLocked && formItems.length > 1 && (
                          <button type="button" onClick={() => handleRemoveFormItem(item.id)} className="text-red-500 hover:text-red-700 ml-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total HT :</span>
                  <span className="text-gray-900">{calcSubtotal().toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA ({formData.tvaRate}%) :</span>
                  <span className="text-gray-900">{calcTVA().toLocaleString(undefined, { maximumFractionDigits: 0 })} FCFA</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-gray-900 font-medium">Total TTC :</span>
                  <span className="text-xl text-gray-900 font-semibold">{calcTotal().toLocaleString(undefined, { maximumFractionDigits: 0 })} FCFA</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  Créer la facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl text-gray-900">{selectedInvoice.id}</h2>
                
              </div>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Header grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <span className="text-xs text-gray-500 uppercase">Fournisseur</span>
                <p className="text-gray-900 mt-0.5">{selectedInvoice.supplier}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Statut</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-xs rounded-full ${statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-700"}`}>
                    {statusConfig[selectedInvoice.status as keyof typeof statusConfig]?.label ?? selectedInvoice.status}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Réf. BDC</span>
                <p className="text-blue-600 mt-0.5">{selectedInvoice.purchase_order_reference || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Réf. BL</span>
                <p className="text-blue-600 mt-0.5">{selectedInvoice.delivery_reference}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Date de facture</span>
                <p className="text-gray-900 mt-0.5">{selectedInvoice.invoice_date}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Échéance</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${getDueDateStatus(selectedInvoice.due_date, selectedInvoice.status === "PAID").color}`} />
                  <p className={getDueDateStatus(selectedInvoice.due_date, selectedInvoice.status === "PAID").textColor}>
                    {new Date(selectedInvoice.due_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Validated by banner */}
            {selectedInvoice.accountant_validated_by_detail && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-4">
                <p className="text-xs text-green-700 font-medium">Validée par {selectedInvoice.accountant_validated_by_detail.full_name}</p>
                {selectedInvoice.accountant_validated_at && (
                  <p className="text-xs text-green-600">{new Date(selectedInvoice.accountant_validated_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}</p>
                )}
              </div>
            )}

            {/* Rejected reason banner */}
            {selectedInvoice.status === "REJECTED" && selectedInvoice.rejection_reason && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-4">
                <p className="text-xs text-red-700 font-medium">Motif du rejet</p>
                <p className="text-xs text-red-600 mt-1">{selectedInvoice.rejection_reason}</p>
              </div>
            )}

            {/* Items Table */}
{selectedInvoice.lines && selectedInvoice.lines.length > 0 && (
  <div className="mb-5">
    <h3 className="text-sm font-medium text-gray-700 mb-2">
      Lignes de facture
    </h3>

    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">
              Désignation
            </th>
            <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">
              Qté
            </th>
            <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">
              Prix HT
            </th>
            <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">
              Total
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {selectedInvoice.lines.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2 text-gray-900">
                {item.designation || item.product_detail?.name || "—"}
              </td>

              <td className="px-4 py-2 text-right text-gray-600">
                {Number(item.quantity || 0)}
              </td>

              <td className="px-4 py-2 text-right text-gray-600">
                {Number(item.unit_price || 0).toLocaleString()} FCFA
              </td>

              <td className="px-4 py-2 text-right text-gray-900">
                {Number(item.total_price || 0).toLocaleString()} FCFA
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

           {/* Financial Summary */}
{(() => {
  const subtotal =
    selectedInvoice.lines?.reduce(
      (sum: number, item) =>
        sum + Number(item.total_price || 0),
      0
    ) || 0;

  const tvaRate = Number(selectedInvoice.tva_percent || 0);

  const tvaAmount = subtotal * (tvaRate / 100);

  const totalTTC = Number(selectedInvoice.total_amount || 0);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Sous-total HT :
        </span>

        <span className="text-gray-900">
          {subtotal.toLocaleString()} FCFA
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          TVA ({tvaRate}%) :
        </span>

        <span className="text-gray-900">
          {tvaAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })} FCFA
        </span>
      </div>

      <div className="flex justify-between border-t border-gray-300 pt-2">
        <span className="font-medium text-gray-900">
          Total TTC :
        </span>

        <span className="text-xl font-semibold text-gray-900">
          {totalTTC.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })} FCFA
        </span>
      </div>
    </div>
  );
})()}

           {/* Action Buttons */}
<div className="flex gap-3 flex-wrap">

  <button
    onClick={() => {
      setShowDetailModal(false);
      handleViewDocument(selectedInvoice);
    }}
    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
  >
    <Eye className="w-4 h-4" />
    Aperçu document
  </button>

  {/* Étape 1 : Comptable */}
  {canValidateStep1 &&
    selectedInvoice.status === "PENDING_ACCOUNTANT" && (
      <button
        onClick={() => handleValidate(selectedInvoice.id)}
        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm"
      >
        <UserCheck className="w-4 h-4" />
        Valider (Comptable)
      </button>
    )}

  {/* Étape 2 : DAF */}
  {canValidateStep2 &&
    selectedInvoice.status === "PENDING_DAF" && (
      <button
        onClick={() =>
          handleApproveDaf(selectedInvoice.id)
        }
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
      >
        <CheckCircle className="w-4 h-4" />
        Approuver (DAF)
      </button>
    )}

  {/* Étape 3 : DG */}
  {canValidateStep3 &&
    selectedInvoice.status === "PENDING_DG" && (
      <button
        onClick={() =>
          handleApprove(selectedInvoice.id)
        }
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
      >
        <CheckCircle className="w-4 h-4" />
        Approuver (DG)
      </button>
    )}

  {/* Rejet */}
  {canReject &&
    selectedInvoice.status !== "APPROVED" &&
    selectedInvoice.status !== "PAID" &&
    selectedInvoice.status !== "CANCELLED" && (
      <button
        onClick={() => {
          setShowDetailModal(false);

          setRejectModal({
            invoiceId: selectedInvoice.id,
            ref:
              selectedInvoice.reference ||
              selectedInvoice.invoice_number,
          });
        }}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
      >
        <XCircle className="w-4 h-4" />
        Rejeter
      </button>
    )}
</div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      <RejectModal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        onConfirm={(motif) => {
          if (!rejectModal) return;
          handleReject(rejectModal.invoiceId, motif);
        }}
        documentRef={rejectModal?.ref}
        documentType="facture"
      />

      {/* Document Preview Modal */}
      {showDocumentPreview && selectedInvoice && (() => {
        const documentData = getDocumentData();
        if (!documentData) return null;
        const handleClose = () => { setShowDocumentPreview(false); setSelectedInvoice(null); };
        return (
          <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/60">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between print:hidden shadow-sm">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <div className="text-center">
                <span className="font-semibold text-gray-900">{documentData.number}</span>
                <span className="text-gray-400 mx-2">·</span>
                <span className="text-sm text-gray-600">{documentData.clientName}</span>
                <span className="text-gray-400 mx-2">·</span>
                <span className="text-sm text-gray-500">{new Date(documentData.date).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              <DocumentTemplate
                data={documentData}
                onDownload={handleDownloadPDF}
                onPrint={handlePrint}
                showActions={false}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
