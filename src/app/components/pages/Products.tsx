import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { apiRequest } from "../../apiClient";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";
import {
  type Product,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../../data/productsData";


export function Products() {
  const { lang, t } = useLanguage();
 type ProductUI = {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  defaultPrice: number;
  category: string;
  isActive: boolean;
  createdDate: string;
};

const [products, setProducts] = useState<ProductUI[]>([]);

 useEffect(() => {
  const loadProducts = async () => {
    try {
      console.log("=== CHARGEMENT PRODUITS DJANGO ===");

      const response = await apiRequest("/v1/products/");

      console.log("=== RÉPONSE PRODUITS DJANGO ===", response);

      console.log(
        "=== PRODUITS DJANGO RESULTS ===",
        response.results
      );

      console.log(
        "=== PREMIER PRODUIT JSON ===",
        JSON.stringify(response.results?.[0], null, 2)
      );
      console.log("PRODUITS DJANGO :", products);

      const formattedProducts = (response.results || []).map(
        (product: any) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description || "",
          unit: product.unit,
          category: product.category || "",
         defaultPrice: Number(product.unit_price || 0),
          isActive: product.is_active,
          createdDate: product.created_at,
        })
      );

      console.log(
        "=== PRODUITS FORMATÉS POUR REACT ===",
        formattedProducts
      );

      setProducts(formattedProducts);
      
      console.log(
  "=== PRIX DES PRODUITS ===",
  JSON.stringify(
    formattedProducts.map((p: any) => ({
      name: p.name,
      defaultPrice: p.defaultPrice,
    })),
    null,
    2
  )
);

    } catch (error) {
      console.error(
        "Erreur chargement produits Django :",
        error
      );
    }
  };

  loadProducts();
}, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
 const [editingProduct, setEditingProduct] = useState<ProductUI | null>(null);

  const [formData, setFormData] = useState({
  code: "",
  name: "",
  description: "",
  unit: "piece",
  defaultPrice: 0,
  category: "",
});

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    if (editingProduct) {
      // =========================
      // MODIFIER DANS DJANGO
      // =========================

      const updatedProduct = await updateProduct(
        editingProduct.id,
        {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          unit: formData.unit,
          unit_price: String(formData.defaultPrice),
          category: formData.category,
          is_active: true,
        }
      );

      console.log(
        "=== PRODUIT MODIFIÉ DANS DJANGO ===",
        updatedProduct
      );

    } else {
      // =========================
      // AJOUTER DANS DJANGO
      // =========================

      const productData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        unit_price: String(formData.defaultPrice),
        category: formData.category,
        is_active: true,
      };

      console.log(
        "=== POST PRODUIT DJANGO ===",
        productData
      );

      const newProduct = await createProduct(productData);

      console.log(
        "=== PRODUIT CRÉÉ DANS DJANGO ===",
        newProduct
      );
    }

    // =========================
    // RECHARGER DEPUIS DJANGO
    // =========================

    const productsFromDjango = await getProducts();

    const formattedProducts = productsFromDjango.map(
      (product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description || "",
        unit: product.unit,
        defaultPrice: Number(product.unit_price || 0),
        category: product.category || "",
        isActive: product.is_active,
        createdDate: product.created_at,
      })
    );

    setProducts(formattedProducts);

    setShowModal(false);
    resetForm();

  } catch (error) {
    console.error(
      "=== ERREUR PRODUIT DJANGO ===",
      error
    );
  }
};

  const resetForm = () => {
  setFormData({
    code: "",
    name: "",
    description: "",
    unit: "piece",
    defaultPrice: 0,
    category: "",
  });

  setEditingProduct(null);
};

const handleEdit = (product: ProductUI) => {
  setEditingProduct(product);

  setFormData({
    code: product.code,
    name: product.name,
    description: product.description || "",
    unit: product.unit,
    defaultPrice: product.defaultPrice,
    category: product.category || "",
  });

  setShowModal(true);
};

  const handleDelete = async (productId: string) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
    return;
  }

  try {
    await deleteProduct(productId);

    console.log("=== PRODUIT SUPPRIMÉ (SOFT DELETE) ===");

    const djangoProducts = await getProducts();

    const formattedProducts: ProductUI[] = djangoProducts.map(
      (product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description || "",
        unit: product.unit,
        category: product.category || "",
        defaultPrice: Number(product.unit_price || 0),
        isActive: product.is_active,
        createdDate: product.created_at,
      })
    );

    setProducts(formattedProducts);

  } catch (error) {
    console.error("=== ERREUR SUPPRESSION PRODUIT ===", error);
    alert("Impossible de supprimer le produit.");
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.products.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.products.subtitle[lang]}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t.products.newProduct[lang]}
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total produits</div>
          <div className="text-2xl text-gray-900">{products.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Catégories</div>
          <div className="text-2xl text-gray-900">
            {new Set(products.map(p => p.category)).size}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Prix moyen</div>
          <div className="text-2xl text-gray-900">
            {products.length > 0
              ? Math.round(
                 products.reduce(
               (sum: number, p: any) => sum + Number(p.defaultPrice || 0),
                0
               ) / products.length
                 ).toLocaleString("fr-FR")
                : "0"}{" "}
                FCFA
        </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Nom du produit
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Prix par défaut
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(product.defaultPrice ?? 0).toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.createdDate
                     ? new Date(product.createdDate).toLocaleDateString("fr-FR")
                       : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RowActionMenu>
                      <RowActionItem icon={<Edit />} onSelect={() => handleEdit(product)}>Modifier</RowActionItem>
                      <RowActionItem icon={<Trash2 />} onSelect={() => handleDelete(product.id)} destructive>Supprimer</RowActionItem>
                    </RowActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">
                {editingProduct ? "Modifier le produit" : "Créer un produit"}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
  <label className="block text-sm text-gray-700 mb-2">
    Code *
  </label>

  <input
    type="text"
    value={formData.code}
    onChange={(e) =>
      setFormData({
        ...formData,
        code: e.target.value,
      })
    }
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
    placeholder="Ex: PROD-001"
    required
  />
</div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nom du produit *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ex: Ordinateur portable Dell"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Description du produit"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
  <label className="block text-sm text-gray-700 mb-2">
    Unité *
  </label>

  <select
    value={formData.unit}
    onChange={(e) =>
      setFormData({
        ...formData,
        unit: e.target.value,
      })
    }
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
    required
  >
    <option value="piece">Pièce</option>
    <option value="kg">Kg</option>
    <option value="litre">Litre</option>
    <option value="metre">Mètre</option>
    <option value="heure">Heure</option>
  </select>
</div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Catégorie *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ex: Informatique"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Prix par défaut (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                    required
                  />
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
                  {editingProduct ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
