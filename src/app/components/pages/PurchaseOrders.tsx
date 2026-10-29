import {
  getPurchaseOrders,
  getPurchaseOrder,
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder
} from "../../purchaseOrdersApi";

import { apiRequest } from "../../apiClient";

import { useState, useEffect, useRef } from "react";


import { Search, Plus, Eye, Edit, Send, CheckCircle, Clock, XCircle, Trash2, X, FileSpreadsheet, AlertTriangle, Loader2, ClipboardCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { RejectModal } from "../shared/RejectModal";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";
import {
  getProducts,
  createProduct,
  type Product
} from "../../productsApi";
import { getCustomerQuotes, reviewCustomerQuoteAvailability } from "../../data/quotesData";


type ConfirmState = {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
} | null;

function ConfirmDialog({ state, onCancel }: { state: ConfirmState; onCancel: () => void }) {
  if (!state) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{state.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition"
          >
            Annuler
          </button>
          <button
            onClick={state.onConfirm}
            className={`px-4 py-2 text-white rounded-lg text-sm transition ${state.confirmClass}`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft:          { label: "Brouillon",         color: "bg-gray-100 text-gray-700",       icon: Edit },
  pending:        { label: "En attente DG", color: "bg-violet-100 text-violet-700", icon: Clock },
  pending_dg:     { label: "En attente DG", color: "bg-violet-100 text-violet-700", icon: Clock },
  approved:       { label: "Validé définitiv.", color: "bg-green-100 text-green-700",     icon: CheckCircle },
  rejected:       { label: "Rejeté",            color: "bg-red-100 text-red-700",         icon: XCircle },
  sent:           { label: "Envoyé",            color: "bg-blue-100 text-blue-700",       icon: Send },
  received:       { label: "Reçu",              color: "bg-purple-100 text-purple-700",   icon: CheckCircle },
  closed:         { label: "Clôturé",           color: "bg-gray-100 text-gray-700",       icon: XCircle },
};

const getStatusConfig = (status: string) =>
  statusConfig[status] ?? { label: status, color: "bg-gray-100 text-gray-700", icon: Clock };
const normalizeStatus = (status: string) => {
  const value = String(status ?? "").toUpperCase();

  switch (value) {
    case "DRAFT":
      return "draft";

    case "PENDING":
    case "PENDING_APPROVAL":
    case "PENDING_DAF_APPROVAL":
    case "VALIDATED_DAF":
    case "PENDING_DG":
    case "PENDING_DG_APPROVAL":
     return "pending_dg";

    case "APPROVED":
      return "approved";

    case "REJECTED":
      return "rejected";

    case "SENT":
      return "sent";

    case "RECEIVED":
      return "received";

    case "CANCELLED":
      return "closed";

    default:
      return String(status ?? "").toLowerCase();
  }
};


type Article = {
  id: number;
  productId?: string | number;
  name: string;
  nameOption: string;
  customName: string;
  quantity: number;
  unitPrice: number;
};

type QuoteAvailabilityDecision = {
  available: boolean | null;
  note: string;
};

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function PurchaseOrders() {

// 👇 AJOUTE ICI
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("fr-FR");
  };


  
  const { lang, t } = useLanguage();
  const { hasPermission, hasRole, user } = useAuth();
  const { addNotification, addAuditEntry } = useAppData();
  const canCreate      = hasPermission("purchase_orders:create");
const canEdit        = hasPermission("purchase_orders:edit");
const canValidate    = hasPermission("purchase_orders:validate_dg");


console.log("=== PERMISSIONS BDC ===");
console.log("Utilisateur :", user);
console.log("=== PERMISSIONS UTILISATEUR ===");
console.log("Role :", user?.role);
console.log("Permissions :", user?.permissions);
console.log("canCreate :", canCreate);
console.log("canEdit :", canEdit);
console.log("canValidate :", canValidate);

  const canDelete      = hasRole(["admin"]);
 const isViewOnly = !canCreate && !canEdit && !canValidate;
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; ref: string } | null>(null);
  const canReviewCustomerQuotes = hasRole(["admin", "gestionnaire_achats"]);
  const [customerQuotesToReview, setCustomerQuotesToReview] = useState<any[]>([]);
  const [loadingCustomerQuotes, setLoadingCustomerQuotes] = useState(false);
  const [customerQuotesError, setCustomerQuotesError] = useState("");
  const [selectedQuoteForReview, setSelectedQuoteForReview] = useState<any | null>(null);
  const [quoteAvailabilityDecisions, setQuoteAvailabilityDecisions] =
    useState<Record<string, QuoteAvailabilityDecision>>({});
  const [reviewingQuote, setReviewingQuote] = useState(false);
  const [quoteReviewError, setQuoteReviewError] = useState("");
  const reviewInProgress = useRef(false);

 const [products, setProducts] = useState<Product[]>([]);



  const ask = (message: string, confirmLabel: string, confirmClass: string, onConfirm: () => void) => {
    setConfirmState({ message, confirmLabel, confirmClass, onConfirm });
  };

  // Load purchase orders from shared database (runs on mount + after each modal close)
 const loadOrders = async () => {
  try {
    const data = await getPurchaseOrders(currentPage);
    
    console.log("=== RÉPONSE BDC DJANGO ===", JSON.stringify(data, null, 2));
    console.log("=== BDC APRÈS REJET ===");
    console.log(JSON.stringify(data, null, 2));

console.log("=== RÉPONSE DJANGO BDC ===", data);
console.log(
  "=== RÉPONSE DJANGO BDC JSON ===",
  JSON.stringify(data, null, 2)
);

setTotalPages(data.count ? Math.ceil(data.count / 20) : 1);
    const dbOrders = data.results ?? [];
    console.log("BDC Django :", data);
   console.log("BDC Django JSON :", JSON.stringify(data, null, 2));
    console.log(dbOrders);

   const formattedOrders = dbOrders.map((order: any) => {

  // Nombre total d'articles
  const totalItems = Array.isArray(order.items)
    ? order.items.reduce(
        (total: number, item: any) =>
          total + Number(item.quantity ?? 0),
        0
      )
    : 0;

  // Montant HT calculé à partir des lignes
  const subtotal = Array.isArray(order.items)
    ? order.items.reduce(
        (total: number, item: any) =>
          total + Number(item.total_price ?? 0),
        0
      )
    : 0;

  // TVA
 const totalTax = Number(order.total_tax ?? 0);

const totalAmount = Number(
  order.total_amount_ttc ??
  order.total_amount ??
  subtotal + totalTax
);

const tvaRate =
  subtotal > 0
    ? (totalTax / subtotal) * 100
    : 0;

   if (order.status === "REJECTED") {
  console.log("=== CHAMPS BDC REJETÉ ===", Object.keys(order));
}
  return {
    ...order,

    // Identité
    id: order.id,
    reference: order.reference,

    // Fournisseur
    supplierId: order.supplier,

supplier:
  order.supplier_detail?.raison_sociale ??
  order.supplier_detail?.name ??
  order.supplier_name ??
  "—",

supplierDetail: order.supplier_detail,

    // Dates Django → Frontend
    orderDate: order.order_date,
    deliveryDate: order.expected_delivery_date,
    createdAt: order.created_at,

    
    // Statut
    

    status: normalizeStatus(order.status),
   rejectionComment:
  order.last_rejection_comment ??
  order.rejection_reason ??
  order.rejection_comment ??
  "",
    

    // Montants
    subtotal: subtotal,
    tvaRate: tvaRate,
    totalTax: totalTax,
    totalAmount: totalAmount,

    // Notes
    notes: order.notes ?? "",

    // Articles
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          ...item,
          productId: item.product,
          productName: item.product_detail?.name ?? "",
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unit_price ?? 0),
          totalPrice: Number(item.total_price ?? 0),
        }))
      : [],

    itemCount: totalItems,
  };
});

    console.log("========== BDC FORMATÉS ==========");
    console.log(formattedOrders);

    console.log("=== PREMIER BDC ===");
   console.log("STATUT PREMIER BDC :", formattedOrders[0]?.status);

if (formattedOrders.length > 0) {
  console.log("Référence :", formattedOrders[0].reference);
  console.log("Date :", formattedOrders[0].orderDate);
  console.log("Date livraison :", formattedOrders[0].deliveryDate);
  console.log("Sous-total :", formattedOrders[0].subtotal);
  console.log("TVA :", formattedOrders[0].tvaRate);
  console.log("Total :", formattedOrders[0].totalAmount);
}

    

    
    

    setOrders(formattedOrders);
  } catch (error) {
    console.error(
      "Erreur chargement BDC :",
      error
    );
  }
};

useEffect(() => {
  loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [showModal, showDetailModal, currentPage]);

  const [formData, setFormData] = useState({
    supplier: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    notes: "",
    tvaRate: 20,
    tvaOption: "20",
    customTvaRate: 0,
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  
const [loadingProducts, setLoadingProducts] = useState(false);

  console.log("### VERSION TEST FOURNISSEURS ###");

useEffect(() => {
  console.log("=== USEEFFECT FOURNISSEURS EXÉCUTÉ ===");

  const loadSuppliers = async () => {
    console.log("=== APPEL /v1/suppliers/ ===");

    try {
      const data = await apiRequest("/v1/suppliers/");

      console.log("=== RÉPONSE FOURNISSEURS ===", data);
      console.log("=== RESULTS FOURNISSEURS ===", data?.results);

      setSuppliers(data?.results || []);
    } catch (error) {
      console.error("=== ERREUR FOURNISSEURS ===", error);
    }
  };

  loadSuppliers();
}, []);

useEffect(() => {
  console.log("=== USEEFFECT PRODUITS EXÉCUTÉ ===");

  const loadProducts = async () => {
    console.log("=== APPEL /v1/products/ ===");

    try {
      const data = await apiRequest("/v1/products/");

      console.log("=== RÉPONSE PRODUITS ===", data);
      console.log("=== RESULTS PRODUITS ===", data?.results);

      setProducts(data?.results || []);

      console.log(
        "=== PRODUITS DANS LE FORMULAIRE ===",
        data?.results
      );

    } catch (error) {
      console.error("=== ERREUR PRODUITS ===", error);
    }
  };

  loadProducts();
}, []);

useEffect(() => {
  if (!canReviewCustomerQuotes) return;

  let active = true;
  setLoadingCustomerQuotes(true);
  setCustomerQuotesError("");
  getCustomerQuotes()
    .then((quotes) => {
      if (active) {
        setCustomerQuotesToReview(
          (Array.isArray(quotes) ? quotes : []).filter(
            (quote: any) => quote.status === "PURCHASING_REVIEW"
          )
        );
      }
    })
    .catch((error) => {
      console.error("Erreur de chargement des devis à vérifier :", error);
      if (active) setCustomerQuotesError("Impossible de charger les devis à vérifier.");
    })
    .finally(() => {
      if (active) setLoadingCustomerQuotes(false);
    });

  return () => {
    active = false;
  };
}, [canReviewCustomerQuotes]);

console.log("SUPPLIERS DANS LE FORMULAIRE :", suppliers);

  const [articles, setArticles] = useState<Article[]>([
    { id: 1, name: "", nameOption: "", customName: "", quantity: 1, unitPrice: 0 }
  ]);

 const filteredOrders = orders.filter((order) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    String(order.reference ?? "")
      .toLowerCase()
      .includes(search) ||
    String(order.supplier ?? "")
      .toLowerCase()
      .includes(search);

  const matchesStatus =
    filterStatus === "all" ||
    order.status === filterStatus;

  return matchesSearch && matchesStatus;
});

  const openQuoteAvailabilityReview = (quote: any) => {
    setSelectedQuoteForReview(quote);
    setQuoteReviewError("");
    const initialDecisions: Record<string, QuoteAvailabilityDecision> = {};
    (Array.isArray(quote.items) ? quote.items : []).forEach((item: any) => {
      if (isUuid(item.id)) {
        initialDecisions[item.id] = { available: null, note: "" };
      }
    });
    setQuoteAvailabilityDecisions(initialDecisions);
  };

  const reviewedQuoteLines = Array.isArray(selectedQuoteForReview?.items)
    ? selectedQuoteForReview.items
    : [];
  const unreviewedQuoteLines = reviewedQuoteLines.filter((item: any) =>
    !isUuid(item.id) ||
    quoteAvailabilityDecisions[item.id]?.available === null ||
    quoteAvailabilityDecisions[item.id]?.available === undefined
  );
  const canSubmitQuoteReview =
    reviewedQuoteLines.length > 0 &&
    reviewedQuoteLines.every((item: any) => isUuid(item.id)) &&
    unreviewedQuoteLines.length === 0 &&
    !reviewingQuote;

  const handleReviewCustomerQuote = async () => {
    if (!selectedQuoteForReview || !canSubmitQuoteReview || reviewInProgress.current) return;
    reviewInProgress.current = true;
    setReviewingQuote(true);
    setQuoteReviewError("");

    const items = reviewedQuoteLines.flatMap((item: any) => {
      const decision = isUuid(item.id) ? quoteAvailabilityDecisions[item.id] : undefined;
      if (!decision || typeof decision.available !== "boolean") return [];
      return [{
        id: item.id,
        available: decision.available,
        note: decision.note,
      }];
    });

    try {
      await reviewCustomerQuoteAvailability(selectedQuoteForReview.id, items);
      setCustomerQuotesToReview((previous) =>
        previous.filter((quote) => quote.id !== selectedQuoteForReview.id)
      );
      setSelectedQuoteForReview(null);
      setQuoteAvailabilityDecisions({});
      addNotification({
        type: "success",
        title: "Revue enregistrée",
        message: "Les disponibilités ont été enregistrées et le devis a été transmis au client.",
        module: "devis",
        documentRef: selectedQuoteForReview.reference,
      });

      try {
        const refreshedQuotes = await getCustomerQuotes();
        setCustomerQuotesToReview(
          (Array.isArray(refreshedQuotes) ? refreshedQuotes : []).filter(
            (quote: any) => quote.status === "PURCHASING_REVIEW"
          )
        );
      } catch (refreshError) {
        console.error("Revue enregistrée, mais la liste des devis n'a pas pu être actualisée :", refreshError);
      }
    } catch (error) {
      console.error("Erreur d'enregistrement de la revue de disponibilité :", error);
      setQuoteReviewError("La revue n'a pas pu être enregistrée. Vos décisions sont conservées, vous pouvez réessayer.");
    } finally {
      reviewInProgress.current = false;
      setReviewingQuote(false);
    }
  };

  const calculateSubtotal = () => {
    return articles.reduce((sum, article) => sum + (article.quantity * article.unitPrice), 0);
  };

  const calculateTVA = () => {
    return calculateSubtotal() * (formData.tvaRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTVA();
  };

  const handleAddArticle = () => {
    setArticles([...articles, {
      id: Math.max(...articles.map(a => a.id)) + 1,
      productId: "",
      name: "",
      nameOption: "",
      customName: "",
      quantity: 1,
      unitPrice: 0
    }]);
  };

  const handleRemoveArticle = (id: number) => {
    if (articles.length > 1) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

 const handleArticleChange = (
  id: number,
  field: string,
  value: any
) => {
  if (field === "nameOption") {
   

    // Cas : "Autre"
    if (value === "autre") {
      setArticles(articles.map(a =>
        a.id === id
          ? {
              ...a,
              productId: "",
              nameOption: value,
              name: a.customName,
              unitPrice: 0,
            }
          : a
      ));

    // Cas : aucune sélection
    } else if (value === "") {
      setArticles(articles.map(a =>
        a.id === id
          ? {
              ...a,
              productId: "",
              nameOption: value,
              name: "",
              unitPrice: 0,
            }
          : a
      ));

    // Cas : produit existant
    } else {
      const selectedProduct = products.find(
        p => String(p.id) === String(value)
      );

      setArticles(articles.map(a =>
        a.id === id
          ? {
              ...a,
              productId: selectedProduct?.id || "",
              nameOption: value,
              name: selectedProduct?.name || "",
             unitPrice: Number(selectedProduct?.unit_price) || 0,
            }
          : a
      ));
    }
  } else if (field === "customName") {
    setArticles(articles.map(a =>
      a.id === id
        ? {
            ...a,
            customName: value,
            name: value,
            productId: "",
          }
        : a
    ));
  } else {
    setArticles(articles.map(a =>
      a.id === id
        ? {
            ...a,
            [field]: value,
          }
        : a
    ));
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (!formData.supplier) {
      alert("Veuillez sélectionner un fournisseur.");
      return;
    }

    if (!formData.orderDate) {
      alert("Veuillez renseigner la date de commande.");
      return;
    }

    if (!articles || articles.length === 0) {
      alert("Veuillez ajouter au moins un article.");
      return;
    }

    const invalidArticle = articles.find(
  (article) =>
    (
      article.nameOption !== "autre" &&
      !article.productId
    ) ||
    (
      article.nameOption === "autre" &&
      !article.customName
    ) ||
    Number(article.quantity) <= 0 ||
    Number(article.unitPrice) < 0
);

console.log("ARTICLE INVALIDE :", invalidArticle);
console.log("ARTICLES :", articles);

    if (invalidArticle) {
      alert(
        "Veuillez vérifier les produits, quantités et prix des articles."
      );
      return;
    }
 console.log("========== VÉRIFICATION ARTICLES ==========");

articles.forEach((article, index) => {
  console.log(`Article ${index + 1}:`, article);
  console.log(`Article ${index + 1} product:`, article.nameOption);
  console.log(`Article ${index + 1} quantity:`, article.quantity);
  console.log(`Article ${index + 1} unitPrice:`, article.unitPrice);
});

console.log("==========================================");


const finalItems = [];

for (const article of articles) {
  let productId = article.productId;

  // ==========================================
  // CAS 1 : NOUVEAU PRODUIT
  // ==========================================
  if (article.nameOption === "autre") {
    if (!article.customName.trim()) {
      alert("Veuillez saisir le nom du nouveau produit.");
      return;
    }

    console.log("=== CRÉATION DU NOUVEAU PRODUIT ===");

    const newProduct = await createProduct({
      code: `PRD-${Date.now()}`,
      name: article.customName.trim(),
      description: "",
      unit: "piece",
      unit_price: String(article.unitPrice),
      category: "",
      is_active: true,
    });

    console.log("=== NOUVEAU PRODUIT CRÉÉ ===", newProduct);

    // IMPORTANT :
    // on remplace "autre" par le véritable UUID
    productId = newProduct.id;

    console.log("=== UUID DU NOUVEAU PRODUIT ===", productId);

    // Ajouter le nouveau produit à la liste des produits
    setProducts((prev) => [...prev, newProduct]);
  }

  // ==========================================
  // VÉRIFICATION DE L'UUID
  // ==========================================
  if (!productId || productId === "autre") {
    console.error("ARTICLE INVALIDE :", article);
    alert("Veuillez sélectionner ou créer un produit.");
    return;
  }

  // ==========================================
  // AJOUT DE L'ARTICLE AU BDC
  // ==========================================
  finalItems.push({
  product: productId,
  quantity: Number(article.quantity),
  unit_price: Number(article.unitPrice),
  tax_rate: Number(formData.tvaRate),
});
}

const payload = {
  supplier: formData.supplier,
  order_date: formData.orderDate,
  expected_delivery_date: formData.deliveryDate || null,
  notes: formData.notes || "",
  items: finalItems,
};
    console.log(
      "========== PAYLOAD BDC DJANGO =========="
    );

    console.log(
      JSON.stringify(payload, null, 2)
    );

    console.log("supplier :", payload.supplier);
    console.log("order_date :", payload.order_date);
    console.log("items :", payload.items);

    console.log(
      "========================================"
    );
    console.log("=== EDITING ORDER ID ===", editingOrderId);

    
 console.log("=== AVANT UPDATE BDC ===");
  console.log("editingOrderId :", editingOrderId);
  console.log("payload :", payload);
  
    
console.log("=== AVANT CHOIX CREATE / UPDATE ===");
console.log("editingOrderId :", editingOrderId);
console.log("payload :", JSON.stringify(payload, null, 2));

let savedOrder;

if (editingOrderId) {

  console.log("=== MODE UPDATE BDC ===");
  console.log("=== ID UPDATE ===", editingOrderId);
  console.log(
    "=== PAYLOAD ENVOYÉ À DJANGO ===",
    JSON.stringify(payload, null, 2)
  );

  savedOrder = await updatePurchaseOrder(editingOrderId, payload);

  console.log("=== BDC MODIFIÉ PAR DJANGO ===");
  console.log(savedOrder);

} else {

  console.log("=== MODE CREATE BDC ===");

  savedOrder = await addPurchaseOrder(payload);
}
console.log(
  editingOrderId
    ? "========== BDC MODIFIÉ =========="
    : "========== BDC CRÉÉ =========="
);

console.log("=== SAVED ORDER ===");
console.log(savedOrder);

console.log("=== AVANT loadOrders() ===");

await loadOrders();

console.log("=== APRÈS loadOrders() ===");

setShowModal(false);
setEditingOrderId(null);

resetForm();



  } catch (error) {
    console.error(
      "Erreur création BDC :",
      error
    );

    alert(
      "Erreur lors de la création du bon de commande."
    );
  }
};

  const resetForm = () => {
    setFormData({
  supplier: "",
  orderDate: new Date().toISOString().split("T")[0],
  deliveryDate: "",
  notes: "",
  tvaRate: 20,
  tvaOption: "20",
  customTvaRate: 0
});
    setArticles([{ id: 1, name: "", nameOption: "", customName: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleViewDetails = async (order: any) => {
    console.log("🔥 HANDLE VIEW DETAILS EXECUTÉ 🔥", order);
  try {
    console.log("=== CLIC VOIR DÉTAIL ===");
    console.log("ID DU BDC :", order.id);
    

    // Récupérer le détail complet depuis Django
    const data = await getPurchaseOrder(order.id);

    console.log("=== TEST DATE ===");
console.log("order.deliveryDate =", order.deliveryDate);
console.log("data.delivery_date =", data.delivery_date);
 console.log("=== DATA DETAIL COMPLETE ===", data);
console.log("=== DELIVERY DATE ===", data.delivery_date);
console.log("=== ORDER ORIGINAL ===", order);

    console.log("=== DÉTAIL REÇU DE DJANGO ===");
    console.log(JSON.stringify(data, null, 2));

    // Normaliser les données Django pour le modal
    const detail = {
      ...data,

      // Fournisseur
      supplierName:
        data.supplier_detail?.raison_sociale ??
        data.supplier_detail?.name ??
        data.supplier ??
        "—",

      // Dates
      orderDate:
        data.order_date ??
        data.orderDate ??
        "—",

      deliveryDate:
      data.expected_delivery_date ??
       data.delivery_date ??
       data.deliveryDate ??
      "—",

      // Montants
      totalAmount: Number(
        data.total_amount ??
        data.total ??
        data.total_price ??
        0
      ),

      // Articles
      items: Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.order_items)
        ? data.order_items
        : [],
    };

    console.log("=== DONNÉES NORMALISÉES POUR LE MODAL ===");
    console.log(JSON.stringify(detail, null, 2));
    console.log("=== DETAIL AVANT SELECTED ORDER ===");
console.log("order.deliveryDate =", order.deliveryDate);
console.log("detail.deliveryDate =", detail.deliveryDate);
console.log("detail complet =", detail);

    setSelectedOrder(detail);
    setShowDetailModal(true);

  } catch (error) {
    console.error("=== ERREUR DÉTAIL BDC ===", error);
  }
};

  const handleEdit = (order: any) => {
  // Seuls les BDC en brouillon peuvent être modifiés
  if (order.status !== "draft") {
    return;
  }
  console.log("=== CLIC SUR MODIFIER ===", order.id, order.reference);

  console.log("=== MODIFICATION BDC ===", order);
  console.log("=== SUPPLIER ID POUR MODIFICATION ===", order.supplierId);

  // Préremplir les informations générales
  setFormData({
    supplier: order.supplierId ?? "",
    orderDate: order.orderDate ?? "",
    deliveryDate: order.deliveryDate ?? "",
    notes: order.notes ?? "",
    tvaRate: Number(order.tvaRate ?? 20),
    tvaOption: String(order.tvaRate ?? 20),
    customTvaRate: 0,
  });

  // Préremplir les articles
  setArticles(
    Array.isArray(order.items) && order.items.length > 0
      ? order.items.map((item: any, index: number) => ({
          id: index + 1,
          name: item.productName ?? "",
          nameOption: item.productId ?? "",
          customName: "",
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),
          productId: item.productId ?? "",
        }))
      : [
          {
            id: 1,
            name: "",
            nameOption: "",
            customName: "",
            quantity: 1,
            unitPrice: 0,
            productId: "",
          },
        ]
  );

  // Mémoriser le BDC que nous sommes en train de modifier
  setEditingOrderId(order.id);

  // Ouvrir le formulaire
  setShowModal(true);
};

 const handleDelete = (orderId: string) => {
  ask(
    "Êtes-vous sûr de vouloir supprimer ce bon de commande ?",
    "Supprimer",
    "bg-red-600 hover:bg-red-700",
    async () => {
      try {
        await deletePurchaseOrder(orderId);

        await loadOrders();

        setConfirmState(null);
      } catch (error) {
        console.error("Erreur suppression BDC :", error);
      }
    }
  );
};

 
  const handleSubmitForApproval = async (orderId: string) => {
  try {
    console.log("=== SOUMISSION BDC POUR APPROBATION ===", orderId);

    await apiRequest(`/v1/purchase-orders/${orderId}/submit/`, {
      method: "POST",
    });

    console.log("=== BDC SOUMIS AVEC SUCCÈS ===");

    await loadOrders();

    addNotification({
      type: "success",
      title: "BDC soumis",
      message: `Le bon de commande ${orderId} a été soumis pour approbation.`,
      module: "bons_commande",
      documentRef: orderId,
    });

  } catch (error) {
    console.error("=== ERREUR SOUMISSION BDC ===", error);

    alert("Impossible de soumettre le bon de commande pour approbation.");
  }
};
const handleApprove = async (orderId: string) => {
  try {
    await apiRequest(`/v1/purchase-orders/${orderId}/approve/`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    await loadOrders();
  } catch (error) {
    console.error("Erreur validation BDC :", error);
  }
};

const handleReject = (id: string, ref: string) => {
  setRejectModal({ id, ref });
};

  const confirmReject = async (motif: string) => {
  if (!rejectModal) return;

  try {
    console.log(
      "=== REJET BDC ===",
      rejectModal.id,
      "MOTIF :",
      motif
    );

    await apiRequest(
      `/v1/purchase-orders/${rejectModal.id}/reject/`,
      {
        method: "POST",
        body: JSON.stringify({ comment: motif }),
      }
    );

    console.log("=== BDC REJETÉ AVEC SUCCÈS ===");

    await loadOrders();

    addNotification({
      type: "error",
      title: "Document rejeté",
      message: `${rejectModal.ref} a été rejeté. Motif : ${motif}`,
      module: "rejets",
      documentRef: rejectModal.ref,
      motifRejet: motif,
    });

    addAuditEntry({
      userId: user?.id ?? "",
      userName: user?.name ?? "",
      userRole: user?.role ?? "",
      action: "REJET",
      module: "bons_commande",
      documentRef: rejectModal.ref,
      oldStatus: "pending",
      newStatus: "rejected",
      motifRejet: motif,
    });

    setRejectModal(null);

  } catch (error) {
    console.error("=== ERREUR REJET BDC ===", error);

    alert("Impossible de rejeter ce bon de commande.");
  }
};
    

 const handleSendToSupplier = (orderId: string) => {
  ask(
    "Envoyer ce bon de commande au fournisseur ?",
    "Envoyer",
    "bg-purple-600 hover:bg-purple-700",
    async () => {
      try {
        await apiRequest(
          `/v1/purchase-orders/${orderId}/send-to-supplier/`,
          {
            method: "POST",
            body: JSON.stringify({}),
          }
        );

        await loadOrders();

        setConfirmState(null);
      } catch (error) {
        console.error("Erreur envoi fournisseur :", error);
      }
    }
  );
};

  return (
    <div className="space-y-6">
      <ConfirmDialog state={confirmState} onCancel={() => setConfirmState(null)} />
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.purchaseOrders.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.purchaseOrders.subtitle[lang]}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.purchaseOrders.newOrder[lang]}
          </button>
        )}
      </div>

      {isViewOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <Eye className="w-4 h-4 shrink-0" />
          Vous êtes en mode consultation uniquement. Vous ne pouvez pas créer, modifier ou valider des bons de commande.
        </div>
      )}

      {canReviewCustomerQuotes && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg text-gray-900">Devis clients à vérifier</h2>
              <p className="text-sm text-gray-500 mt-1">
                Renseignez la disponibilité de chaque article avant la transmission au client.
              </p>
            </div>
            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm">
              {customerQuotesToReview.length}
            </span>
          </div>
          {loadingCustomerQuotes ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des devis...
            </div>
          ) : customerQuotesError ? (
            <div className="px-5 py-5 text-sm text-red-700">{customerQuotesError}</div>
          ) : customerQuotesToReview.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-500">Aucun devis en attente de vérification.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Référence</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Client</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Date</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-500 uppercase">Montant</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase">Statut</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerQuotesToReview.map((quote: any) => (
                    <tr key={quote.id}>
                      <td className="px-5 py-3 text-sm text-gray-900">{quote.reference || quote.number || quote.id}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {quote.customer_detail?.raison_sociale ||
                          quote.customer_detail?.name ||
                          quote.customer_name ||
                          quote.customer ||
                          "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {quote.quote_date || quote.created_at || quote.date
                          ? new Date(quote.quote_date || quote.created_at || quote.date).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-right">
                        {Number(quote.total_amount_ttc ?? quote.total_amount ?? quote.total ?? 0).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                          En vérification par les achats
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openQuoteAvailabilityReview(quote)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          Vérifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un bon de commande..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filterStatus === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total des BDC</div>
          <div className="text-2xl text-gray-900">{orders.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Montant total</div>
          <div className="text-2xl text-gray-900">
            {orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()} FCFA
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">En attente d'approbation</div>
          <div className="text-2xl text-orange-600">
            {orders.filter((o) => o.status === "pending").length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Numéro BDC
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Montant total
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
              
              console.log("=== BDC TABLE ===", {
               reference: order.reference,
               status: order.status,
              rejectionComment: order.rejectionComment,
              });
              const cfg = getStatusConfig(order.status);
                const StatusIcon = Clock;
                
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {order.linkedQuoteId && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200"
                            title={`Généré depuis le devis ${order.linkedQuoteId}`}
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            Devis
                          </span>
                        )}
                        <span>{order.reference}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
  {Array.isArray(order.items) ? order.items.length : 0}{" "}
  {Array.isArray(order.items) && order.items.length > 1
    ? "articles"
    : "article"}
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Number(order.totalAmount ?? 0).toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  <span
    className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${cfg.color}`}
  >
    <span className="w-3 h-3 mr-1 inline-block" />
    {cfg.label}
  </span>

  {order.status === "rejected" && order.rejectionComment && (
    <div className="mt-1 text-xs text-red-600">
      Motif : {order.rejectionComment}
    </div>
  )}
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                     {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RowActionMenu>
                        <RowActionItem icon={<Eye />} onSelect={() => handleViewDetails(order)}>Voir détails</RowActionItem>
                        {canEdit && order.status === "draft" && <RowActionItem icon={<Edit />} onSelect={() => handleEdit(order)}>Modifier</RowActionItem>}
                        {canValidate && order.status === "pending_dg" && <RowActionItem icon={<CheckCircle />} onSelect={() => handleApprove(order.id)}>Valider définitivement (DG)</RowActionItem>}
                        {canValidate && order.status === "pending_dg" && <RowActionItem icon={<XCircle />} onSelect={() => handleReject(order.id, order.reference)} destructive>Rejeter (DG)</RowActionItem>}
                        {canEdit && order.status?.toLowerCase() === "draft" && <RowActionItem icon={<Send />} onSelect={() => handleSubmitForApproval(order.id)}>Soumettre pour approbation</RowActionItem>}
                        {canEdit && order.status?.toLowerCase() === "approved" && <RowActionItem icon={<Send />} onSelect={() => handleSendToSupplier(order.id)}>Envoyer au fournisseur</RowActionItem>}
                        {canDelete && <RowActionItem icon={<Trash2 />} onSelect={() => handleDelete(order.id)} destructive>Supprimer</RowActionItem>}
                      </RowActionMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
      <div className="flex items-center justify-between mt-4">
  <button
    onClick={() => setCurrentPage((page) => page - 1)}
    disabled={currentPage === 1}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Précédent
  </button>

  <span>
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">
                {editingOrderId ? "Modifier le bon de commande" : "Créer un bon de commande"}
             </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
               onInvalid={(e) => console.log("=== CHAMP FORMULAIRE INVALIDE ===", e.target)}
                className="space-y-4"
              >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Fournisseur *</label>
                  <select
                   value={formData.supplier}
                   onChange={(e) =>
                  setFormData({
                  ...formData,
                   supplier: e.target.value
                  })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    >
                  <option value="">Sélectionner un fournisseur</option>

                    {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                    {supplier.raison_sociale}
                      </option>
                    ))}
</select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Date de livraison *</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-700">Articles *</label>
                  <button
                    type="button"
                    onClick={handleAddArticle}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un article
                  </button>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-12 gap-2 items-center pb-2 border-b border-gray-200">
                    <div className="col-span-5 text-xs text-gray-600 uppercase">Nom de l'article</div>
                    <div className="col-span-2 text-xs text-gray-600 uppercase">Quantité</div>
                    <div className="col-span-3 text-xs text-gray-600 uppercase">Prix Unitaire</div>
                    <div className="col-span-2 text-xs text-gray-600 uppercase">Total</div>
                  </div>
                  {articles.map((article, index) => {
                   
                    return (
                    <div key={article.id} className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <select
                            value={article.nameOption}
                            onChange={(e) => handleArticleChange(article.id, "nameOption", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required={article.nameOption !== "autre"}
                          >
                            <option value="">Sélectionner un produit</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                            <option value="autre">Autre (nouveau produit)</option>
                          </select>
                          {article.nameOption === "autre" && (
                            <input
                              type="text"
                              placeholder="Nom du nouveau produit"
                              value={article.customName}
                              onChange={(e) => handleArticleChange(article.id, "customName", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-2"
                              required
                            />
                          )}
                        </div>
                        <input
                          type="number"
                          placeholder="Qté"
                          min="1"
                          value={article.quantity}
                          onChange={(e) => handleArticleChange(article.id, "quantity", parseInt(e.target.value) || 1)}
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Prix unitaire"
                          min="0"
                          step="0.01"
                          value={article.unitPrice}
                          onChange={(e) => handleArticleChange(article.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          required
                        />
                        <div className="col-span-2 flex items-center justify-between">
                          <span className="text-sm text-gray-900">
                            {(article.quantity * article.unitPrice).toFixed(2)} FCFA
                          </span>
                          {articles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveArticle(article.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="text-sm text-gray-700">Taux TVA :</label>
                  <select
                    value={formData.tvaOption}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "autre") {
                        setFormData({ ...formData, tvaOption: value, tvaRate: formData.customTvaRate });
                      } else {
                        setFormData({ ...formData, tvaOption: value, tvaRate: parseFloat(value) });
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="0">0%</option>
                    <option value="5.5">5.5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                    <option value="autre">Autre</option>
                  </select>
                  {formData.tvaOption === "autre" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.customTvaRate}
                        onChange={(e) => {
                          const customRate = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, customTvaRate: customRate, tvaRate: customRate });
                        }}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.0"
                      />
                      <span className="text-sm text-gray-700">%</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total HT :</span>
                  <span className="text-gray-900">{calculateSubtotal().toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA ({formData.tvaRate}%) :</span>
                  <span className="text-gray-900">{calculateTVA().toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total TTC :</span>
                  <span className="text-xl text-gray-900">{calculateTotal().toFixed(2)} FCFA</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
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
                 {editingOrderId ? "Enregistrer les modifications" : "Créer le BDC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQuoteForReview && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl text-gray-900">
                  Vérifier le devis {selectedQuoteForReview.reference || selectedQuoteForReview.number || ""}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedQuoteForReview.customer_detail?.raison_sociale ||
                    selectedQuoteForReview.customer_detail?.name ||
                    selectedQuoteForReview.customer_name ||
                    selectedQuoteForReview.customer ||
                    "Client"}
                </p>
              </div>
              <button
                type="button"
                disabled={reviewingQuote}
                onClick={() => {
                  setSelectedQuoteForReview(null);
                  setQuoteAvailabilityDecisions({});
                  setQuoteReviewError("");
                }}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {reviewedQuoteLines.length === 0 ? (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                Ce devis ne contient aucune ligne. La validation est impossible.
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  {unreviewedQuoteLines.length === 0
                    ? "Toutes les lignes ont reçu une décision."
                    : `${unreviewedQuoteLines.length} ligne(s) restante(s) à traiter.`}
                </div>
                <div className="space-y-4">
                  {reviewedQuoteLines.map((item: any, index: number) => {
                    const hasValidId = isUuid(item.id);
                    const decision = hasValidId
                      ? quoteAvailabilityDecisions[item.id] || { available: null, note: "" }
                      : { available: null, note: "" };
                    return (
                      <div key={hasValidId ? item.id : `quote-item-${index}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="text-sm text-gray-900">
                              {item.product_detail?.name || item.product_name || item.product || "Article"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Quantité : {item.quantity ?? "—"}
                              {item.unit ? ` ${item.unit}` : ""}
                            </p>
                            {!hasValidId && (
                              <p className="text-xs text-red-700 mt-2">
                                Identifiant de ligne manquant ou invalide : cette ligne ne peut pas être validée.
                              </p>
                            )}
                          </div>
                          <div className="w-full md:w-56">
                            <label className="block text-xs text-gray-600 mb-1">Disponibilité *</label>
                            <select
                              value={decision.available === null ? "" : decision.available ? "true" : "false"}
                              disabled={!hasValidId || reviewingQuote}
                              onChange={(event) =>
                                setQuoteAvailabilityDecisions((previous) => ({
                                  ...previous,
                                  [item.id]: {
                                    ...previous[item.id],
                                    available: event.target.value === "" ? null : event.target.value === "true",
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                            >
                              <option value="">Choisir une décision</option>
                              <option value="true">Disponible</option>
                              <option value="false">Indisponible</option>
                            </select>
                          </div>
                        </div>
                        <label className="block text-xs text-gray-600 mt-3 mb-1">Note (facultatif)</label>
                        <textarea
                          value={decision.note}
                          disabled={!hasValidId || reviewingQuote}
                          onChange={(event) =>
                            setQuoteAvailabilityDecisions((previous) => ({
                              ...previous,
                              [item.id]: {
                                ...previous[item.id],
                                note: event.target.value,
                              },
                            }))
                          }
                          rows={2}
                          placeholder="Ex. Rupture de stock"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {quoteReviewError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {quoteReviewError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={reviewingQuote}
                onClick={() => {
                  setSelectedQuoteForReview(null);
                  setQuoteAvailabilityDecisions({});
                  setQuoteReviewError("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!canSubmitQuoteReview}
                onClick={handleReviewCustomerQuote}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {reviewingQuote && <Loader2 className="w-4 h-4 animate-spin" />}
                {reviewingQuote ? "Enregistrement..." : "Valider la disponibilité"}
              </button>
            </div>
          </div>
        </div>
      )}

      <RejectModal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        onConfirm={confirmReject}
        documentRef={rejectModal?.ref}
        documentType="bon de commande"
      />

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">Détails du BDC - {selectedOrder.reference}</h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Fournisseur:</span>
                  <p className="text-gray-900">{selectedOrder.supplier_detail?.raison_sociale || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Statut:</span>
                  <p>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusConfig(normalizeStatus(selectedOrder.status)).color}`}>
                      {getStatusConfig(normalizeStatus(selectedOrder.status)).label}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Date de création:</span>
                  <p className="text-gray-900">
                  {formatDate(selectedOrder.orderDate)} 
               </p>
               
                </div>
                <div>
                  <span className="text-sm text-gray-600">Date de livraison:</span>
                 <p className="text-gray-900">
                   {selectedOrder.deliveryDate || "—"}
                </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Nombre d'articles:</span>
                  <p className="text-gray-900">
                    {Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0}
                 </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Montant total:</span>
                 <p className="text-xl text-gray-900">
                  {(Number(selectedOrder.totalAmount) || 0).toLocaleString()} FCFA
                </p>
                </div>
              </div>

              {selectedOrder.linkedQuoteId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Bon de commande généré automatiquement depuis le devis {selectedOrder.linkedQuoteId}</span>
                  </div>
                </div>
              )}

              {selectedOrder.items &&
 selectedOrder.items.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm text-gray-600 mb-3">Articles commandés</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Produit</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Quantité</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Prix Unitaire</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
  {(selectedOrder.items ?? []).map((article: any) => {
    const productName =
      article.product_detail?.name ||
      article.product?.name ||
      article.name ||
      "—";

    const quantity = Number(article.quantity) || 0;

    const unitPrice =
      Number(article.unit_price ?? article.unitPrice ?? 0);

    const total =
      Number(article.total_price ?? article.totalPrice ?? quantity * unitPrice);

    return (
      <tr key={article.id}>
        <td className="px-4 py-2">
          {productName}
        </td>

        <td className="px-4 py-2 text-right">
          {quantity}
        </td>

        <td className="px-4 py-2 text-right">
          {unitPrice.toLocaleString()} FCFA
        </td>

        <td className="px-4 py-2 text-right">
          {total.toLocaleString()} FCFA
        </td>
      </tr>
    );
  })}
</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
