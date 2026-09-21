import { useState, useEffect } from "react";
import { apiRequest } from "../../apiClient";
import {
  FileText, Package, Truck, ShoppingCart, ClipboardList,
  ChevronRight, ArrowLeft, Printer, Download, Eye,
  FileSpreadsheet, Receipt, Search,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { DocumentTemplate } from "../documents/DocumentTemplate";
import type { DocumentData } from "../documents/DocumentTemplate";
import { getPurchaseOrders } from "../../data/purchaseOrdersData";

// ─── Sample data for document types that live in component state ──────────────

const SAMPLE_QUOTES = [
  {
    id: "DEV-001", clientName: "Entreprise ABC", clientEmail: "contact@abc.sn",
    clientPhone: "+221 77 123 45 67", clientAddress: "Avenue Bourguiba, Dakar",
    description: "Équipement informatique pour nouveau bureau",
    items: [
      { id: 1, productName: "Ordinateur portable Dell", quantity: 5, unitPrice: 850000, total: 4250000 },
      { id: 2, productName: "Imprimante HP LaserJet",   quantity: 2, unitPrice: 320000, total: 640000  },
    ],
    subtotal: 4890000, tvaRate: 18, tvaAmount: 880200, total: 5770200,
    status: "En attente", createdDate: "2026-05-05",
  },
  {
    id: "DEV-002", clientName: "Société Sénégalaise BTP", clientEmail: "achat@ssbtp.sn",
    clientPhone: "+221 33 856 44 20", clientAddress: "Zone Industrielle Mbao, Dakar",
    description: "Fournitures de bureau premier trimestre",
    items: [
      { id: 1, productName: "Chaise de bureau ergonomique", quantity: 10, unitPrice: 245000, total: 2450000 },
      { id: 2, productName: "Bureau réglable en hauteur",   quantity: 5,  unitPrice: 380000, total: 1900000 },
    ],
    subtotal: 4350000, tvaRate: 18, tvaAmount: 783000, total: 5133000,
    status: "Validé", createdDate: "2026-04-20",
  },
];

const SAMPLE_CLIENT_ORDERS = [
  {
    id: "BC-C-2024-001", devisRef: "DEV-2024-013", client: "Société Diallo",
    clientEmail: "contact@diallo.sn", orderDate: "2026-04-20", deliveryDate: "2026-05-10",
    clientAddress: "Rue 12, HLM Grand Yoff, Dakar", clientPhone: "+221 77 456 78 90",
    items: [
      { id: 1, productName: "Ordinateur portable Dell", quantity: 5, unitPrice: 850000, total: 4250000 },
      { id: 2, productName: "Souris optique USB",        quantity: 5, unitPrice:  15000, total:   75000 },
    ],
    subtotal: 4325000, tvaRate: 18, tvaAmount: 778500, totalAmount: 5103500,
    status: "confirmed", notes: "Livraison urgente demandée avant le 10 mai.",
  },
  {
    id: "BC-C-2024-002", devisRef: "DEV-2024-014", client: "Entreprise Martin",
    clientEmail: "info@martin.sn", orderDate: "2026-04-22", deliveryDate: "2026-05-15",
    clientAddress: "Almadies, Dakar", clientPhone: "+221 33 820 11 22",
    items: [
      { id: 1, productName: "Téléphone mobile Samsung", quantity: 10, unitPrice: 320000, total: 3200000 },
    ],
    subtotal: 3200000, tvaRate: 18, tvaAmount: 576000, totalAmount: 3776000,
    status: "in_delivery", notes: "",
  },
];

const SAMPLE_CLIENT_INVOICES = [
  {
    id: "FAC-C-001", client: "Société Diallo", clientAddress: "Rue 12, HLM Grand Yoff, Dakar",
    clientPhone: "+221 77 456 78 90", clientEmail: "contact@diallo.sn",
    issueDate: "2026-05-12", dueDate: "2026-06-12",
    items: [
      { id: 1, description: "Ordinateur portable Dell",   quantity: 5, unitPrice: 850000, total: 4250000 },
      { id: 2, description: "Souris optique USB",          quantity: 5, unitPrice:  15000, total:   75000 },
    ],
    subtotal: 4325000, tvaRate: 18, tvaAmount: 778500, total: 5103500,
    status: "unpaid", bdcRef: "BC-C-2024-001",
  },
  {
    id: "FAC-C-002", client: "Entreprise Martin", clientAddress: "Almadies, Dakar",
    clientPhone: "+221 33 820 11 22", clientEmail: "info@martin.sn",
    issueDate: "2026-05-18", dueDate: "2026-06-18",
    items: [
      { id: 1, description: "Téléphone mobile Samsung", quantity: 10, unitPrice: 320000, total: 3200000 },
    ],
    subtotal: 3200000, tvaRate: 18, tvaAmount: 576000, total: 3776000,
    status: "paid", bdcRef: "BC-C-2024-002",
  },
];

const SAMPLE_SUPPLIER_INVOICES = [
  {
    id: "FAC-F-2024-001", supplier: "Fournisseur Informatique SA",
    supplierAddress: "Zone Industrielle, Pikine, Dakar", supplierPhone: "+221 33 854 11 22",
    bdcRef: "BDC-001", blRef: "BL-F-2024-002", issueDate: "2026-04-25", dueDate: "2026-05-25",
    items: [
      { id: 1, description: "Ordinateur portable Dell Inspiron", quantity: 10, unitPrice: 850000, total: 8500000 },
    ],
    subtotal: 8500000, tvaRate: 18, tvaAmount: 1530000, total: 10030000,
    status: "received",
  },
  {
    id: "FAC-F-2024-002", supplier: "Bureau Plus SARL",
    supplierAddress: "Avenue Peytavin, Dakar", supplierPhone: "+221 77 200 30 40",
    bdcRef: "BDC-002", blRef: "BL-F-2024-003", issueDate: "2026-04-28", dueDate: "2026-05-28",
    items: [
      { id: 1, description: "Chaise de bureau ergonomique", quantity: 20, unitPrice: 245000, total: 4900000 },
    ],
    subtotal: 4900000, tvaRate: 18, tvaAmount: 882000, total: 5782000,
    status: "under_review",
  },
];

const SAMPLE_SUPPLIER_DELIVERIES = [
  {
    id: "BL-F-2024-001", bdcRef: "BDC-001", supplier: "Entreprise XYZ",
    supplierAddress: "Zone Franche, Dakar", supplierPhone: "+221 33 800 10 20",
    deliveryDate: "2026-04-18", status: "complete",
    items: [
      { productName: "Ordinateur portable Dell", orderedQty: 10, deliveredQty: 10, remainingQty: 0, unit: "Unité" },
    ],
    notes: "Livraison conforme au bon de commande.",
  },
  {
    id: "BL-F-2024-002", bdcRef: "BDC-001", supplier: "Société ABC",
    supplierAddress: "Rue Carnot, Dakar", supplierPhone: "+221 33 822 44 55",
    deliveryDate: "2026-04-20", status: "complete",
    items: [
      { productName: "Chaise ergonomique", orderedQty: 20, deliveredQty: 20, remainingQty: 0, unit: "Unité" },
      { productName: "Bureau réglable",    orderedQty:  5, deliveredQty:  5, remainingQty: 0, unit: "Unité" },
    ],
    notes: "",
  },
  {
    id: "BL-F-2024-003", bdcRef: "BDC-002", supplier: "Fournisseur GHI",
    supplierAddress: "Parcelles Assainies, Dakar", supplierPhone: "+221 77 345 67 89",
    deliveryDate: "2026-04-22", status: "partial",
    items: [
      { productName: "Imprimante HP LaserJet", orderedQty: 5, deliveredQty: 3, remainingQty: 2, unit: "Unité" },
    ],
    notes: "Livraison partielle — 2 unités en attente de réapprovisionnement.",
  },
];

const SAMPLE_CLIENT_DELIVERIES = [
  {
    id: "BL-C-2024-001", devisRef: "DEV-2024-013", client: "Société Diallo",
    clientAddress: "Rue 12, HLM Grand Yoff, Dakar", clientPhone: "+221 77 456 78 90",
    deliveryDate: "2026-04-18", status: "complete",
    items: [
      { productName: "Ordinateur portable Dell", orderedQty: 5, deliveredQty: 5, remainingQty: 0, unit: "Unité" },
      { productName: "Souris optique USB",        orderedQty: 5, deliveredQty: 5, remainingQty: 0, unit: "Unité" },
    ],
    notes: "Livraison complète — client a signé le bon de réception.",
  },
  {
    id: "BL-C-2024-002", devisRef: "DEV-2024-014", client: "Entreprise Martin",
    clientAddress: "Almadies, Dakar", clientPhone: "+221 33 820 11 22",
    deliveryDate: "2026-04-20", status: "complete",
    items: [
      { productName: "Téléphone mobile Samsung", orderedQty: 10, deliveredQty: 10, remainingQty: 0, unit: "Unité" },
    ],
    notes: "",
  },
  {
    id: "BL-C-2024-003", devisRef: "DEV-2024-015", client: "Client Dupont SARL",
    clientAddress: "Plateau, Dakar", clientPhone: "+221 33 823 55 66",
    deliveryDate: "2026-04-22", status: "partial",
    items: [
      { productName: "Tablette Samsung",  orderedQty: 8, deliveredQty: 5, remainingQty: 3, unit: "Unité" },
    ],
    notes: "3 tablettes restantes livrées sous 5 jours.",
  },
];

// ─── Document catalog types ───────────────────────────────────────────────────

type DocCategory = {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  count: number;
};

type DocListItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
 amount?: string | number;
  status?: string;
  statusColor?: string;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  "En attente":   { label: "En attente",    cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  "Validé":       { label: "Validé",         cls: "bg-green-100 text-green-800 border-green-200"   },
  "Refusé":       { label: "Refusé",         cls: "bg-red-100 text-red-800 border-red-200"         },
  confirmed:      { label: "Confirmé",       cls: "bg-blue-100 text-blue-800 border-blue-200"      },
  in_delivery:    { label: "En livraison",   cls: "bg-purple-100 text-purple-800 border-purple-200"},
  delivered:      { label: "Livré",          cls: "bg-green-100 text-green-800 border-green-200"   },
  cancelled:      { label: "Annulé",         cls: "bg-red-100 text-red-800 border-red-200"         },
  paid:           { label: "Payée",          cls: "bg-green-100 text-green-800 border-green-200"   },
  unpaid:         { label: "Non payée",      cls: "bg-red-100 text-red-800 border-red-200"         },
  partial:        { label: "Partielle",      cls: "bg-yellow-100 text-yellow-800 border-yellow-200"},
  complete:       { label: "Complète",       cls: "bg-green-100 text-green-800 border-green-200"   },
  pending:        { label: "En attente",     cls: "bg-yellow-100 text-yellow-800 border-yellow-200"},
  received:       { label: "Reçue",          cls: "bg-blue-100 text-blue-800 border-blue-200"      },
  under_review:   { label: "En révision",    cls: "bg-orange-100 text-orange-800 border-orange-200"},
  approved:       { label: "Approuvée",      cls: "bg-green-100 text-green-800 border-green-200"   },
  sent:           { label: "Envoyé",         cls: "bg-blue-100 text-blue-800 border-blue-200"      },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

// ─── Map raw data → DocumentData ──────────────────────────────────────────────

function toDocData(category: string, item: any): DocumentData {
  const purchaseOrders = getPurchaseOrders();

  switch (category) {
   case "devis":
    console.log("=== DEVIS SELECTIONNE ===", {
  id: item.id,
  reference: item.reference,
});
  return {
    type: "Devis",
    number: item.reference || item.id,

    date: item.quote_date
      ? new Date(item.quote_date).toLocaleDateString("fr-FR")
      : "—",

    clientName: item.customer_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone: item.customer_detail?.email || "—",

    items: (item.items || []).map((i: any) => ({
      designation: i.product_detail?.name || "—",
      quantity: Number(i.quantity || 0),
      unitPrice: Number(i.unit_price || 0),
      total: Number(i.total_price || 0),
    })),

    subtotal: Number(item.total_amount || 0),

    tvaRate:
      item.items?.length > 0
        ? Number(item.items[0].tax_rate || 0)
        : 0,

    tvaAmount: Number(item.total_tax || 0),

    total: Number(item.total_amount_ttc || 0),

    notes: item.notes || undefined,
  };
    case "client-orders":
  return {
    type: "Bon de commande",
    number: item.reference || item.id,

    date: item.order_date
      ? new Date(item.order_date).toLocaleDateString("fr-FR")
      : "—",

    clientName: item.customer_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone: item.customer_detail?.email || "—",

    items: (item.items || []).map((i: any) => ({
      designation: i.product_detail?.name || "—",
      quantity: Number(i.quantity || 0),
      unitPrice: Number(i.unit_price || 0),
      total: Number(i.total_price || 0),
    })),

    subtotal: Number(item.total_amount || 0),

    tvaRate:
      item.items?.length > 0
        ? Number(item.items[0].tax_rate || 0)
        : 0,

    tvaAmount: Number(item.total_tax || 0),

    total: Number(item.total_amount_ttc || 0),

    notes: item.notes || undefined,
  };
    case "supplier-orders":
  return {
    type: "Bon de commande",

    number: item.reference || item.id,

    date: item.order_date
      ? new Date(item.order_date).toLocaleDateString("fr-FR")
      : "—",

    clientName: item.supplier_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone: item.supplier_detail?.email || "—",

    items: (item.items || []).map((i: any) => ({
      designation: i.product_detail?.name || "—",
      quantity: Number(i.quantity || 0),
      unitPrice: Number(i.unit_price || 0),
      total: Number(i.total_price || 0),
    })),

    subtotal: Number(item.total_amount || 0),

    tvaRate:
      item.items?.length > 0
        ? Number(item.items[0].tax_rate || 0)
        : 0,

    tvaAmount: Number(item.total_tax || 0),

    total: Number(item.total_amount_ttc || 0),

    notes: item.expected_delivery_date
      ? `Date de livraison prévue : ${new Date(
          item.expected_delivery_date
        ).toLocaleDateString("fr-FR")}${
          item.notes ? ` — ${item.notes}` : ""
        }`
      : item.notes || undefined,
  };

    case "client-invoices":
  return {
    type: "Facture",

    number: item.reference || item.id,

    date: item.invoice_date
      ? new Date(item.invoice_date).toLocaleDateString("fr-FR")
      : "—",

    clientName: item.customer_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone: item.customer_detail?.email || "—",

    items: (item.lines || []).map((i: any) => ({
      designation: i.product_detail?.name || "—",
      quantity: Number(i.quantity || 0),
      unitPrice: Number(i.unit_price || 0),
      total: Number(i.total_price || 0),
    })),

    subtotal: Number(item.total_amount || 0),

    tvaRate:
      item.lines?.length > 0
        ? Number(item.lines[0].tax_rate || 0)
        : 0,

    tvaAmount: Number(item.total_tax || 0),

    total: Number(item.total_amount_ttc || 0),

    notes: item.due_date
      ? `Date d'échéance : ${new Date(item.due_date).toLocaleDateString("fr-FR")}${
          item.order_reference
            ? ` — Réf. BDC : ${item.order_reference}`
            : ""
        }`
      : item.order_reference
        ? `Réf. BDC : ${item.order_reference}`
        : undefined,
  };
    case "supplier-invoices":
  return {
    type: "Facture",

    number:
      item.reference ||
      item.invoice_number ||
      item.id,

    date: item.invoice_date
      ? new Date(item.invoice_date).toLocaleDateString("fr-FR")
      : "—",

    clientName:
      item.supplier_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone:
      item.supplier_detail?.email || "—",

    items: (item.lines || []).map((line: any) => ({
      designation:
        line.designation ||
        line.product_detail?.name ||
        "—",

      quantity: Number(line.quantity || 0),

      unitPrice: Number(line.unit_price || 0),

      total: Number(line.total_price || 0),
    })),

    subtotal: Number(item.total_amount || 0),

    tvaRate: Number(item.tva_percent || 0),

    tvaAmount:
      Number(item.total_amount || 0) *
      (Number(item.tva_percent || 0) / 100),

    total: Number(item.total_amount || 0),

    notes: [
      item.due_date
        ? `Échéance : ${new Date(item.due_date).toLocaleDateString("fr-FR")}`
        : null,

      item.purchase_order_reference
        ? `Réf. BDC : ${item.purchase_order_reference}`
        : null,

      item.delivery_reference
        ? `Réf. BL : ${item.delivery_reference}`
        : null,

      item.notes || null,
    ]
      .filter(Boolean)
      .join(" — ") || undefined,
  };

    case "supplier-deliveries":
  return {
    type: "Bordereau de livraison",

    number: item.reference || item.id,

    date: item.delivery_date
      ? new Date(item.delivery_date).toLocaleDateString("fr-FR")
      : "—",

    clientName:
      item.supplier_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone:
      item.supplier_detail?.email || "—",

    items: (item.items || []).map((i: any) => {
  const quantity = Number(i.quantity_received || 0);
  const unitPrice = Number(i.product_detail?.unit_price || 0);
  const total = quantity * unitPrice;

  return {
    designation: `${i.product_detail?.name || "—"} (reçu: ${quantity}/${Number(
      i.quantity_ordered || 0
    )})`,

    quantity,

    unitPrice,

    total,
  };
}),

   subtotal: (item.items || []).reduce((sum: number, i: any) => {
  const quantity = Number(i.quantity_received || 0);
  const unitPrice = Number(i.product_detail?.unit_price || 0);

  return sum + quantity * unitPrice;
}, 0),

tvaRate: 0,

tvaAmount: 0,

total: (item.items || []).reduce((sum: number, i: any) => {
  const quantity = Number(i.quantity_received || 0);
  const unitPrice = Number(i.product_detail?.unit_price || 0);

  return sum + quantity * unitPrice;
}, 0),

    notes: [
      item.purchase_order_reference
        ? `Réf. BDC : ${item.purchase_order_reference}`
        : null,

      item.supplier_delivery_note
        ? `BL fournisseur : ${item.supplier_delivery_note}`
        : null,

      item.notes || null,
    ]
      .filter(Boolean)
      .join(" — ") || undefined,
  };

    case "client-deliveries":
  return {
    type: "Bordereau de livraison",

    number: item.reference || item.id,

    date: item.delivery_date
      ? new Date(item.delivery_date).toLocaleDateString("fr-FR")
      : "—",

    clientName: item.customer_detail?.raison_sociale || "—",

    clientAddress: "—",

    clientPhone: item.customer_detail?.email || "—",

    items: (item.items || []).map((i: any) => ({
      designation: `${i.product_detail?.name || "—"} (livré: ${Number(
        i.quantity_delivered || 0
      )}/${Number(i.quantity_ordered || 0)})`,

      quantity: Number(i.quantity_delivered || 0),

      unitPrice: 0,

      total: 0,
    })),

    subtotal: 0,

    tvaRate: 0,

    tvaAmount: 0,

    total: 0,

    notes:
      item.customer_delivery_note ||
      item.notes ||
      (item.order_reference
        ? `Réf. BDC : ${item.order_reference}`
        : undefined),
  };
    default:
      return {
        type: "Facture", number: "—", date: "—", clientName: "—",
        clientAddress: "—", clientPhone: "—", items: [],
        subtotal: 0, tvaRate: 0, tvaAmount: 0, total: 0,
      };
  }
}

// ─── Get list items per category ─────────────────────────────────────────────

function getListItems(
  category: string,
  djangoQuotes: any[] = [],
  djangoCustomerOrders: any[] = [],
  djangoCustomerInvoices: any[] = [],
  djangoCustomerDeliveries: any[] = [],
  djangoPurchaseOrders: any[] = [],
  djangoSupplierInvoices: any[] = [],
  djangoSupplierDeliveries: any[] = []
) {
  const purchaseOrders = getPurchaseOrders();

  switch (category) {
    case "devis":
  return djangoQuotes.map((q: any) => ({
    id: q.id,
    title: q.reference || "—",
    subtitle: q.customer_detail?.raison_sociale || "—",
    date: q.quote_date
      ? new Date(q.quote_date).toLocaleDateString("fr-FR")
      : "—",
    amount:
      q.total_amount_ttc !== undefined && q.total_amount_ttc !== null
        ? fmt(Number(q.total_amount_ttc))
        : "—",
    status: q.status,
  }));
   case "client-orders":
  return djangoCustomerOrders.map((o: any) => ({
    id: o.id,
    title: o.reference || "—",
    subtitle: o.customer_detail?.raison_sociale || "—",
    date: o.order_date
      ? new Date(o.order_date).toLocaleDateString("fr-FR")
      : "—",
    amount:
      o.total_amount_ttc !== undefined && o.total_amount_ttc !== null
        ? fmt(Number(o.total_amount_ttc))
        : "—",
    status: o.status,
  }));
    case "supplier-orders":
  return djangoPurchaseOrders.map((po: any) => ({
    id: po.id,
    title: po.reference || "—",
    subtitle: po.supplier_detail?.raison_sociale || "—",
    date: po.order_date
      ? new Date(po.order_date).toLocaleDateString("fr-FR")
      : "—",
    amount:
      po.total_amount_ttc !== undefined &&
      po.total_amount_ttc !== null
        ? fmt(Number(po.total_amount_ttc))
        : "—",
    status: po.status,
  }));
   case "client-invoices":
  return djangoCustomerInvoices.map((invoice: any) => ({
    id: invoice.id,
    title: invoice.reference || "—",
    subtitle: invoice.customer_detail?.raison_sociale || "—",
    date: invoice.invoice_date
      ? new Date(invoice.invoice_date).toLocaleDateString("fr-FR")
      : "—",
    amount:
      invoice.total_amount_ttc !== undefined &&
      invoice.total_amount_ttc !== null
        ? fmt(Number(invoice.total_amount_ttc))
        : "—",
    status: invoice.status,
  }));
   case "supplier-invoices":
  return djangoSupplierInvoices.map((invoice: any) => ({
    id: invoice.id,

    title: invoice.reference || invoice.invoice_number || "—",

    subtitle: invoice.supplier_detail?.raison_sociale || "—",

    date: invoice.invoice_date
      ? new Date(invoice.invoice_date).toLocaleDateString("fr-FR")
      : "—",

    amount:
      invoice.total_amount !== undefined &&
      invoice.total_amount !== null
        ? fmt(Number(invoice.total_amount))
        : "—",

    status: invoice.status,
  }));
    case "supplier-deliveries":
  return djangoSupplierDeliveries.map((delivery: any) => ({
    id: delivery.id,

    title: delivery.reference || "—",

    subtitle:
      delivery.supplier_detail?.raison_sociale || "—",

    date: delivery.delivery_date
      ? new Date(delivery.delivery_date).toLocaleDateString("fr-FR")
      : "—",

    amount: "—",

    status: delivery.status,
  }));
    case "client-deliveries":
  return djangoCustomerDeliveries.map((delivery: any) => ({
    id: delivery.id,
    title: delivery.reference || "—",
    subtitle: delivery.customer_detail?.raison_sociale || "—",
    date: delivery.delivery_date
      ? new Date(delivery.delivery_date).toLocaleDateString("fr-FR")
      : "—",
    amount: delivery.items?.reduce(
  (total: number, item: any) =>
    total + Number(item.quantity_delivered || 0),
  0
),
    status: delivery.status,
  }));
    default:
      return [];
  }
}

function getRawItem(
  category: string,
  id: string,
  djangoQuotes: any[] = [],
  djangoCustomerOrders: any[] = [],
  djangoCustomerInvoices: any[] = [],
  djangoCustomerDeliveries: any[] = [],
  djangoPurchaseOrders: any[] = [],
  djangoSupplierInvoices: any[] = [],
  djangoSupplierDeliveries: any[] = []
): any {
  const purchaseOrders = getPurchaseOrders();
  switch (category) {
   case "devis":
  return djangoQuotes.find((x) => x.id === id);
    case "client-orders":
  return djangoCustomerOrders.find((x) => x.id === id);
   case "supplier-orders":
  return djangoPurchaseOrders.find((x) => x.id === id);
    case "client-invoices":
  return djangoCustomerInvoices.find((x) => x.id === id);
    case "supplier-invoices":
  return djangoSupplierInvoices.find((x) => x.id === id);
   case "supplier-deliveries":
  return djangoSupplierDeliveries.find((x) => x.id === id);
    case "client-deliveries":
  return djangoCustomerDeliveries.find((x) => x.id === id);
    default:                  return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentGenerator() {
  const { lang, t } = useLanguage();

  // mode: "catalog" | "list" | "preview"
  type Mode = "catalog" | "list" | "preview";
  const [mode, setMode] = useState<Mode>("catalog");
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [djangoQuotes, setDjangoQuotes] = useState<any[]>([]);
  const [djangoCustomerOrders, setDjangoCustomerOrders] = useState<any[]>([]);
  const [djangoCustomerInvoices, setDjangoCustomerInvoices] = useState<any[]>([]);
  const [djangoCustomerDeliveries, setDjangoCustomerDeliveries] = useState<any[]>([]);
  const [djangoPurchaseOrders, setDjangoPurchaseOrders] = useState<any[]>([]);
  const [djangoSupplierInvoices, setDjangoSupplierInvoices] = useState<any[]>([]);
  const [djangoSupplierDeliveries, setDjangoSupplierDeliveries] = useState<any[]>([]);
  useEffect(() => {
  const loadQuotes = async () => {
    try {
      console.log("=== CHARGEMENT DEVIS DJANGO ===");

      const response = await apiRequest("/v1/quotes/customer/");

      console.log("=== DEVIS DJANGO ===", response);

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setDjangoQuotes(results);
    } catch (error) {
      console.error("=== ERREUR DEVIS DJANGO ===", error);
      setDjangoQuotes([]);
    }
  };

  loadQuotes();
}, []);


useEffect(() => {
  const loadCustomerOrders = async () => {
    try {
      console.log("=== CHARGEMENT BDC CLIENTS DJANGO ===");

      const response = await apiRequest("/v1/customer-orders/");

      console.log("=== BDC CLIENTS DJANGO ===", response);

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setDjangoCustomerOrders(results);
    } catch (error) {
      console.error("=== ERREUR BDC CLIENTS DJANGO ===", error);
      setDjangoCustomerOrders([]);
    }
  };

  loadCustomerOrders();
}, []);

useEffect(() => {
  const loadCustomerInvoices = async () => {
    try {
      console.log("=== CHARGEMENT FACTURES CLIENTS DJANGO ===");

      const response = await apiRequest("/v1/customer-invoices/");

      console.log("=== FACTURES CLIENTS DJANGO ===", response);

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setDjangoCustomerInvoices(results);
    } catch (error) {
      console.error("=== ERREUR FACTURES CLIENTS DJANGO ===", error);
      setDjangoCustomerInvoices([]);
    }
  };

  loadCustomerInvoices();
}, []);

useEffect(() => {
  const loadCustomerDeliveries = async () => {
    try {
      console.log("=== CHARGEMENT BL CLIENTS DJANGO ===");

      const response = await apiRequest("/v1/customer-deliveries/");

      console.log("=== BL CLIENTS DJANGO ===", response);

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setDjangoCustomerDeliveries(results);
    } catch (error) {
      console.error("=== ERREUR BL CLIENTS DJANGO ===", error);
      setDjangoCustomerDeliveries([]);
    }
  };

  loadCustomerDeliveries();
}, []);

useEffect(() => {
  const loadPurchaseOrders = async () => {
    try {
      console.log("=== CHARGEMENT BDC FOURNISSEURS DJANGO ===");

      const response = await apiRequest("/v1/purchase-orders/");

      console.log("=== BDC FOURNISSEURS DJANGO ===", response);

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setDjangoPurchaseOrders(results);
    } catch (error) {
      console.error("=== ERREUR BDC FOURNISSEURS DJANGO ===", error);
      setDjangoPurchaseOrders([]);
    }
  };

  loadPurchaseOrders();
}, []);

useEffect(() => {
  const loadSupplierInvoices = async () => {
    try {
      console.log("=== CHARGEMENT FACTURES FOURNISSEURS DJANGO ===");

      const response = await apiRequest("/v1/invoices/supplier/");

      console.log(
        "=== FACTURES FOURNISSEURS DJANGO ===",
        response
      );

      const results = Array.isArray(response)
        ? response
        : response?.results || [];

      setDjangoSupplierInvoices(results);
    } catch (error) {
      console.error(
        "=== ERREUR FACTURES FOURNISSEURS DJANGO ===",
        error
      );

      setDjangoSupplierInvoices([]);
    }
  };

  loadSupplierInvoices();
}, []);

useEffect(() => {
  const loadSupplierDeliveries = async () => {
    try {
      console.log("=== CHARGEMENT BL FOURNISSEURS DJANGO ===");

      const response = await apiRequest("/v1/deliveries/");

      console.log(
  "=== BL FOURNISSEURS DJANGO ===",
  response
);

const results = Array.isArray(response)
  ? response
  : response?.results || [];

console.log(
  "=== ITEMS BL FOURNISSEURS ===",
  JSON.stringify(
    results.flatMap((delivery: any) => delivery.items || []),
    null,
    2
  )
);

setDjangoSupplierDeliveries(results);
    } catch (error) {
      console.error(
        "=== ERREUR BL FOURNISSEURS DJANGO ===",
        error
      );

      setDjangoSupplierDeliveries([]);
    }
  };

  loadSupplierDeliveries();
}, []);
  const categories: DocCategory[] = [
    {
      id: "devis",
      label: "Devis",
      sublabel: "Propositions commerciales clients",
      icon: <FileSpreadsheet className="w-6 h-6" />,
      color: "text-violet-700",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
      count: djangoQuotes.length,
    },
    {
      id: "client-orders",
      label: "Bons de commande clients",
      sublabel: "Commandes générées depuis devis validés",
      icon: <ClipboardList className="w-6 h-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      count: SAMPLE_CLIENT_ORDERS.length,
    },
    {
      id: "supplier-orders",
      label: "Bons de commande fournisseurs",
      sublabel: "Commandes passées aux fournisseurs",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      count: getPurchaseOrders().length,
    },
    {
      id: "client-invoices",
      label: "Factures clients",
      sublabel: "Factures émises envers les clients",
      icon: <Receipt className="w-6 h-6" />,
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      count: SAMPLE_CLIENT_INVOICES.length,
    },
    {
      id: "supplier-invoices",
      label: "Factures fournisseurs",
      sublabel: "Factures reçues des fournisseurs",
      icon: <FileText className="w-6 h-6" />,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      count: SAMPLE_SUPPLIER_INVOICES.length,
    },
    {
      id: "client-deliveries",
      label: "BL clients",
      sublabel: "Bordereaux de livraison clients",
      icon: <Truck className="w-6 h-6" />,
      color: "text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      count: SAMPLE_CLIENT_DELIVERIES.length,
    },
    {
      id: "supplier-deliveries",
      label: "BL fournisseurs",
      sublabel: "Bordereaux de livraison fournisseurs",
      icon: <Package className="w-6 h-6" />,
      color: "text-teal-700",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      count: SAMPLE_SUPPLIER_DELIVERIES.length,
    },
  ];

  const activeDoc = categories.find((c) => c.id === activeCategory);
const listItems = getListItems(
  activeCategory,
  djangoQuotes,
  djangoCustomerOrders,
  djangoCustomerInvoices,
  djangoCustomerDeliveries,
  djangoPurchaseOrders,
  djangoSupplierInvoices,
  djangoSupplierDeliveries
);
  const filteredList = search
    ? listItems.filter((i) =>
        i.id.toLowerCase().includes(search.toLowerCase()) ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.subtitle ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : listItems;

const selectedRaw = selectedId
  ? getRawItem(
      activeCategory,
      selectedId,
      djangoQuotes,
      djangoCustomerOrders,
      djangoCustomerInvoices,
      djangoCustomerDeliveries,
      djangoPurchaseOrders,
      djangoSupplierInvoices,
      djangoSupplierDeliveries
    )
  : null;
  const selectedDocData: DocumentData | null = selectedRaw
    ? toDocData(activeCategory, selectedRaw)
    : null;

  // ── PDF print handler ────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    const el = document.getElementById("document-content");
    if (!el) return;
    const win = window.open("", "", "width=900,height=750");
    if (!win) return;
    win.document.write(
      `<html><head><title>Document ${selectedId}</title>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        @media print { @page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact; } }
      </style></head><body>${el.innerHTML}</body></html>`
    );
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — CATALOG
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === "catalog") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liasse Comptable</h1>
          <p className="text-gray-500 mt-1">Visualisez, imprimez et téléchargez tous vos documents professionnels</p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearch("");
                setMode("list");
              }}
              className={`group text-left bg-white border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${cat.borderColor} hover:border-opacity-100`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${cat.bgColor} ${cat.color}`}>
                  {cat.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl font-bold ${cat.color}`}>{cat.count}</span>
                  <span className="text-xs text-gray-400">doc.</span>
                </div>
              </div>
              <h3 className={`font-semibold text-gray-900 mb-1 group-hover:${cat.color} transition-colors`}>
                {cat.label}
              </h3>
              <p className="text-xs text-gray-500">{cat.sublabel}</p>
              <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <span>Voir les documents</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
          <FileText className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="font-semibold mb-0.5">Documents synchronisés en temps réel</p>
            <p className="text-xs text-blue-700">
              Tous les documents sont générés automatiquement à partir des données de vos modules (Devis, Commandes, Livraisons, Factures, Paiements).
              Toute mise à jour dans un module se reflète immédiatement ici.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — LIST
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === "list" && activeDoc) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setMode("catalog"); setSearch(""); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeDoc.label}</h1>
            <p className="text-sm text-gray-500">{activeDoc.sublabel}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID, client, référence..."
            className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
        </div>

        {/* Document list */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {filteredList.length === 0 ? (
            <div className="px-6 py-14 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun document trouvé</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Référence", "Destinataire / Fournisseur", "Date", "Montant", "Statut", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
               {filteredList.map((item: DocListItem) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => { setSelectedId(item.id); setMode("preview"); }}
                  >
                    <td className="px-5 py-4 font-mono font-semibold text-gray-900 whitespace-nowrap">
                      {item.title}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{item.date}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {item.amount ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {item.status && <StatusBadge status={item.status} />}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium whitespace-nowrap">
                        <Eye className="w-3.5 h-3.5" /> Aperçu
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — PREVIEW (A4 DocumentTemplate)
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === "preview" && selectedDocData) {

  console.log("=== SELECTED DOC DATA ===", selectedDocData);

  return (
      <div className="min-h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode("list"); setSelectedId(""); }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste
            </button>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                {activeDoc?.label}
              </p>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">
                {selectedDocData.number} — {selectedDocData.clientName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Télécharger PDF
            </button>
          </div>
        </div>

        {/* A4 Document */}
       
        <DocumentTemplate
          data={selectedDocData}
          onDownload={handleDownloadPDF}
          onPrint={() => window.print()}
          onBack={() => { setMode("list"); setSelectedId(""); }}
        />
      </div>
    );
  }

  return null;
}
