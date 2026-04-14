import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authStorage } from '../utils/auth';
import { downloadOrderInvoice, orderStorage, OrderStatus, StoredOrder } from '../utils/orders';
import './Orders.css';

const STATUSES: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

const formatStatus = (status: OrderStatus) => status.charAt(0).toUpperCase() + status.slice(1);

const AdminOrders: React.FC = () => {
  const isAdmin = authStorage.isAdmin();
  const [orders, setOrders] = useState<StoredOrder[]>(orderStorage.getAll());

  useEffect(() => {
    const syncOrders = () => setOrders(orderStorage.getAll());
    window.addEventListener('orders-updated', syncOrders);
    return () => window.removeEventListener('orders-updated', syncOrders);
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>Admin Order Panel</h1>
          <p>Review all customer orders, update statuses, and download invoices.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty-state">
          <h2>No customer orders yet</h2>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <span className="order-id">{order.id}</span>
                  <h2>{order.customerName}</h2>
                  <p>{order.customerEmail}</p>
                </div>
                <div className={`order-status-badge status-${order.status}`}>{formatStatus(order.status)}</div>
              </div>

              <div className="admin-order-meta">
                <span>Phone: {order.phone}</span>
                <span>Payment: {order.paymentMethod.toUpperCase()}</span>
                <span>Total: Rs. {order.total.toLocaleString()}</span>
              </div>

              <div className="order-products">
                {order.items.map((item) => (
                  <div key={item.productId} className="order-product-row">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.region} | Qty {item.quantity}</p>
                    </div>
                    <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="admin-order-controls">
                <select
                  value={order.status}
                  onChange={(event) => orderStorage.updateStatus(order.id, event.target.value as OrderStatus)}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary" onClick={() => downloadOrderInvoice(order)}>
                  Download Invoice
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
