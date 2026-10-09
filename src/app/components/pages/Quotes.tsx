import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FileText, Check, X, Eye, Plus, ArrowRight,
  Edit2, Trash2, CheckCircle, XCircle, FileSearch,
  AlertTriangle, MoreVertical, Pencil,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { RejectModal } from "../shared/RejectModal";
import { getProducts, createProduct } from "../../data/productsData";
import type { Product } from "../../data/productsData";
import { addPurchaseOrder } from "../../data/purchaseOrdersData";
import type { PurchaseOrderArticle } from "../../data/purchaseOrdersData";
import { DocumentTemplate } from "../documents/DocumentTemplate";
import { getCustomers } from "../../data/customersData";
import type { Customer } from "../../data/customersData";
import {
  getCustomerQuotes,
  createCustomerQuote,
  updateCustomerQuote,
  deleteCustomerQuote,
   validateCustomerQuote,
   validateCustomerQuoteByCustomer,
   sendCustomerQuoteToCustomer,
   rejectCustomerQuote,
} from "../../data/quotesData";
// ─── Types ────────────────────────────────────────────────────────────────────

type QuoteItem = {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
};

type Quote = {
  id: string;
  clientId: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  description: string;
  items: QuoteItem[];
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  status: "En attente" | "Validé" | "Refusé";
  createdDate: string;
  validatedDate?: string;
  refusedDate?: string;
  refusedReason?: string;
  linkedPurchaseOrderId?: string;
};

// ─── Inline confirm dialog ────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm text-white transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row action dropdown (portal-based to escape table overflow:hidden) ────────

function ActionMenu({
  quote,
  onView,
  onPreview,
  onEdit,
  onValidate,
  onRefuse,
  onDelete,
  canEdit,
  canValidate,
  canDelete,
}: {
  quote: Quote;
  onView: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onValidate: () => void;
  onRefuse: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canValidate: boolean;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Position the fixed menu relative to the trigger button
  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const MENU_W = 220;
    const MENU_H = quote.status === "En attente" ? 210 : 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > MENU_H ? rect.bottom + 4 : rect.top - MENU_H - 4;
    const left = Math.max(8, rect.right - MENU_W);
    setMenuStyle({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      close();
    };
    const onScroll = () => close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  const item = (
    icon: React.ReactNode,
    label: string,
    action: () => void,
    itemCls = ""
  ) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        action();
        close();
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${itemCls}`}
    >
      <span className="flex-shrink-0 w-4 flex items-center justify-center">{icon}</span>
      <span className="leading-none">{label}</span>
    </button>
  );

  const menu = open ? (
    <div
      style={{ position: "fixed", top: menuStyle.top, left: menuStyle.left, width: 220, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 overflow-hidden"
    >
      {/* Voir */}
      {item(
        <Eye className="w-4 h-4 text-blue-500" />,
        "Voir",
        onView,
        "text-blue-600 hover:bg-blue-50"
      )}
      {/* Aperçu */}
      {item(
        <FileSearch className="w-4 h-4 text-indigo-500" />,
        "Aperçu",
        onPreview,
        "text-indigo-600 hover:bg-indigo-50"
      )}

      {quote.status === "En attente" && canEdit && (
        <>
          <div className="border-t border-gray-100 my-1" />
          {/* Modifier */}
          {item(
            <Pencil className="w-4 h-4 text-blue-500" />,
            "Modifier",
            onEdit,
            "text-blue-700 hover:bg-blue-50"
          )}
        </>
      )}
      {quote.status === "En attente" && canValidate && (
        <>
          {!canEdit && <div className="border-t border-gray-100 my-1" />}
          {/* Valider */}
          {item(
            <CheckCircle className="w-4 h-4 text-green-600" />,
            "Valider",
            onValidate,
            "text-green-700 hover:bg-green-50"
          )}
          {/* Refuser */}
          {item(
            <XCircle className="w-4 h-4 text-orange-500" />,
            "Refuser",
            onRefuse,
            "text-orange-600 hover:bg-orange-50"
          )}
        </>
      )}

      {canDelete && (
        <>
          <div className="border-t border-gray-100 my-1" />
          {/* Supprimer */}
          {item(
            <Trash2 className="w-4 h-4 text-red-500" />,
            "Supprimer",
            onDelete,
            "text-red-600 hover:bg-red-50"
          )}
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Render menu in a portal so it escapes table overflow:hidden */}
      {menu && createPortal(menu, document.body)}
    </>
  );
}

// ─── Success toast ────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm max-w-sm">
      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── ProductComboBox ──────────────────────────────────────────────────────────

function ProductComboBox({
  value,
  products,
  onProductChange,
  onAddProduct,
}: {
  value: string;
  products: Product[];
  onProductChange: (
  name: string,
  price?: number,
  productId?: string
) => void;
  onAddProduct: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(value.toLowerCase())
  );

  const isNew =
    value.trim() !== "" &&
    !products.find(
      (p) => p.name.toLowerCase() === value.toLowerCase()
    );

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onProductChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Sélectionner ou saisir un article..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">

          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
            onMouseDown={() => {
             onProductChange(
             p.name,
             Number(p.unit_price || 0),
             p.id
             );
            setOpen(false);
          }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between items-center"
            >
              <span>{p.name}</span>

              <span className="text-xs text-gray-400">
                {Number(p.unit_price || 0).toLocaleString()} FCFA
              </span>
            </button>
          ))}

          {filtered.length === 0 && !isNew && (
            <div className="px-3 py-2 text-sm text-gray-400">
              Aucun produit
            </div>
          )}

          {isNew && (
            <button
              type="button"
              onMouseDown={() => {
                onAddProduct(value.trim());
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 border-t border-gray-200 text-sm flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />

              <span>
                Créer <strong>"{value}"</strong> comme nouveau produit
              </span>
            </button>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Quote["status"], string> = {
  "En attente": "bg-yellow-100 text-yellow-800 border border-yellow-200",
  "Validé":     "bg-green-100 text-green-800 border border-green-200",
  "Refusé":     "bg-red-100 text-red-800 border border-red-200",
};

function Badge({ status }: { status: Quote["status"] }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const newItem = (): QuoteItem => ({
  id: Date.now() + Math.random(),
  productId: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 0,
  total: 0,
});

const emptyForm = {
  clientId: "",
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  clientAddress: "",
  description: "",
  tvaRate: 18,
  quoteDate: "",
};

// ─── Main component ───────────────────────────────────────────────────────────

function mapDjangoQuoteToQuote(data: any): Quote {
  const items: QuoteItem[] = (data.items ?? []).map(
    (item: any, index: number) => ({
      id: index + 1,
      productId: item.product ?? "",
      productName: item.product_detail?.name ?? "",
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
      taxRate: Number(item.tax_rate ?? 0),
      total: Number(item.total_price ?? 0),
    })
  );

  const subtotal = items.reduce(
  (sum, item) => sum + item.total,
  0
);

const tvaAmount = items.reduce(
  (sum, item) =>
    sum + (item.total * item.taxRate) / 100,
  0
);

const total = subtotal + tvaAmount;

const tvaRate =
  subtotal > 0
    ? (tvaAmount / subtotal) * 100
    : 0;

  return {
    id: data.id,
     reference: data.reference ?? "",
    clientId: data.customer ?? "",
    clientName: data.customer_detail?.raison_sociale ?? "",
    clientEmail: data.customer_detail?.email ?? "",
    clientPhone: "",
    clientAddress: "",
    description: data.notes ?? "",
    refusedReason: data.rejection_reason ?? "",
    items,
    subtotal,
    tvaRate,
    tvaAmount,
    total,
   status:
  data.status === "VALIDATED"
    ? "Validé"
    : data.status === "REJECTED"
    ? "Refusé"
    : "En attente",
    createdDate: data.quote_date ?? "",
  };
}

export function Quotes() {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
  const { addNotification } = useAppData();
  const canCreate   = hasPermission("quotes:create");
  const canEdit     = hasPermission("quotes:edit");
  const canValidate = hasPermission("quotes:validate");
  const canDelete   = hasRole(["admin"]);
  const isViewOnly  = !canCreate && !canEdit && !canValidate;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
  const loadProducts = async () => {
    try {
      const data = await getProducts();

      console.log("=== PRODUITS DEVIS DJANGO ===", data);

      setProducts(data);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT PRODUITS DEVIS ===",
        error
      );
    }
  };

  loadProducts();
}, []);

// CLIENTS

useEffect(() => {
  const loadCustomers = async () => {
    try {
      console.log("=== CLIENTS DEVIS DJANGO ===");

      const data = await getCustomers();

      console.log("=== CLIENTS DEVIS DJANGO RÉSULTATS ===", data);

      setCustomers(data);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT CLIENTS DEVIS ===",
        error
      );
    }
  };

  loadCustomers();
}, []);

useEffect(() => {
  const loadQuotes = async () => {
    try {
      console.log("=== DEVIS CLIENTS DJANGO ===");

     const data = await getCustomerQuotes();

console.log(
  "=== DEVIS CLIENTS DJANGO RÉPONSE COMPLÈTE ===",
  JSON.stringify(data, null, 2)
);

const mappedQuotes = data.map(mapDjangoQuoteToQuote);

console.log(
  "=== DEVIS CLIENTS MAPPÉS ===",
  JSON.stringify(mappedQuotes, null, 2)
);

setQuotes(mappedQuotes);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT DEVIS CLIENTS ===",
        error
      );
    }
  };

  loadQuotes();
}, []);

  // ── Quotes data ───────────────────────────────────────────────────────────
  const [quotes, setQuotes] = useState<Quote[]>([
    {
      id: "DEV-001",
      clientId: "",
      reference: "DEV-001",
      clientName: "Entreprise ABC",
      clientEmail: "contact@abc.sn",
      clientPhone: "+221 77 123 45 67",
      clientAddress: "Avenue Bourguiba, Dakar",
      description: "Équipement informatique pour nouveau bureau",
      items: [
       {
  id: 1,
  productId: "",
  productName: "Ordinateur portable Dell",
  quantity: 5,
  unitPrice: 850000,
  taxRate: 0,
  total: 4250000,
},

{
  id: 2,
  productId: "",
  productName: "Imprimante HP LaserJet",
  quantity: 2,
  unitPrice: 320000,
  taxRate: 0,
  total: 640000,
},
      ],
      subtotal: 4890000, tvaRate: 18, tvaAmount: 880200, total: 5770200,
      status: "En attente", createdDate: "2026-05-05",
    },
    {
      id: "DEV-002",
      clientId: "",
       reference: "DEV-002",
      clientName: "Société Sénégalaise BTP",
      clientEmail: "achat@ssbtp.sn",
      clientPhone: "+221 33 856 44 20",
      clientAddress: "Zone Industrielle Mbao, Dakar",
      description: "Fournitures de bureau premier trimestre",
      items: [
       {
  id: 1,
  productId: "",
  productName: "Chaise de bureau ergonomique",
  quantity: 10,
  unitPrice: 245000,
  taxRate: 0,
  total: 2450000,
},
      ],
      subtotal: 2450000, tvaRate: 18, tvaAmount: 441000, total: 2891000,
      status: "Validé", createdDate: "2026-04-20", validatedDate: "2026-04-25",
      linkedPurchaseOrderId: "BDC-001",
    },
  ]);

  // ── UI mode ───────────────────────────────────────────────────────────────
  type Mode = "list" | "create" | "edit" | "detail" | "preview";
  const [mode, setMode] = useState<Mode>("list");
  const [selected, setSelected] = useState<Quote | null>(null);

  // ── Confirm / refuse dialog state ─────────────────────────────────────────
  const [confirm, setConfirm] = useState<{
    message: string;
    confirmLabel: string;
    confirmClass: string;
    onConfirm: () => void;
  } | null>(null);

  const [refuseTarget, setRefuseTarget] = useState<string | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => setToast(msg);

  const ask = (
    message: string,
    confirmLabel: string,
    confirmClass: string,
    onConfirm: () => void
  ) => setConfirm({ message, confirmLabel, confirmClass, onConfirm });

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<QuoteItem[]>([newItem()]);
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tvaAmt   = subtotal * (form.tvaRate / 100);
  const totalAmt = subtotal + tvaAmt;

  // ── Item helpers ──────────────────────────────────────────────────────────
  const updateItem = (
  id: number,
  name: string,
  price?: number,
  productId?: string
) =>
  setItems((prev) =>
    prev.map((item) => {
      if (item.id !== id) return item;

      const unitPrice =
        price !== undefined ? price : item.unitPrice;

      return {
        ...item,
        productId:
          productId !== undefined
            ? productId
            : item.productId,
        productName: name,
        unitPrice,
        total: item.quantity * unitPrice,
      };
    })
  );
  const changeItem = (id: number, field: "quantity" | "unitPrice", val: number) =>
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );

  const addItemRow    = () => setItems((p) => [...p, newItem()]);
  const removeItemRow = (id: number) => setItems((p) => p.filter((i) => i.id !== id));

  const handleAddNewProduct = async (name: string) => {
  try {
    const newProduct = await createProduct({
      code: `PROD-${Date.now()}`,
      name,
      description: "",
      unit: "piece",
      unit_price: "0",
      category: "Autre",
      is_active: true,
    });

    console.log("=== PRODUIT CRÉÉ DEPUIS DEVIS ===", newProduct);

    const djangoProducts = await getProducts();

    setProducts(djangoProducts);

  } catch (error) {
    console.error("=== ERREUR AJOUT PRODUIT DEPUIS DEVIS ===", error);
  }
};

  // ── Open / close helpers ──────────────────────────────────────────────────
  const openCreate = () => { setFormError(null); setForm(emptyForm); setItems([newItem()]); setSelected(null); setMode("create"); };

  const openEdit = (q: Quote) => {
    setFormError(null);
    setForm({ clientId: q.clientId, clientName: q.clientName, clientEmail: q.clientEmail, clientPhone: q.clientPhone,
              clientAddress: q.clientAddress, description: q.description, tvaRate: q.tvaRate, quoteDate: q.createdDate,});
    setItems(q.items.map((i) => ({ ...i })));
    setSelected(q);
    setMode("edit");
  };

  const goList    = () => { setMode("list");   setSelected(null); };
  const goDetail  = (q: Quote) => { setSelected(q); setMode("detail"); };
  const goPreview = (q: Quote) => { setSelected(q); setMode("preview"); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!form.clientName.trim() || !form.clientEmail.trim()) return "Nom du client et email obligatoires.";
    if (items.some((i) => !i.productName.trim())) return "Tous les articles doivent avoir un nom.";
    return null;
  };

  const handleCreate = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setFormError(null);

    const payload = {
  customer: form.clientId,
  quote_date: new Date().toISOString().split("T")[0],
  valid_until: new Date().toISOString().split("T")[0],
  currency: "XOF",
  notes: form.description,
  items: items.map((item) => ({
    product: item.productId,
    quantity: String(item.quantity),
    unit_price: String(item.unitPrice),
    tax_rate: String(item.taxRate),
  })),
};

console.log(
  "=== PAYLOAD CRÉATION DEVIS ===",
  JSON.stringify(payload, null, 2)
);
try {
  const createdQuote = await createCustomerQuote(payload);

  console.log(
    "=== DEVIS CRÉÉ DANS DJANGO ===",
    createdQuote
  );
} catch (error) {
  console.error(
    "=== ERREUR CRÉATION DEVIS DJANGO ===",
    error
  );
}
    
    goList();
    showToast("Devis créé avec succès !");
  };

 const handleUpdate = async () => {
  const err = validateForm();

  if (err) {
    setFormError(err);
    return;
  }

  setFormError(null);

  if (!selected) return;

  const payload = {
  customer: form.clientId,
  quote_date: selected.createdDate,
  valid_until: selected.createdDate,
  currency: "XOF",
  notes: form.description,
  items: items.map((item) => ({
    product: item.productId,
    quantity: String(item.quantity),
    unit_price: String(item.unitPrice),
    tax_rate: String(item.taxRate),
  })),
};

  console.log("=== MODIFICATION DEVIS ===");
  console.log("ID UUID DJANGO :", selected.id);
  console.log("PAYLOAD PUT :", JSON.stringify(payload, null, 2));

  try {
    const updatedQuote = await updateCustomerQuote(
      selected.id,
      payload
    );

    console.log("=== DEVIS MODIFIÉ DANS DJANGO ===", updatedQuote);

    const mappedQuote = mapDjangoQuoteToQuote(updatedQuote);

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === selected.id ? mappedQuote : q
      )
    );

    goList();
    setSelected(null);

    showToast("Devis modifié avec succès !");
  } catch (error) {
    console.error("=== ERREUR MODIFICATION DEVIS DJANGO ===", error);
    setFormError("Impossible de modifier le devis.");
  }
};

  const handleDelete = (id: string) => {
  ask(
    "Supprimer ce devis définitivement ? Cette action est irréversible.",
    "Supprimer",
    "bg-red-600 hover:bg-red-700",
    async () => {
      try {
        console.log("=== SUPPRESSION DEVIS DJANGO ===");
        console.log("ID UUID DJANGO :", id);

        await deleteCustomerQuote(id);

        console.log("=== DEVIS SUPPRIMÉ DANS DJANGO ===");

        setQuotes((prev) =>
          prev.filter((q) => q.id !== id)
        );

        setConfirm(null);
        goList();

        showToast("Devis supprimé avec succès.");
      } catch (error) {
        console.error(
          "=== ERREUR SUPPRESSION DEVIS DJANGO ===",
          error
        );

        setConfirm(null);
        showToast("Impossible de supprimer le devis.");
      }
    }
  );
};

  const handleValidate = (quoteId: string) => {
  const q = quotes.find((x) => x.id === quoteId);
  if (!q) return;

  ask(
    `Valider le devis ${quoteId} ? Un bon de commande sera automatiquement généré dans la liste des BDC.`,
    "Valider et générer BDC",
    "bg-green-600 hover:bg-green-700",
    async () => {
      try {
        console.log("=== VALIDATION CLIENT DU DEVIS DJANGO ===");
        console.log("Quote ID :", quoteId);

        // 1. Enregistrer l'accord du client
       // 1. Envoyer le devis au client
const sentQuote = await sendCustomerQuoteToCustomer(
  quoteId,
  "Veuillez confirmer votre accord sur ce devis."
);

console.log("=== DEVIS ENVOYÉ AU CLIENT ===");
console.log(sentQuote);

// 2. Enregistrer l'accord du client
const validatedQuote = await validateCustomerQuoteByCustomer(
  quoteId,
  "Accord client communiqué au Service Commercial."
);

console.log("=== DEVIS VALIDÉ PAR LE CLIENT ===");
console.log(validatedQuote);

// 3. Transformer le devis validé en BDC
const customerOrder = await validateCustomerQuote(quoteId);

console.log("=== BDC CLIENT CRÉÉ PAR DJANGO ===");
console.log(customerOrder);

        console.log("=== BDC CLIENT CRÉÉ PAR DJANGO ===");
        console.log(customerOrder);

        // 3. Mettre à jour l'affichage local du devis
        setQuotes((prev) =>
          prev.map((x) =>
            x.id === quoteId
              ? {
                  ...x,
                  status: "Validé",
                  validatedDate: new Date().toISOString().split("T")[0],
                }
              : x
          )
        );

        setConfirm(null);
        setMode("list");
        setSelected(null);

        showToast(
          `Devis ${quoteId} validé et BDC créé avec succès par Django.`
        );
      } catch (error) {
        console.error(
          "Erreur validation/conversion devis client Django :",
          error
        );

        showToast(
          "Impossible de valider le devis ou de générer le BDC."
        );
      }
    }
  );
};
  const handleRefuseConfirm = async (
  quoteId: string,
  reason: string
) => {
  try {
    console.log("=== REFUS DEVIS DJANGO ===");
    console.log("ID UUID DJANGO :", quoteId);
    console.log("MOTIF :", reason);

    // 1. Mettre le devis en attente de réponse
    const sentQuote = await sendCustomerQuoteToCustomer(
      quoteId,
      "Veuillez confirmer votre accord ou votre refus sur ce devis."
    );

    console.log("=== DEVIS ENVOYÉ AU CLIENT ===");
    console.log(sentQuote);

    // 2. Enregistrer le refus du client
    const rejectedQuote = await rejectCustomerQuote(
      quoteId,
      reason
    );
    console.log("=== RÉPONSE DJANGO APRÈS REFUS ===");
console.log(JSON.stringify(rejectedQuote, null, 2));
console.log("=== MOTIF ENVOYÉ ===", reason);
console.log(
  "=== rejection_reason DJANGO ===",
  rejectedQuote?.rejection_reason
);

    console.log(
      "=== DEVIS REFUSÉ DANS DJANGO ===",
      rejectedQuote
    );

    // 3. Mettre à jour l'affichage React
    const mappedQuote = mapDjangoQuoteToQuote(rejectedQuote);

    setQuotes((prev) =>
      prev.map((x) =>
        x.id === quoteId
          ? {
              ...mappedQuote,
              refusedDate: new Date()
                .toISOString()
                .split("T")[0],
              refusedReason: reason,
            }
          : x
      )
    );

    addNotification({
      type: "error",
      title: "Devis rejeté",
      message: `Le devis ${quoteId} a été rejeté. Motif : ${reason}`,
      module: "devis",
    });

    setRefuseTarget(null);
    setMode("list");
    setSelected(null);

    showToast(`Devis ${quoteId} refusé.`);
  } catch (error) {
    console.error(
      "=== ERREUR REFUS DEVIS DJANGO ===",
      error
    );

    showToast("Impossible de refuser le devis.");
  }
};


// ── Document preview ──────────────────────────────────────────────────────
const getDocData = (q: Quote) => ({
  type: "Devis" as const,
  number: q.id,
  date: q.createdDate,

  // Informations de l'entreprise
  companyName: "",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",

  // Informations du client
  clientName: q.clientName,
  clientAddress: q.clientAddress || q.clientEmail,
  clientPhone: q.clientPhone,

  items: q.items.map((i) => ({
    designation: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    total: i.total,
  })),

  subtotal: q.subtotal,
  tvaRate: q.tvaRate,
  tvaAmount: q.tvaAmount,
  total: q.total,
  notes: q.description || undefined,
});

  const handleDownloadPDF = () => {
    const el = document.getElementById("document-content");
    if (!el) return;
    const win = window.open("", "", "width=900,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>Devis ${selected?.id}</title><style>body{margin:0;font-family:Arial,sans-serif}@media print{@page{size:A4;margin:0}}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ── Form items section ────────────────────────────────────────────────────
  const renderItems = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Articles *</span>
        <button type="button" onClick={addItemRow} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
          <Plus className="w-4 h-4" /> Ajouter un article
        </button>
      </div>

      <div className="grid grid-cols-12 gap-2 px-3">
        <div className="col-span-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Article</div>
        <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantité</div>
        <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix Unitaire</div>
        <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</div>
        <div className="col-span-1" />
      </div>

      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2">
          <div className="col-span-5">
            <ProductComboBox
              value={item.productName}
              products={products}
              onProductChange={(name, price, productId) =>
  updateItem(item.id, name, price, productId)
}
              onAddProduct={(name) => { handleAddNewProduct(name); updateItem(item.id, name); }}
            />
          </div>
          <div className="col-span-2">
            <input type="number" min="1" value={item.quantity}
              onChange={(e) => changeItem(item.id, "quantity", Math.max(1, Number(e.target.value)))}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="col-span-2">
            <input type="number" min="0" value={item.unitPrice}
              onChange={(e) => changeItem(item.id, "unitPrice", Number(e.target.value))}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="col-span-2">
            <div className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm text-right font-medium">
              {item.total.toLocaleString()}
            </div>
          </div>
          <div className="col-span-1 flex justify-center">
            {items.length > 1 && (
              <button type="button" onClick={() => removeItemRow(item.id)} className="text-red-500 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-1">
        <div className="w-72 text-sm space-y-1 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between"><span className="text-gray-500">Sous-total HT</span><span>{subtotal.toLocaleString()} FCFA</span></div>
          <div className="flex justify-between"><span className="text-gray-500">TVA ({form.tvaRate}%)</span><span>{tvaAmt.toLocaleString()} FCFA</span></div>
          <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold"><span>Total TTC</span><span>{totalAmt.toLocaleString()} FCFA</span></div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Inline confirmation dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmClass={confirm.confirmClass}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Refuse reason modal */}
      <RejectModal
        isOpen={!!refuseTarget}
        onClose={() => setRefuseTarget(null)}
        onConfirm={(reason) => {
          if (!refuseTarget) return;
          handleRefuseConfirm(refuseTarget, reason);
        }}
        documentRef={refuseTarget ?? undefined}
        documentType="devis"
      />

      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Gestion des Devis</h1>
          <p className="text-gray-600 mt-1">Créez et gérez les devis clients</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5" /> Nouveau Devis
          </button>
        )}
      </div>

      {isViewOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <Eye className="w-4 h-4 shrink-0" />
          Vous êtes en mode consultation uniquement. Vous ne pouvez pas créer, modifier ou valider des devis.
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total devis",  val: quotes.length,                                          cls: "text-gray-900" },
          { label: "En attente",   val: quotes.filter((q) => q.status === "En attente").length,  cls: "text-yellow-600" },
          { label: "Validés",      val: quotes.filter((q) => q.status === "Validé").length,      cls: "text-green-600" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["N° Devis", "Client", "Description", "Montant TTC", "Date", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">Aucun devis</td></tr>
              )}
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm text-gray-900">{q.reference}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{q.clientName}</div>
                    <div className="text-xs text-gray-500">{q.clientEmail}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <span className="text-sm text-gray-500 truncate block">{q.description || "—"}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {q.total.toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(q.createdDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge status={q.status} />
                  </td>
                  {/* ── Dropdown action menu ── */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ActionMenu
                      quote={q}
                      onView={() => goDetail(q)}
                      onPreview={() => goPreview(q)}
                      onEdit={() => openEdit(q)}
                      onValidate={() => handleValidate(q.id)}
                      onRefuse={() => setRefuseTarget(q.id)}
                      onDelete={() => handleDelete(q.id)}
                      canEdit={canEdit}
                      canValidate={canValidate}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CREATE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {mode === "create" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau Devis</h2>
              <button onClick={goList}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                 { label: "Client *", key: "clientName", type: "select", ph: "Sélectionner un client" },
                  { label: "Email *",          key: "clientEmail",  type: "email", ph: "email@exemple.com" },
                  { label: "Téléphone",        key: "clientPhone",  type: "tel",   ph: "+221 77 123 45 67" },
                  { label: "Adresse",          key: "clientAddress",type: "text",  ph: "Ville, quartier..." },
                  { label: "Description",      key: "description",  type: "text",  ph: "Objet du devis..." },
                ].map(({ label, key, type, ph }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    {key === "clientName" ? (
  <select
    value={form.clientId}
   onChange={(e) => {
  const customer = customers.find(
    (c) => String(c.id) === String(e.target.value)
  );

  console.log("=== CLIENT SÉLECTIONNÉ ===", customer);

  if (!customer) return;

  setForm((prev) => ({
    ...prev,
    clientId: customer.id,
    clientName: customer.raison_sociale,
    clientEmail: customer.email || "",
    clientPhone: customer.phone || "",
    clientAddress: customer.address || "",
  }));
}}
    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Sélectionner un client</option>

    {customers.map((customer) => (
      <option key={customer.id} value={customer.id}>
        {customer.raison_sociale}
      </option>
    ))}
  </select>
) : (
  <input
    type={type}
    value={(form as any)[key]}
    placeholder={ph}
    onChange={(e) =>
      setForm({ ...form, [key]: e.target.value })
    }
    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
)}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
                  <input type="number" value={form.tvaRate}
                    onChange={(e) => setForm({ ...form, tvaRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              {renderItems()}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
              <div className="flex justify-end gap-3">
                <button onClick={goList} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
                <button onClick={handleCreate} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition">Créer le Devis</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {mode === "edit" && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Modifier le Devis {selected.id}</h2>
              <button onClick={goList}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                
               {/* CLIENT */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nom du Client *
  </label>

  <select
    value={form.clientId}
    onChange={(e) => {
      const customer = customers.find(
        (c) => String(c.id) === String(e.target.value)
      );

      console.log("=== CLIENT SÉLECTIONNÉ ===", customer);

      if (!customer) return;

      setForm((prev) => ({
        ...prev,
        clientId: customer.id,
        clientName: customer.raison_sociale,
        clientEmail: customer.email || "",
        clientPhone: customer.phone || "",
        clientAddress: customer.address || "",
      }));
    }}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
  >
    <option value="">Sélectionner un client</option>

    {customers.map((customer) => (
      <option key={customer.id} value={customer.id}>
        {customer.raison_sociale}
      </option>
    ))}
  </select>
</div>

{/* EMAIL */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Email *
  </label>

  <input
    type="email"
    value={form.clientEmail}
    onChange={(e) =>
      setForm({ ...form, clientEmail: e.target.value })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
  />
</div>

{/* TÉLÉPHONE */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Téléphone
  </label>

  <input
    type="tel"
    value={form.clientPhone}
    onChange={(e) =>
      setForm({ ...form, clientPhone: e.target.value })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
  />
</div>

{/* ADRESSE */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Adresse
  </label>

  <input
    type="text"
    value={form.clientAddress}
    onChange={(e) =>
      setForm({ ...form, clientAddress: e.target.value })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
  />
</div>

{/* DESCRIPTION */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Description
  </label>

  <input
    type="text"
    value={form.description}
    onChange={(e) =>
      setForm({ ...form, description: e.target.value })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
  />
</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
                  <input type="number" value={form.tvaRate}
                    onChange={(e) => setForm({ ...form, tvaRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
              </div>
              {renderItems()}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
              <div className="flex justify-end gap-3">
                <button onClick={goList} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {mode === "detail" && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Devis {selected.reference}</h2>
                <Badge status={selected.status} />
                {selected.linkedPurchaseOrderId && (
                  <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                    BDC: {selected.linkedPurchaseOrderId}
                  </span>
                )}
              </div>
              <button onClick={goList}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-y-2 text-sm">
                <div><span className="text-gray-500">Client : </span>{selected.clientName}</div>
                <div><span className="text-gray-500">Email : </span>{selected.clientEmail}</div>
                <div><span className="text-gray-500">Téléphone : </span>{selected.clientPhone || "—"}</div>
                <div><span className="text-gray-500">Adresse : </span>{selected.clientAddress || "—"}</div>
                <div><span className="text-gray-500">Date création : </span>{new Date(selected.createdDate).toLocaleDateString("fr-FR")}</div>
                {selected.validatedDate && <div><span className="text-gray-500">Validé le : </span>{new Date(selected.validatedDate).toLocaleDateString("fr-FR")}</div>}
                {selected.refusedReason && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Motif du refus : </span>
                    <span className="text-red-700">{selected.refusedReason}</span>
                  </div>
                )}
              </div>

              {selected.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Objet</p>
                  <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Désignation", "Qté", "Prix U.", "Total"].map((h, i) => (
                        <th key={h} className={`px-4 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider ${i > 0 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-gray-900">{item.productName}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{item.unitPrice.toLocaleString()} FCFA</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{item.total.toLocaleString()} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-72 text-sm border border-gray-200 rounded-lg p-4 space-y-1 bg-gray-50">
                  <div className="flex justify-between"><span className="text-gray-500">Sous-total HT</span><span>{selected.subtotal.toLocaleString()} FCFA</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">TVA ({selected.tvaRate}%)</span><span>{selected.tvaAmount.toLocaleString()} FCFA</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-gray-900"><span>Total TTC</span><span>{selected.total.toLocaleString()} FCFA</span></div>
                </div>
              </div>

              {selected.linkedPurchaseOrderId && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  Bon de commande généré : <strong>{selected.linkedPurchaseOrderId}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 gap-3 flex-wrap">
              <div className="flex gap-2">
                {selected.status === "En attente" && canEdit && (
                  <button onClick={() => openEdit(selected)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 text-gray-700 transition">
                    <Edit2 className="w-4 h-4" /> Modifier
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => goPreview(selected)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 text-gray-700 transition">
                  <FileSearch className="w-4 h-4" /> Aperçu PDF
                </button>
                <button onClick={goList} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 text-gray-700 transition">Fermer</button>
                {selected.status === "En attente" && canValidate && (
                  <>
                    <button onClick={() => { setRefuseTarget(selected.id); setMode("list"); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition">
                      <X className="w-4 h-4" /> Refuser
                    </button>
                    <button onClick={() => handleValidate(selected.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg text-sm hover:from-green-700 hover:to-green-600 transition">
                      <Check className="w-4 h-4" /> Valider → BDC
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DOCUMENT PREVIEW (A4)
      ══════════════════════════════════════════════════════════════════ */}
      {mode === "preview" && selected && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 overflow-y-auto">
          <div className="min-h-full w-full max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Aperçu document</p>
                <h2 className="text-xl font-semibold text-white">Devis {selected.reference} — {selected.clientName}</h2>
              </div>
              <button onClick={goList}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                <X className="w-4 h-4" /> Fermer
              </button>
            </div>
            <DocumentTemplate
              data={getDocData(selected)}
              onDownload={handleDownloadPDF}
              onPrint={() => window.print()}
              onBack={() => setMode("detail")}
            />
          </div>
        </div>
      )}

    </div>
  );
}
