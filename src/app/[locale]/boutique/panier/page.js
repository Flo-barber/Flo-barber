import { getProducts } from "@/lib/products";
import CartView from "@/components/organisms/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = await getProducts();
  return <CartView products={products} />;
}
