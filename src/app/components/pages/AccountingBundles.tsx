import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Download,
  Eye,
  FileText,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { apiRequest } from "../../apiClient";
import { useLanguage } from "../../context/LanguageContext";
import { DocumentTemplate } from "../documents/DocumentTemplate";
import type { DocumentData } from "../documents/DocumentTemplate";

type RecordData = Record<string, any>;
type DocumentKind = "order" | "delivery" | "invoice";
type BundleDocument = {
  id: string;
  kind: DocumentKind;
  reference: string;
  date: string;
  raw: RecordData;
};
type AccountingBundle = {
  id: string;
  partyType: "customer" | "supplier";
  partyName: string;
  party: RecordData;
  orders: BundleDocument[];
  deliveries: BundleDocument[];
  invoices: BundleDocument[];
  operations: BundleDocument[][];
  documents: BundleDocument[];
};
type BundleData = {
  company: RecordData | null;
  customers: RecordData[];
  suppliers: RecordData[];
  customerOrders: RecordData[];
  customerDeliveries: RecordData[];
  customerInvoices: RecordData[];
  supplierOrders: RecordData[];
  supplierDeliveries: RecordData[];
  supplierInvoices: RecordData[];
};

const emptyData: BundleData = {
  company: null,
  customers: [],
  suppliers: [],
  customerOrders: [],
  customerDeliveries: [],
  customerInvoices: [],
  supplierOrders: [],
  supplierDeliveries: [],
  supplierInvoices: [],
};

async function getAllResults(endpoint: string): Promise<RecordData[]> {
  let response = await apiRequest(endpoint);
  const results: RecordData[] = [];
  let pages = 0;

  while (response && pages < 100) {
    if (Array.isArray(response)) {
      results.push(...response);
      break;
    }
    if (Array.isArray(response.results)) results.push(...response.results);
    if (!response.next || typeof response.next !== "string") break;

    const nextUrl = new URL(response.next, window.location.origin);
    response = await apiRequest(`${nextUrl.pathname}${nextUrl.search}`);
    pages += 1;
  }

  return results;
}

function getIdentifier(value: any): string {
  if (value && typeof value === "object") return String(value.id ?? "");
  return value === null || value === undefined ? "" : String(value);
}

function getPartyId(document: RecordData, partyType: "customer" | "supplier"): string {
  const detail = document[`${partyType}_detail`];
  return getIdentifier(document[partyType] ?? document[`${partyType}_id`] ?? detail);
}

function getReference(document: RecordData): string {
  return String(document.reference ?? document.invoice_number ?? document.id ?? "");
}

function collectParties(
  primary: RecordData[],
  records: RecordData[],
  partyType: "customer" | "supplier"
): RecordData[] {
  const parties = new Map<string, RecordData>();
  for (const party of primary) {
    const id = getIdentifier(party);
    if (id) parties.set(id, party);
  }
  for (const record of records) {
    const id = getPartyId(record, partyType);
    if (!id || parties.has(id)) continue;
    const detail = record[`${partyType}_detail`];
    parties.set(id, detail && typeof detail === "object"
      ? detail
      : { id, raison_sociale: record[`${partyType}_name`] ?? "" });
  }
  return Array.from(parties.values());
}

function getDocumentDate(document: RecordData, kind: DocumentKind): string {
  const value = kind === "order"
    ? document.order_date
    : kind === "delivery"
      ? document.delivery_date
      : document.invoice_date;
  return value ? String(value) : "";
}

function getLinkedId(record: RecordData, keys: string[]): string {
  for (const key of keys) {
    const value = getIdentifier(record[key]);
    if (value) return value;
  }
  return "";
}

function getLinkedReference(record: RecordData, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value !== "object") return String(value);
    if (value && typeof value === "object" && value.reference) return String(value.reference);
  }
  return "";
}

function linkedTo(
  document: RecordData,
  idKeys: string[],
  referenceKeys: string[],
  target: RecordData
): boolean {
  const linkedId = getLinkedId(document, idKeys);
  if (linkedId) return linkedId === getIdentifier(target);

  const linkedReference = getLinkedReference(document, referenceKeys);
  return Boolean(linkedReference && linkedReference === getReference(target));
}

function makeDocument(
  kind: DocumentKind,
  partyType: "customer" | "supplier",
  record: RecordData,
  partyName: string,
  company: RecordData | null,
  party: RecordData
): DocumentData {
  const lines: RecordData[] = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.lines)
      ? record.lines
      : [];
  const isDelivery = kind === "delivery";
  const isInvoice = kind === "invoice";
  const items = lines.map((line) => {
    const quantity = Number(
      isDelivery
        ? line.quantity_delivered ?? line.quantity_received ?? 0
        : line.quantity ?? 0
    );
    const unitPrice = Number(
      line.unit_price ?? line.product_detail?.unit_price ?? 0
    );
    const total = Number(
      line.total_incl_tax ?? line.total_price ?? (quantity * unitPrice)
    );
    const productName = line.product_detail?.name ?? line.designation ?? "—";
    const orderedQuantity = line.quantity_ordered;

    return {
      designation: isDelivery && orderedQuantity !== undefined
        ? `${productName} (livré: ${quantity}/${Number(orderedQuantity)})`
        : productName,
      quantity,
      unitPrice,
      total,
    };
  });
  const subtotal = Number(
    record.total_amount ?? record.total_amount_ht ??
    items.reduce((sum, item) => sum + item.total, 0)
  );
  const taxRate = Number(record.tva_percent ?? lines[0]?.tax_rate ?? 0);
  const taxAmount = Number(record.total_tax ?? subtotal * taxRate / 100);
  const total = Number(record.total_amount_ttc ?? subtotal + taxAmount);
  const rawDate = getDocumentDate(record, kind);
  const documentType = kind === "order"
    ? "Bon de commande"
    : isDelivery
      ? "Bordereau de livraison"
      : "Facture";
  const notes = [
    record.notes,
    record.purchase_order_reference ? `Réf. BDC : ${record.purchase_order_reference}` : null,
    record.order_reference ? `Réf. BDC : ${record.order_reference}` : null,
    record.delivery_reference ? `Réf. BL : ${record.delivery_reference}` : null,
    record.supplier_delivery_note,
    record.customer_delivery_note,
    record.due_date ? `Échéance : ${new Date(record.due_date).toLocaleDateString("fr-FR")}` : null,
  ].filter(Boolean).join(" — ");

  const partyIsHeader = kind === "invoice" || isDelivery;
  const header = partyIsHeader ? party : company;
  const recipient = partyIsHeader ? company : party;
  const recipientLabel = partyIsHeader
    ? (kind === "invoice"
      ? (partyType === "customer" ? "Émetteur / destinataire" : "Fournisseur")
      : (partyType === "customer" ? "Client destinataire" : "Fournisseur"))
    : (partyType === "customer" ? "Client" : "Fournisseur");

  return {
    type: documentType,
    number: getReference(record),
    date: rawDate ? new Date(rawDate).toLocaleDateString("fr-FR") : "—",
    companyName: company?.name || "",
    companyAddress: company?.address || "",
    companyPhone: company?.phone || "",
    companyEmail: company?.email || "",
    companyLogo: company?.logo ? resolveAssetUrl(String(company.logo)) : null,
    headerName: header?.raison_sociale || header?.name || "",
    headerAddress: header?.address || "",
    headerPhone: header?.phone || "",
    headerEmail: header?.email || "",
    headerLogo: header?.logo ? resolveAssetUrl(String(header.logo)) : null,
    clientName: recipient?.raison_sociale || recipient?.name || "",
    clientAddress: recipient?.address || "",
    clientPhone: recipient?.phone || "",
    clientLogo: null,
    recipientLabel,
    recipientName: recipient?.raison_sociale || recipient?.name || "",
    recipientAddress: recipient?.address || "",
    recipientPhone: recipient?.phone || "",
    recipientEmail: recipient?.email || "",
    items,
    subtotal,
    tvaRate: taxRate,
    tvaAmount: taxAmount,
    total,
    isPaid: isInvoice && (record.payment_status === "PAID" || record.status === "PAID"),
    notes: notes || undefined,
    signatureImage: (record.signature_image || record.signature_url || record.signature)
      ? resolveAssetUrl(String(record.signature_image || record.signature_url || record.signature))
      : null,
    signedBy: record.signed_by_detail?.full_name || record.signature_name || undefined,
  };
}

function resolveAssetUrl(path: string): string {
  try {
    const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
    return new URL(path, apiUrl || window.location.origin).toString();
  } catch {
    return path;
  }
}

function createBundle(
  party: RecordData,
  partyType: "customer" | "supplier",
  source: BundleData
): AccountingBundle {
  const id = getIdentifier(party);
  const partyName = String(party.raison_sociale ?? party.name ?? "—");
  const ordersSource = partyType === "customer" ? source.customerOrders : source.supplierOrders;
  const deliveriesSource = partyType === "customer" ? source.customerDeliveries : source.supplierDeliveries;
  const invoicesSource = partyType === "customer" ? source.customerInvoices : source.supplierInvoices;

  const toBundleDocuments = (records: RecordData[], kind: DocumentKind): BundleDocument[] => {
    const seen = new Set<string>();
    return records
      .filter((record) => getPartyId(record, partyType) === id)
      .filter((record) => {
        const recordId = getIdentifier(record);
        if (!recordId || seen.has(recordId)) return false;
        seen.add(recordId);
        return true;
      })
      .map((raw) => ({
        id: getIdentifier(raw),
        kind,
        reference: getReference(raw),
        date: getDocumentDate(raw, kind),
        raw,
      }));
  };

  const orders = toBundleDocuments(ordersSource, "order");
  const deliveries = toBundleDocuments(deliveriesSource, "delivery");
  const invoices = toBundleDocuments(invoicesSource, "invoice");
  const orderIdKeys = partyType === "customer" ? ["order", "customer_order"] : ["purchase_order", "order"];
  const orderReferenceKeys = partyType === "customer" ? ["order_reference"] : ["purchase_order_reference", "order_reference"];
  const deliveryIdKeys = ["delivery", "customer_delivery"];
  const deliveryReferenceKeys = ["delivery_reference"];
  const usedDeliveries = new Set<string>();
  const usedInvoices = new Set<string>();
  const operations: BundleDocument[][] = [];

  for (const order of orders) {
    const operation: BundleDocument[] = [order];
    const linkedDeliveries = deliveries.filter((delivery) =>
      !usedDeliveries.has(delivery.id) && linkedTo(
        delivery.raw,
        orderIdKeys,
        orderReferenceKeys,
        order.raw
      )
    );
    for (const delivery of linkedDeliveries) {
      usedDeliveries.add(delivery.id);
      operation.push(delivery);
    }

    const linkedInvoices = invoices.filter((invoice) => {
      if (usedInvoices.has(invoice.id)) return false;
      return linkedTo(invoice.raw, orderIdKeys, orderReferenceKeys, order.raw) ||
        linkedDeliveries.some((delivery) => linkedTo(
          invoice.raw,
          deliveryIdKeys,
          deliveryReferenceKeys,
          delivery.raw
        ));
    });
    for (const invoice of linkedInvoices) {
      usedInvoices.add(invoice.id);
      operation.push(invoice);
    }
    operations.push(operation);
  }

  for (const delivery of deliveries) {
    if (usedDeliveries.has(delivery.id)) continue;
    usedDeliveries.add(delivery.id);
    const operation: BundleDocument[] = [delivery];
    for (const invoice of invoices) {
      if (usedInvoices.has(invoice.id)) continue;
      if (linkedTo(invoice.raw, deliveryIdKeys, deliveryReferenceKeys, delivery.raw)) {
        usedInvoices.add(invoice.id);
        operation.push(invoice);
      }
    }
    operations.push(operation);
  }

  for (const invoice of invoices) {
    if (!usedInvoices.has(invoice.id)) operations.push([invoice]);
  }

  const documents = operations.flat();
  return {
    id,
    partyType,
    partyName,
    party,
    orders,
    deliveries,
    invoices,
    operations,
    documents,
  };
}

function formatDates(bundle: AccountingBundle, lang: string): string {
  const dates = bundle.documents
    .map((document) => document.date)
    .filter(Boolean)
    .map((date) => new Date(date));
  if (!dates.length) return "—";
  const locale = lang === "fr" ? "fr-FR" : "en-GB";
  return dates.map((date) => date.toLocaleDateString(locale)).join(" · ");
}

function getReferences(documents: BundleDocument[]): string {
  return documents.length ? documents.map((document) => document.reference).join(", ") : "—";
}

function printStylesheetLinks(): string {
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map((link) => `<link rel="stylesheet" href="${link.href}">`)
    .join("");
}

function printBundle(
  bundle: AccountingBundle,
  documentData: DocumentData[],
  existingWindow?: Window
) {
  const contents = documentData
    .map((_, index) => document.getElementById(`bundle-document-${index}`)?.outerHTML ?? "")
    .filter(Boolean);
  if (!contents.length) {
    existingWindow?.close();
    return;
  }

  const printWindow = existingWindow ?? window.open("", "", "width=1000,height=800");
  if (!printWindow) return;
  const pages = contents.map((content) => `<section class="bundle-print-page">${content}</section>`).join("");
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${bundle.partyName} - Liasse comptable</title>${printStylesheetLinks()}<style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bundle-print-page { break-after: page; page-break-after: always; }
    .bundle-print-page:last-child { break-after: auto; page-break-after: auto; }
    @media print { .bundle-print-page { break-after: page; page-break-after: always; } .bundle-print-page:last-child { break-after: auto; page-break-after: auto; } }
  </style></head><body>${pages}</body></html>`);
  printWindow.document.close();

  const printWhenReady = async () => {
    await Promise.all(Array.from(printWindow.document.images).map(async (image) => {
      try {
        await image.decode();
      } catch {
        image.style.visibility = "hidden";
      }
    }));
    printWindow.focus();
    printWindow.print();
  };
  window.setTimeout(() => { void printWhenReady(); }, 500);
}

export function AccountingBundles() {
  const { lang } = useLanguage();
  const [data, setData] = useState<BundleData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeType, setActiveType] = useState<"customer" | "supplier">("customer");
  const [search, setSearch] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<AccountingBundle | null>(null);
  const [pendingDownload, setPendingDownload] = useState<{ bundleId: string; printWindow: Window } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isEnglish = lang === "en";
  const text = isEnglish ? {
    title: "Accounting bundles",
    subtitle: "View and print each customer's or supplier's documents together.",
    customers: "Customer bundles",
    suppliers: "Supplier bundles",
    party: "Customer / supplier",
    order: "Purchase order",
    delivery: "Delivery note",
    invoice: "Invoice",
    dates: "Document dates",
    documents: "Documents",
    actions: "Actions",
    view: "View bundle",
    download: "Download bundle PDF",
    back: "Back to bundles",
    search: "Search by customer, supplier or document reference...",
    loading: "Loading documents...",
    refresh: "Refresh documents",
    noBundles: "No accounting bundles found.",
    noDocuments: "No documents available for this party.",
    missing: "Missing documents",
    available: "Available documents",
    count: "documents",
    loadError: "Some documents could not be loaded. Available data is shown.",
    neutral: "Unknown party",
  } : {
    title: "Liasses comptables",
    subtitle: "Consultez et imprimez ensemble les documents de chaque client ou fournisseur.",
    customers: "Liasses clients",
    suppliers: "Liasses fournisseurs",
    party: "Client / fournisseur",
    order: "Bon de commande",
    delivery: "Bon de livraison",
    invoice: "Facture",
    dates: "Dates des documents",
    documents: "Documents",
    actions: "Actions",
    view: "Voir la liasse",
    download: "Télécharger la liasse PDF",
    back: "Retour aux liasses",
    search: "Rechercher par client, fournisseur ou référence...",
    loading: "Chargement des documents...",
    refresh: "Actualiser les documents",
    noBundles: "Aucune liasse comptable trouvée.",
    noDocuments: "Aucun document disponible pour ce tiers.",
    missing: "Documents manquants",
    available: "Documents disponibles",
    count: "documents",
    loadError: "Certains documents n'ont pas pu être chargés. Les données disponibles sont affichées.",
    neutral: "Tiers inconnu",
  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      const requests = await Promise.allSettled([
        apiRequest("/v1/users/me/"),
        getAllResults("/v1/customers/"),
        getAllResults("/v1/suppliers/"),
        getAllResults("/v1/customer-orders/"),
        getAllResults("/v1/customer-deliveries/"),
        getAllResults("/v1/customer-invoices/"),
        getAllResults("/v1/purchase-orders/"),
        getAllResults("/v1/deliveries/"),
        getAllResults("/v1/invoices/supplier/"),
      ]);
      const value = (index: number) => requests[index].status === "fulfilled"
        ? requests[index].value
        : null;
      const failed = requests.some((request) => request.status === "rejected");
      const nextData: BundleData = {
        company: value(0)?.company ?? null,
        customers: value(1) ?? [],
        suppliers: value(2) ?? [],
        customerOrders: value(3) ?? [],
        customerDeliveries: value(4) ?? [],
        customerInvoices: value(5) ?? [],
        supplierOrders: value(6) ?? [],
        supplierDeliveries: value(7) ?? [],
        supplierInvoices: value(8) ?? [],
      };
      if (active) {
        setData(nextData);
        setLoadError(failed);
        setLoading(false);
      }
    };

    void loadData();
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") void loadData();
    };
    document.addEventListener("visibilitychange", refreshOnReturn);
    const interval = window.setInterval(() => void loadData(), 60_000);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  const customerBundles = useMemo(() => collectParties(data.customers, [
    ...data.customerOrders,
    ...data.customerDeliveries,
    ...data.customerInvoices,
  ], "customer")
    .filter((customer) => getIdentifier(customer))
    .map((customer) => createBundle(customer, "customer", data))
    .filter((bundle) => bundle.documents.length > 0), [data]);
  const supplierBundles = useMemo(() => collectParties(data.suppliers, [
    ...data.supplierOrders,
    ...data.supplierDeliveries,
    ...data.supplierInvoices,
  ], "supplier")
    .filter((supplier) => getIdentifier(supplier))
    .map((supplier) => createBundle(supplier, "supplier", data))
    .filter((bundle) => bundle.documents.length > 0), [data]);
  const bundles = activeType === "customer" ? customerBundles : supplierBundles;
  const filteredBundles = bundles.filter((bundle) => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return true;
    const searchable = [
      bundle.partyName,
      ...bundle.orders.map((item) => item.reference),
      ...bundle.deliveries.map((item) => item.reference),
      ...bundle.invoices.map((item) => item.reference),
    ].join(" ").toLocaleLowerCase();
    return searchable.includes(term);
  });
  const handleDownload = (bundle: AccountingBundle, printWindow?: Window) => {
    const documents = bundle.documents.map((document) =>
      makeDocument(document.kind, bundle.partyType, document.raw, bundle.partyName, data.company, bundle.party)
    );
    printBundle(bundle, documents, printWindow);
  };

  useEffect(() => {
    if (!selectedBundle || selectedBundle.id !== pendingDownload?.bundleId) return;
    const frame = window.requestAnimationFrame(() => {
      handleDownload(selectedBundle, pendingDownload.printWindow);
      setPendingDownload(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedBundle, pendingDownload, data.company]);

  const missingForOperation = (operation: BundleDocument[]) => {
    const kinds = new Set(operation.map((document) => document.kind));
    return [
      !kinds.has("order") ? text.order : null,
      !kinds.has("delivery") ? text.delivery : null,
      !kinds.has("invoice") ? text.invoice : null,
    ].filter((item): item is string => Boolean(item));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          title={text.refresh}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{text.refresh}</span>
        </button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {text.loadError}
        </div>
      )}

      {selectedBundle ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedBundle(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" /> {text.back}
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900">{selectedBundle.partyName}</h2>
                <p className="text-xs text-gray-500">{selectedBundle.documents.length} {text.count}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDownload(selectedBundle)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Download className="h-4 w-4" /> {text.download}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-gray-500">{text.available}</h3>
            {selectedBundle.operations.map((operation, operationIndex) => {
              const missing = missingForOperation(operation);
              return (
              <div key={`${selectedBundle.id}-operation-${operationIndex}`} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {missing.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-sm font-semibold text-amber-900">{text.missing}</p>
                    <p className="mt-1 text-xs text-amber-800">{missing.join(" · ")}</p>
                  </div>
                )}
                {operation.map((document) => (
              <div key={`${document.kind}-${document.id}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {document.kind === "order" ? <ShoppingCart className="h-4 w-4 text-blue-600" /> : document.kind === "delivery" ? <Truck className="h-4 w-4 text-cyan-600" /> : <FileText className="h-4 w-4 text-green-600" />}
                    <span className="text-sm font-medium text-gray-900">{document.kind === "order" ? text.order : document.kind === "delivery" ? text.delivery : text.invoice}</span>
                    <span className="font-mono text-xs text-gray-500">{document.reference}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {document.date ? new Date(document.date).toLocaleDateString(isEnglish ? "en-GB" : "fr-FR") : "—"}
                  </span>
                </div>
                <div className="overflow-x-auto p-4">
                  <DocumentTemplate
                    contentId={`bundle-document-${selectedBundle.documents.indexOf(document)}`}
                    data={makeDocument(document.kind, selectedBundle.partyType, document.raw, selectedBundle.partyName, data.company, selectedBundle.party)}
                    onDownload={() => handleDownload(selectedBundle)}
                    onPrint={() => window.print()}
                    showActions={false}
                  />
                </div>
              </div>
                ))}
              </div>
            );})}
          </div>
        </section>
      ) : (
        <>
          <div className="flex gap-2 border-b border-gray-200" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeType === "customer"}
              onClick={() => { setActiveType("customer"); setSearch(""); }}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${activeType === "customer" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {text.customers} <span className="ml-1 text-xs text-gray-400">{customerBundles.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeType === "supplier"}
              onClick={() => { setActiveType("supplier"); setSearch(""); }}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${activeType === "supplier" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {text.suppliers} <span className="ml-1 text-xs text-gray-400">{supplierBundles.length}</span>
            </button>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text.search}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading && bundles.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-gray-500">{text.loading}</div>
            ) : filteredBundles.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Package className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                <p className="text-sm text-gray-500">{text.noBundles}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      {[text.party, text.order, text.delivery, text.invoice, text.dates, text.documents, text.actions].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBundles.map((bundle) => (
                      <tr key={bundle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />{bundle.partyName || text.neutral}</span>
                        </td>
                        <td className="max-w-48 px-4 py-3 font-mono text-xs text-gray-700">{getReferences(bundle.orders)}</td>
                        <td className="max-w-48 px-4 py-3 font-mono text-xs text-gray-700">{getReferences(bundle.deliveries)}</td>
                        <td className="max-w-48 px-4 py-3 font-mono text-xs text-gray-700">{getReferences(bundle.invoices)}</td>
                        <td className="max-w-56 px-4 py-3 text-xs text-gray-600">{formatDates(bundle, lang)}</td>
                        <td className="px-4 py-3 text-gray-700">{bundle.documents.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedBundle(bundle)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> {text.view}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const printWindow = window.open("", "", "width=1000,height=800");
                                if (!printWindow) return;
                                setSelectedBundle(bundle);
                                setPendingDownload({ bundleId: bundle.id, printWindow });
                              }}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              <Download className="h-3.5 w-3.5" /> {text.download}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
