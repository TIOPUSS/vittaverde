import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category: string;
  supplier?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get cart key specific to user
  const getCartKey = () => {
    if (user?.id) {
      return `vittaverde-cart-${user.id}`;
    }
    return "vittaverde-cart-guest";
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    // Carregar do localStorage na inicialização
    if (typeof window !== "undefined") {
      const cartKey = user?.id ? `vittaverde-cart-${user.id}` : "vittaverde-cart-guest";
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Salvar no localStorage sempre que o carrinho mudar OU quando o usuário mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cartKey = getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, user?.id]);

  // Reload cart when user changes
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const cartKey = getCartKey();
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }
  }, [user?.id]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    
    if (existing) {
      // Se já existe, aumenta quantidade
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast({
        title: "✅ Quantidade atualizada",
        description: `${product.name} - ${existing.quantity + 1} unidades no carrinho`,
      });
    } else {
      // Adiciona novo produto
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        imageUrl: product.imageUrl,
        category: product.category,
        supplier: product.supplier,
      }]);
      toast({
        title: "✅ Adicionado ao carrinho",
        description: `${product.name} foi adicionado ao carrinho`,
      });
    }
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find(i => i.productId === productId);
    setCart(cart.filter(item => item.productId !== productId));
    if (item) {
      toast({
        title: "🗑️ Produto removido",
        description: `${item.name} foi removido do carrinho`,
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
    toast({
      title: "🛒 Carrinho limpo",
      description: "Todos os produtos foram removidos",
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
