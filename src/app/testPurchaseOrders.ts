import { getPurchaseOrders } from "./purchaseOrdersApi";

export async function testPurchaseOrders() {
  try {
    const orders = await getPurchaseOrders();

    console.log("Bons de commande Django :", orders);

  } catch (error) {
    console.error("Erreur récupération BDC :", error);
  }
}