import { CartItem } from './cart';

const ORDERS_STORAGE_KEY = 'heritage-atlas-orders';

export type OrderStatus = 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export type StoredOrder = {
  id: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: 'upi' | 'card' | 'cod';
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

type CreateOrderInput = Omit<StoredOrder, 'status' | 'updatedAt'>;

const readOrders = (): StoredOrder[] => {
  try {
    const rawOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!rawOrders) {
      return [];
    }

    const parsed = JSON.parse(rawOrders);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeOrders = (orders: StoredOrder[]) => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event('orders-updated'));
};

export const orderStorage = {
  create(order: CreateOrderInput) {
    const storedOrder: StoredOrder = {
      ...order,
      status: 'confirmed',
      updatedAt: new Date().toISOString(),
    };

    writeOrders([storedOrder, ...readOrders()]);
    return storedOrder;
  },
  getAll() {
    return readOrders();
  },
  getByCustomer(customerEmail?: string) {
    if (!customerEmail) {
      return [];
    }

    return readOrders().filter((order) => order.customerEmail === customerEmail);
  },
  updateStatus(orderId: string, status: OrderStatus) {
    const nextOrders = readOrders().map((order) =>
      order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
    );
    writeOrders(nextOrders);
    return nextOrders.find((order) => order.id === orderId) || null;
  },
  cancel(orderId: string) {
    return orderStorage.updateStatus(orderId, 'cancelled');
  },
};

export const downloadOrderInvoice = (order: StoredOrder) => {
  const invoiceLines = [
    'Heritage Atlas Invoice',
    `Order ID: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleString()}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Payment: ${order.paymentMethod.toUpperCase()}`,
    `Status: ${order.status.toUpperCase()}`,
    '',
    'Products:',
    ...order.items.map(
      (item) => `${item.name} | Qty ${item.quantity} | Rs. ${(item.price * item.quantity).toLocaleString()}`
    ),
    '',
    `Subtotal: Rs. ${order.subtotal.toLocaleString()}`,
    `Delivery: Rs. ${order.delivery.toLocaleString()}`,
    `Total: Rs. ${order.total.toLocaleString()}`,
  ].join('\n');

  const blob = new Blob([invoiceLines], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${order.id}-invoice.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
