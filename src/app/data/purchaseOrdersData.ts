export type PurchaseOrderArticle = {
  id: number;
  name: string;
  nameOption: string;
  customName: string;
  quantity: number;
  unitPrice: number;
};

export type PurchaseOrder = {
  id: string;
  supplierName: string;
  articles: PurchaseOrderArticle[];
  totalAmount: number;
  status: "draft" | "pending" | "approved" | "rejected" | "sent";
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  sentDate?: string;
  linkedQuoteId?: string;
};

export let purchaseOrdersDatabase: PurchaseOrder[] = [
  {
    id: "BDC-001",
    supplierName: "Fournisseur Informatique SA",
    articles: [
      {
        id: 1,
        name: "Ordinateur portable Dell",
        nameOption: "Ordinateur portable Dell",
        customName: "",
        quantity: 10,
        unitPrice: 850000,
      },
    ],
    totalAmount: 8500000,
    status: "pending",
    requestedBy: "Gestionnaire Achats",
    requestedDate: "2026-05-05",
  },
  {
    id: "BDC-002",
    supplierName: "Bureau Plus",
    articles: [
      {
        id: 1,
        name: "Chaise de bureau ergonomique",
        nameOption: "Chaise de bureau ergonomique",
        customName: "",
        quantity: 20,
        unitPrice: 245000,
      },
    ],
    totalAmount: 4900000,
    status: "approved",
    requestedBy: "Gestionnaire Achats",
    requestedDate: "2026-05-03",
    approvedBy: "DG",
    approvedDate: "2026-05-04",
  },
];

export const addPurchaseOrder = (order: PurchaseOrder) => {
  purchaseOrdersDatabase.push(order);
};

export const updatePurchaseOrder = (id: string, updatedOrder: Partial<PurchaseOrder>) => {
  const index = purchaseOrdersDatabase.findIndex((o) => o.id === id);
  if (index !== -1) {
    purchaseOrdersDatabase[index] = { ...purchaseOrdersDatabase[index], ...updatedOrder };
  }
};

export const deletePurchaseOrder = (id: string) => {
  purchaseOrdersDatabase = purchaseOrdersDatabase.filter((o) => o.id !== id);
};

export const getPurchaseOrders = () => purchaseOrdersDatabase;

export const getPurchaseOrderById = (id: string) => {
  return purchaseOrdersDatabase.find((o) => o.id === id);
};
