import { Download, Printer, ArrowLeft } from "lucide-react";

export type DocumentItem = {
  designation: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type DocumentData = {
  type: "Facture" | "Bon de commande" | "Bordereau de livraison" | "Devis";
  number: string;
  date: string;

  // Informations de l'entreprise
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string | null;
  headerName?: string;
  headerAddress?: string;
  headerPhone?: string;
  headerEmail?: string;
  headerLogo?: string | null;

  // Informations du client
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientLogo?: string | null;
  recipientLabel?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientLogo?: string | null;

  items: DocumentItem[];
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  isPaid?: boolean;
  notes?: string;
  signatureImage?: string | null;
  signedBy?: string;
};
type Props = {
  data: DocumentData;
  onDownload: () => void;
  onPrint: () => void;
  onBack?: () => void;
  showActions?: boolean;
  contentId?: string;
};

export function DocumentTemplate({ data, onDownload, onPrint, onBack, showActions = true, contentId = "document-content" }: Props) {
  const headerName = data.headerName ?? data.companyName;
  const headerAddress = data.headerAddress ?? data.companyAddress;
  const headerPhone = data.headerPhone ?? data.companyPhone;
  const headerEmail = data.headerEmail ?? data.companyEmail;
  const headerLogo: string | undefined = data.headerLogo !== undefined
    ? data.headerLogo ?? undefined
    : data.companyLogo ?? data.clientLogo ?? undefined;
  const recipientName = data.recipientName ?? data.clientName;
  const recipientAddress = data.recipientAddress ?? data.clientAddress;
  const recipientPhone = data.recipientPhone ?? data.clientPhone;
  const recipientEmail = data.recipientEmail;
  const recipientLogo = data.recipientLogo ?? undefined;

  return (
    <div className="space-y-6">
     

      {/* Document A4 */}
      <div
        id={contentId}
        className="bg-white shadow-lg mx-auto"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-300">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {headerLogo ? (
                <img
                  src={headerLogo}
                  alt={`Logo ${headerName}`}
                  className="h-16 w-16 flex-shrink-0 object-contain"
                  onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
                />
              ) : (
                <div className="h-16 w-16 flex-shrink-0" aria-hidden="true" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {headerName}
                </h1>

               <p className="text-sm font-semibold" style={{ color: "#0F3D91" }}>
               
              </p>
              </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              {headerAddress && <p>{headerAddress}</p>}
              {headerPhone && <p>Tél: {headerPhone}</p>}
              {headerEmail && <p>Email: {headerEmail}</p>}
            </div>
          </div>

          {/* Document Info */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{data.type}</h2>
            <div className="text-sm space-y-1">
              <p className="text-gray-700">
                <span className="font-semibold">N°:</span> {data.number}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Date:</span>{" "}
                {data.date}
              </p>
              {data.isPaid !== undefined && (
                <div className="mt-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded ${
                      data.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {data.isPaid ? "PAYÉE" : "NON PAYÉE"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-900 mb-2">
            {data.recipientLabel ?? (data.type === "Devis"
               ? "Destinataire"
             : data.type === "Facture"
               ? "Facturé à"
               : data.type === "Bordereau de livraison"
                 ? "Fournisseur"
               : "Client")}
            </h3>
         <div className="text-sm text-gray-700 space-y-1">
  <p className="font-semibold">{recipientName}</p>

  {recipientAddress && <p>{recipientAddress}</p>}

  {recipientPhone && <p>Tél : {recipientPhone}</p>}

  {recipientEmail && <p>Email : {recipientEmail}</p>}
</div>
          {recipientLogo && <img src={recipientLogo} alt={`Logo ${recipientName}`} className="mt-3 h-12 w-12 object-contain" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Désignation</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Quantité</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Prix Unitaire</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4 text-gray-900">{item.designation}</td>
                <td className="py-3 px-4 text-right text-gray-900">{item.quantity}</td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {item.unitPrice.toLocaleString()} FCFA
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  {item.total.toLocaleString()} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80 space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Sous-total HT:</span>
              <span className="font-semibold text-gray-900">
                {data.subtotal.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">TVA ({data.tvaRate}%):</span>
              <span className="font-semibold text-gray-900">
                {data.tvaAmount.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 px-4 rounded">
              <span className="text-lg font-bold text-gray-900">Total TTC:</span>
              <span className="text-lg font-bold text-gray-900">
                {data.total.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700 italic">{data.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t-2 border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              <p>Merci pour votre confiance</p>
              <p className="mt-1">En cas de question, contactez-nous</p>
            </div>
            <div className="text-center">
              {data.signatureImage ? (
                <img src={data.signatureImage ?? undefined} alt="Signature et cachet" className="mx-auto mb-2 h-24 w-40 object-contain" />
              ) : (
                <div className="border-2 border-dashed border-gray-300 w-40 h-24 flex items-center justify-center mb-2">
                  <span className="text-gray-400 text-sm">Signature et cachet</span>
                </div>
              )}
              <p className="text-xs text-gray-600">{data.signedBy || "Signature autorisée"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
