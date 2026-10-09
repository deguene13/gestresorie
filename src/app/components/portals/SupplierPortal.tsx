import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Truck, FileText, CreditCard, LogOut, Package, Upload, X, Check, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";

const SUPPLIER_ORDERS = [
  { id: "BDC-2024-158", date: "2026-04-15", items: "Chaises de bureau (20)", amount: 1500000, status: "Validé" },
  { id: "BDC-2024-157", date: "2026-04-10", items: "Imprimantes (5)", amount: 1260000, status: "En cours" },
  { id: "BDC-2024-156", date: "2026-04-05", items: "Ordinateurs (10)", amount: 6500000, status: "Livré" },
];

const SUPPLIER_DELIVERIES = [
  { id: "BL-F-2024-002", bdcRef: "BDC-2024-158", date: "2026-04-20", items: "Chaises (20)", status: "Complète" },
  { id: "BL-F-2024-001", bdcRef: "BDC-2024-157", date: "2026-04-18", items: "Imprimantes (5)", status: "Partielle" },
];

const SUPPLIER_INVOICES = [
  { id: "FAC-2024-891", bdcRef: "BDC-2024-158", amount: 1770000, date: "2026-04-21", dueDate: "2026-05-21", status: "En attente" },
  { id: "FAC-2024-890", bdcRef: "BDC-2024-157", amount: 1486800, date: "2026-04-19", dueDate: "2026-05-19", status: "Payée" },
];

const SUPPLIER_PAYMENTS = [
  { id: "PAY-001", invoiceRef: "FAC-2024-890", date: "2026-05-02", amount: 1486800, method: "Virement", status: "Exécuté" },
];

function formatAmount(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Validé": "bg-green-100 text-green-700",
    "En cours": "bg-blue-100 text-blue-700",
    "Livré": "bg-purple-100 text-purple-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Complète": "bg-green-100 text-green-700",
    "Partielle": "bg-yellow-100 text-yellow-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "En attente": "bg-orange-100 text-orange-700",
    "Payée": "bg-green-100 text-green-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

const TABS = [
  { id: "orders", label: "Bons de commande", icon: ShoppingCart },
  { id: "deliveries", label: "Livraisons", icon: Truck },
  { id: "invoices", label: "Factures", icon: FileText },
  { id: "payments", label: "Paiements", icon: CreditCard },
];


function InvoiceModal({ supplierName, onClose, onSuccess }: {
  supplierName: string;
  onClose: () => void;
  onSuccess: (fileName: string) => void;
}) {
  const [bdcRef, setBdcRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  const ACCEPTED_LABEL = "PDF, JPG, JPEG, PNG";
  const MAX_MB = 10;

  const handleFile = (f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      setError(`Format non accepté. Formats autorisés : ${ACCEPTED_LABEL}`);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux. Taille max : ${MAX_MB} Mo`);
      return;
    }
    setFile(f);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = () => {
    if (!bdcRef.trim()) { setError("La référence BDC est obligatoire."); return; }
    if (!file) { setError("Veuillez sélectionner un fichier."); return; }
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 20;
      });
    }, 200);
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        onSuccess(file.name);
        onClose();
      }, 400);
    }, 1200);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Déposer une facture</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Référence BDC <span className="text-red-500">*</span>
            </label>
            <input
              value={bdcRef}
              onChange={e => { setBdcRef(e.target.value); setError(""); }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
              placeholder="Ex: BDC-2024-158"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fichier facture <span className="text-red-500">*</span>
            </label>
            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Glissez votre fichier ici</p>
                <p className="text-xs text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                <p className="text-xs text-gray-400 mt-2">{ACCEPTED_LABEL} — max {MAX_MB} Mo</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            ) : (
              <div className="border border-green-300 bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                {uploading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Envoi en cours...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <p className="text-xs text-gray-500">Fournisseur : <span className="font-medium text-gray-700">{supplierName}</span></p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Envoi..." : "Déposer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupplierPortal() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (!auth.user) navigate("/");
  }, [auth.user, navigate]);

  if (!auth.user) return null;

  const supplierName = auth.user.name ?? "Fournisseur";

  const generateBLPdf = (delivery: typeof SUPPLIER_DELIVERIES[0]) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <title>BL ${delivery.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .company { }
          .company h1 { font-size: 22px; color: #1e40af; margin: 0 0 4px; }
          .company p { font-size: 12px; color: #666; margin: 2px 0; }
          .doc-title { text-align: right; }
          .doc-title h2 { font-size: 26px; font-weight: 900; color: #1e40af; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
          .doc-title .ref { font-size: 14px; color: #555; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .info-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 8px; }
          .info-box p { font-size: 13px; margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          thead tr { background: #1e40af; color: white; }
          thead th { padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #16a34a; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; width: 200px; text-align: center; }
          .signature-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .signature-box .line { height: 60px; border-bottom: 1px dashed #ccc; margin-bottom: 8px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>TRÉSOR — SÉNÉGAL</h1>
            <p>Direction de la Trésorerie et de la Comptabilité Publique</p>
            <p>Dakar, Sénégal</p>
          </div>
          <div class="doc-title">
            <h2>Bordereau de Livraison</h2>
            <div class="ref">${delivery.id}</div>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <h4>Informations BL</h4>
            <p><strong>N° BL :</strong> ${delivery.id}</p>
            <p><strong>BDC associé :</strong> ${delivery.bdcRef}</p>
            <p><strong>Date :</strong> ${delivery.date}</p>
          </div>
          <div class="info-box">
            <h4>Fournisseur</h4>
            <p><strong>${supplierName}</strong></p>
            <p>Dakar, Sénégal</p>
            <p>Statut : <span class="status-badge">${delivery.status}</span></p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Désignation</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${delivery.items}</td>
              <td>${delivery.status}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <div class="signature-box">
            <div class="line"></div>
            <div class="label">Signature Fournisseur</div>
          </div>
          <div class="signature-box">
            <div class="line"></div>
            <div class="label">Signature Réception</div>
          </div>
          <div class="signature-box">
            <div class="line"></div>
            <div class="label">Cachet / Visa</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const totalFacturé = SUPPLIER_INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalEncaissé = SUPPLIER_INVOICES.filter((i) => i.status === "Payée").reduce((s, i) => s + i.amount, 0);
  const totalEnAttente = totalFacturé - totalEncaissé;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none block">Espace Fournisseur</span>
              <span className="text-blue-200 text-xs">{supplierName}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-100 text-sm hidden sm:block">{supplierName}</span>
            <button
              onClick={() => { auth.logout(); navigate("/"); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab 1: Bons de commande */}
        {activeTab === "orders" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Bons de commande</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° BDC</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Articles</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Montant</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Statut</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SUPPLIER_ORDERS.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-mono text-blue-700 font-medium">{o.id}</td>
                      <td className="py-3 pr-4 text-gray-600">{o.date}</td>
                      <td className="py-3 pr-4 text-gray-700">{o.items}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(o.amount)}</td>
                      <td className="py-3 pr-4"><OrderStatusBadge status={o.status} /></td>
                      <td className="py-3">
                        {(o.status === "Validé" || o.status === "En cours") && (
                          <RowActionMenu>
                            {o.status === "Validé" && <RowActionItem icon={<Check />} onSelect={() => alert(`BDC ${o.id} accepté.`)}>Accepter</RowActionItem>}
                            {o.status === "En cours" && <RowActionItem icon={<Truck />} onSelect={() => alert(`Préparation BL pour ${o.id}.`)}>Préparer BL</RowActionItem>}
                          </RowActionMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Livraisons */}
        {activeTab === "deliveries" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Livraisons</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° BL</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">BDC associé</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Articles</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Statut</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SUPPLIER_DELIVERIES.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-mono text-blue-700 font-medium">{d.id}</td>
                      <td className="py-3 pr-4 text-gray-600">{d.bdcRef}</td>
                      <td className="py-3 pr-4 text-gray-600">{d.date}</td>
                      <td className="py-3 pr-4 text-gray-700">{d.items}</td>
                      <td className="py-3 pr-4"><DeliveryStatusBadge status={d.status} /></td>
                      <td className="py-3">
                        <RowActionMenu>
                          <RowActionItem icon={<Download />} onSelect={() => generateBLPdf(d)}>Télécharger BL</RowActionItem>
                        </RowActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Factures */}
        {activeTab === "invoices" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Factures</h2>
              <button onClick={() => setShowInvoiceModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                + Déposer facture
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° Facture</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">BDC</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Montant TTC</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Échéance</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Statut</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SUPPLIER_INVOICES.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-mono text-blue-700 font-medium">{inv.id}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.bdcRef}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(inv.amount)}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.date}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.dueDate}</td>
                      <td className="py-3 pr-4"><InvoiceStatusBadge status={inv.status} /></td>
                      <td className="py-3">
                        <RowActionMenu>
                          <RowActionItem icon={<Upload />} onSelect={() => setShowInvoiceModal(true)}>Déposer facture</RowActionItem>
                        </RowActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Paiements */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Total facturé</p>
                <p className="text-xl font-bold text-gray-900">{formatAmount(totalFacturé)}</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Total encaissé</p>
                <p className="text-xl font-bold text-green-700">{formatAmount(totalEncaissé)}</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">En attente</p>
                <p className="text-xl font-bold text-orange-600">{formatAmount(totalEnAttente)}</p>
              </div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Historique des paiements</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 pr-4 font-medium text-gray-500">Réf. paiement</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Facture</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Montant</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Méthode</th>
                      <th className="pb-3 font-medium text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {SUPPLIER_PAYMENTS.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 pr-4 font-mono text-blue-700 font-medium">{p.id}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.invoiceRef}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.date}</td>
                        <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(p.amount)}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.method}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {showInvoiceModal && (
        <InvoiceModal
          supplierName={supplierName}
          onClose={() => setShowInvoiceModal(false)}
          onSuccess={(fileName) => {
            setShowInvoiceModal(false);
            alert(`Facture "${fileName}" déposée avec succès et liée à ${supplierName}.`);
          }}
        />
      )}
    </div>
  );
}
