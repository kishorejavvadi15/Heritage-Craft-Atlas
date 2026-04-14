import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authStorage } from '../utils/auth';
import { downloadOrderInvoice, orderStorage, OrderStatus, StoredOrder } from '../utils/orders';
import './Orders.css';

const STATUS_FLOW: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'delivered'];

const formatStatus = (status: OrderStatus) => status.charAt(0).toUpperCase() + status.slice(1);

const Orders: React.FC = () => {
  const userEmail = authStorage.getCurrentUserEmail();
  const [orders, setOrders] = useState<StoredOrder[]>(orderStorage.getByCustomer(userEmail || undefined));

  useEffect(() => {
    const syncOrders = () => setOrders(orderStorage.getByCustomer(userEmail || undefined));
    window.addEventListener('orders-updated', syncOrders);
    return () => window.removeEventListener('orders-updated', syncOrders);
  }, [userEmail]);

  const activeOrders = useMemo(() => orders.filter((order) => order.status !== 'cancelled'), [orders]);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p>Track your purchases, cancel active orders, and download invoices.</p>
        </div>
        <Link to="/products" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty-state">
          <h2>No orders yet</h2>
          <p>Place an order from the cart to start tracking your products here.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const activeStepIndex = STATUS_FLOW.indexOf(order.status);

            return (
              <article key={order.id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <span className="order-id">{order.id}</span>
                    <h2>{formatStatus(order.status)}</h2>
                    <p>{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`order-status-badge status-${order.status}`}>{formatStatus(order.status)}</div>
                </div>

                <div className="order-tracking-row">
                  {STATUS_FLOW.map((step, index) => {
                    const isComplete = order.status !== 'cancelled' && index <= activeStepIndex;
                    return (
                      <div key={step} className={`tracking-step ${isComplete ? 'complete' : ''}`}>
                        <span className="tracking-dot" />
                        <span>{formatStatus(step)}</span>
                      </div>
                    );
                  })}
                  {order.status === 'cancelled' && <div className="tracking-cancelled">Order Cancelled</div>}
                </div>

                <div className="order-products">
                  {order.items.map((item) => (
                    <div key={item.productId} className="order-product-row">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.artisanName} | Qty {item.quantity}</p>
                      </div>
                      <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="order-summary-bar">
                  <div>
                    <span>Total</span>
                    <strong>Rs. {order.total.toLocaleString()}</strong>
                  </div>
                  <div className="order-action-row">
                    <button type="button" className="btn btn-secondary" onClick={() => downloadOrderInvoice(order)}>
                      Download Invoice
                    </button>
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button type="button" className="btn btn-secondary" onClick={() => orderStorage.cancel(order.id)}>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activeOrders.length > 0 && (
        <div className="orders-help-panel">
          <h3>Tracking info</h3>
          <p>`Confirmed` means your order was received, `Packed` means it's prepared, `Shipped` means it's on the way, and `Delivered` means it reached you.</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
