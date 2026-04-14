import { Product } from '../services/api';

const CART_STORAGE_KEY = 'heritage-atlas-cart';

export type CartItem = {
  productId: string;
  name: string;
  artisanName: string;
  region: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

const readCart = (): CartItem[] => {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      return [];
    }

    const parsedCart = JSON.parse(rawCart);
    return Array.isArray(parsedCart)
      ? parsedCart.filter(
          (item) =>
            typeof item?.productId === 'string' &&
            typeof item?.name === 'string' &&
            typeof item?.price === 'number' &&
            typeof item?.quantity === 'number'
        )
      : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
};

const buildCartItem = (product: Product): CartItem | null => {
  if (!product._id) {
    return null;
  }

  return {
    productId: product._id,
    name: product.name,
    artisanName: product.artisan_name,
    region: product.region,
    price: product.price ?? 0,
    imageUrl: product.image_url,
    quantity: 1,
  };
};

export const cartStorage = {
  getAll: () => readCart(),
  getCount: () => readCart().reduce((total, item) => total + item.quantity, 0),
  getSubtotal: () => readCart().reduce((total, item) => total + item.price * item.quantity, 0),
  has: (productId?: string) => !!productId && readCart().some((item) => item.productId === productId),
  add(product: Product) {
    const cartItem = buildCartItem(product);
    if (!cartItem) {
      return false;
    }

    const items = readCart();
    const existingItem = items.find((item) => item.productId === cartItem.productId);

    if (existingItem) {
      const nextItems = items.map((item) =>
        item.productId === cartItem.productId ? { ...item, quantity: item.quantity + 1 } : item
      );
      writeCart(nextItems);
      return true;
    }

    writeCart([...items, cartItem]);
    return true;
  },
  updateQuantity(productId: string, quantity: number) {
    const items = readCart();
    if (quantity <= 0) {
      writeCart(items.filter((item) => item.productId !== productId));
      return;
    }

    writeCart(items.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  },
  remove(productId: string) {
    writeCart(readCart().filter((item) => item.productId !== productId));
  },
  clear() {
    writeCart([]);
  },
};
