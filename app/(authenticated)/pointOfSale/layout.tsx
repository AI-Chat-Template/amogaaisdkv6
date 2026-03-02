import { CartProvider } from "./context/context";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
