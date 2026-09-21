import { useState } from "react";
import { Search, Plus, Eye, Trash2, X, Send } from "lucide-react";
import { getProducts } from "../../data/productsData";

const initialRequests = [
  {
    id: "DEM-2024-001",
    clientName: "Société ABC",
    clientEmail: "contact@abc.sn",
    clientPhone: "+221 77 123 45 67",
    description: "Besoin de matériel informatique pour nouveau bureau",
    items: [
      { productName: "Ordinateur portable Dell", quantity: 5 },
      { productName: "Imprimante HP LaserJet", quantity: 2 },
    ],
    status: "pending",
    createdDate: "2026-05-01",
  },
  {
    id: "DEM-2024-002",
    clientName: "Entreprise XYZ",
    clientEmail: "info@xyz.sn",
    clientPhone: "+221 76 987 65 43",
    description: "Fournitures de bureau pour l'année",
    items: [
      { productName: "Chaise de bureau ergonomique", quantity: 10 },
    ],
    status: "converted",
    createdDate: "2026-04-28",
  },
];

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  converted: { label: "Convertie en devis", color: "bg-green-100 text-green-700" },
};

export function QuoteRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    description: "",
  });

  const [requestItems, setRequestItems] = useState<any[]>([
    { id: 1, productName: "", quantity: 1 },
  ]);

  const products = getProducts();

  const filteredRequests = requests.filter(
    (req) =>
      req.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    setRequestItems([
      ...requestItems,
      { id: Math.max(...requestItems.map((i) => i.id)) + 1, productName: "", quantity: 1 },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter((i) => i.id !== id));
    }
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setRequestItems(requestItems.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRequest = {
      id: `DEM-2024-${String(requests.length + 1).padStart(3, "0")}`,
      ...formData,
      items: requestItems.filter((item) => item.productName),
      status: "pending",
      createdDate: new Date().toISOString().split("T")[0],
    };

    setRequests([newRequest, ...requests]);
    setShowModal(false);
    resetForm();
    alert("Demande de devis envoyée avec succès !");
  };

  const resetForm = () => {
    setFormData({ clientName: "", clientEmail: "", clientPhone: "", description: "" });
    setRequestItems([{ id: 1, productName: "", quantity: 1 }]);
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleDelete = (requestId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
      setRequests(requests.filter((r) => r.id !== requestId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Demandes de devis</h1>
          <p className="text-gray-600 mt-1">Gérez les demandes de vos clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle demande
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une demande..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total demandes</div>
          <div className="text-2xl text-gray-900">{requests.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">En attente</div>
          <div className="text-2xl text-yellow-600">
            {requests.filter((r) => r.status === "pending").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Converties</div>
          <div className="text-2xl text-green-600">
            {requests.filter((r) => r.status === "converted").length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Produits
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.clientEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.items.length} article(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        statusConfig[request.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[request.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(request.createdDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">Nouvelle demande de devis</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Nom du client *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Description du besoin *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-700">Produits / Services *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un produit
                  </button>
                </div>
                <div className="space-y-2">
                  {requestItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        value={item.productName}
                        onChange={(e) => handleItemChange(item.id, "productName", e.target.value)}
                        className="col-span-8 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)
                        }
                        placeholder="Qté"
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                      {requestItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="col-span-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">Détail de la demande - {selectedRequest.id}</h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Client:</span>
                  <p className="text-gray-900">{selectedRequest.clientName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="text-gray-900">{selectedRequest.clientEmail}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Téléphone:</span>
                  <p className="text-gray-900">{selectedRequest.clientPhone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Statut:</span>
                  <p>
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full ${
                        statusConfig[selectedRequest.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[selectedRequest.status as keyof typeof statusConfig].label}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="text-gray-900 mt-1">{selectedRequest.description}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 mb-2 block">Produits demandés:</span>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Produit</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Quantité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item: any, index: number) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
