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

  // Informations du client
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientLogo?: string | null;

  items: DocumentItem[];
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  isPaid?: boolean;
  notes?: string;
};
type Props = {
  data: DocumentData;
  onDownload: () => void;
  onPrint: () => void;
  onBack?: () => void;
  showActions?: boolean;
};

export function DocumentTemplate({ data, onDownload, onPrint, onBack, showActions = true }: Props) {
  return (
    <div className="space-y-6">
     

      {/* Document A4 */}
      <div
        id="document-content"
        className="bg-white shadow-lg mx-auto"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-300">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
             {data.companyLogo || data.clientLogo ? (
  <img
    src={data.companyLogo || data.clientLogo || ""}
    alt={`Logo ${data.companyName || data.clientName}`}
    className="w-16 h-16 object-contain border border-gray-200 rounded-lg p-1 bg-white"
  />
) : (
  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
    <svg
      className="w-10 h-10 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 0 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </div>
)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {data.companyName}
                </h1>

               <p className="text-sm font-semibold" style={{ color: "#0F3D91" }}>
               
              </p>
              </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p>{data.companyAddress}</p>
              <p>Tél: {data.companyPhone}</p>
              <p>Email: {data.companyEmail}</p>
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
            {data.type === "Devis"
               ? "Destinataire"
             : data.type === "Facture"
               ? "Facturé à"
               : data.type === "Bordereau de livraison"
                 ? "Fournisseur"
               : "Client"}
            </h3>
         <div className="text-sm text-gray-700 space-y-1">
  <p className="font-semibold">{data.clientName}</p>

  {data.clientAddress && <p>{data.clientAddress}</p>}

  {data.clientPhone && <p>Tél : {data.clientPhone}</p>}

  {data.companyEmail && <p>Email : {data.companyEmail}</p>}
</div>
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
              <div className="border-2 border-dashed border-gray-300 w-40 h-24 flex items-center justify-center mb-2">
                <span className="text-gray-400 text-sm">Signature et cachet</span>
              </div>
              <p className="text-xs text-gray-600">Signature autorisée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
