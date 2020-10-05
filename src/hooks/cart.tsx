/* eslint-disable no-plusplus */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@GoMarketplace:products');

      if (data !== null) {
        setProducts([...JSON.parse(data)]);
      }
    }

    loadProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);
      let newProducts: Product[] = [];

      if (productIndex === -1) {
        newProducts = [
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ];
      }

      if (productIndex > -1) {
        newProducts = products.map(item => {
          return item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(item => {
        return item.id === id ? { ...item, quantity: item.quantity + 1 } : item;
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decrementedProduct = products.find(item => item.id === id);
      let newProducts: Product[] = [];

      if (decrementedProduct === undefined) {
        return;
      }

      if (decrementedProduct?.quantity === 1) {
        newProducts = products.filter(item => item.id !== id);
      }

      if (decrementedProduct?.quantity > 1) {
        newProducts = products.map(item => {
          return item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item;
        });
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );

      setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
