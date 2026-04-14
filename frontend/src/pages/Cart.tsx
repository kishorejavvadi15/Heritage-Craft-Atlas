import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cartStorage, CartItem } from '../utils/cart';
import { authStorage } from '../utils/auth';
import { orderStorage } from '../utils/orders';
import './Cart.css';

const DELIVERY_FEE = 149;

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString()}`;
const createOrderId = () => `HA-${Date.now().toString().slice(-6)}`;

const paymentDetails = {
  upi: {
    title: 'UPI',
    subtitle: 'Google Pay, PhonePe, Paytm and BHIM',
    summaryTitle: 'UPI Payment',
    summaryText: 'UPI ID: heritagecraft@upi',
  },
  card: {
    title: 'Cards',
    subtitle: 'Credit card, debit card and RuPay',
    summaryTitle: 'Card Payment',
    summaryText: 'Secure card processing with VISA, MasterCard and RuPay support.',
  },
  cod: {
    title: 'Cash on Delivery',
    subtitle: 'Pay at your doorstep after confirmation',
    summaryTitle: 'Cash on Delivery',
    summaryText: 'Order will be confirmed first and payment will be collected on delivery.',
  },
} as const;

type FakeOrder = {
  id: string;
  paymentMethod: 'upi' | 'card' | 'cod';
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  createdAt: string;
};

const Cart: React.FC = () => {
  const userEmail = authStorage.getCurrentUserEmail() || '';
  const [cartItems, setCartItems] = useState<CartItem[]>(cartStorage.getAll());
  const [selectedPayment, setSelectedPayment] = useState<'upi' | 'card' | 'cod'>('upi');
  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    upiId: '',
    cardNumber: '',
    cardName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastOrder, setLastOrder] = useState<FakeOrder | null>(null);

  useEffect(() => {
    const syncCart = () => setCartItems(cartStorage.getAll());
    window.addEventListener('cart-updated', syncCart);
    return () => window.removeEventListener('cart-updated', syncCart);
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );
  const delivery = cartItems.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + delivery;

  const handleQuantityChange = (productId: string, quantity: number) => {
    cartStorage.updateQuantity(productId, quantity);
    setCartItems(cartStorage.getAll());
    setErrors({});
  };

  const handleCustomerFormChange = (key: keyof typeof customerForm, value: string) => {
    setCustomerForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!customerForm.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!customerForm.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(customerForm.phone.trim())) {
      nextErrors.phone = 'Enter a valid 10-digit phone number.';
    }

    if (!customerForm.address.trim()) {
      nextErrors.address = 'Address is required.';
    }

    if (selectedPayment === 'upi') {
      if (!customerForm.upiId.trim()) {
        nextErrors.upiId = 'UPI ID is required.';
      } else if (!customerForm.upiId.includes('@')) {
        nextErrors.upiId = 'Enter a valid UPI ID.';
      }
    }

    if (selectedPayment === 'card') {
      if (!customerForm.cardNumber.trim()) {
        nextErrors.cardNumber = 'Card number is required.';
      } else if (customerForm.cardNumber.replace(/\s+/g, '').length < 12) {
        nextErrors.cardNumber = 'Enter a valid card number.';
      }

      if (!customerForm.cardName.trim()) {
        nextErrors.cardName = 'Card holder name is required.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const nextOrder: FakeOrder = {
      id: createOrderId(),
      paymentMethod: selectedPayment,
      items: cartItems,
      subtotal,
      delivery,
      total,
      customerName: customerForm.fullName.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      createdAt: new Date().toLocaleString(),
    };

    orderStorage.create({
      id: nextOrder.id,
      customerEmail: userEmail,
      customerName: nextOrder.customerName,
      phone: nextOrder.phone,
      address: nextOrder.address,
      paymentMethod: nextOrder.paymentMethod,
      items: nextOrder.items,
      subtotal: nextOrder.subtotal,
      delivery: nextOrder.delivery,
      total: nextOrder.total,
      createdAt: new Date().toISOString(),
    });

    cartStorage.clear();
    setCartItems([]);
    setLastOrder(nextOrder);
  };

  return (
    <div className="cart-page">
      <section className="cart-hero">
        <div>
          <span className="cart-eyebrow">Online Purchasing</span>
          <h1>Secure Checkout</h1>
        </div>
        <Link to="/products" className="btn btn-secondary">
          Continue Shopping
        </Link>
      </section>

      {lastOrder && (
        <section className="order-success-panel">
          <div className="order-success-header">
            <div>
              <span className="cart-eyebrow">Payment Successful</span>
              <h2>Order Confirmed</h2>
              <p>Your fake payment was accepted and the receipt below shows the products you ordered.</p>
            </div>
            <div className="order-id-chip">{lastOrder.id}</div>
          </div>

          <div className="order-success-grid">
            <div className="order-receipt-card">
              <h3>Receipt</h3>
              <div className="receipt-meta">
                <div><span>Customer</span><strong>{lastOrder.customerName}</strong></div>
                <div><span>Phone</span><strong>{lastOrder.phone}</strong></div>
                <div><span>Payment</span><strong>{paymentDetails[lastOrder.paymentMethod].title}</strong></div>
                <div><span>Placed On</span><strong>{lastOrder.createdAt}</strong></div>
              </div>
              <div className="receipt-address">
                <span>Delivery Address</span>
                <strong>{lastOrder.address}</strong>
              </div>
            </div>

            <div className="ordered-products-card">
              <h3>Ordered Products</h3>
              <div className="ordered-products-list">
                {lastOrder.items.map((item) => (
                  <div key={item.productId} className="ordered-product-row">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.artisanName} | Qty {item.quantity}</p>
                    </div>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-total">
                <div><span>Subtotal</span><strong>{formatCurrency(lastOrder.subtotal)}</strong></div>
                <div><span>Delivery</span><strong>{formatCurrency(lastOrder.delivery)}</strong></div>
                <div className="receipt-total-final"><span>Total</span><strong>{formatCurrency(lastOrder.total)}</strong></div>
              </div>
            </div>
          </div>

          <div className="order-success-actions">
            <Link to="/orders" className="btn btn-primary">
              Track This Order
            </Link>
            <Link to="/products" className="btn btn-secondary">
              Shop More
            </Link>
          </div>
        </section>
      )}

      {cartItems.length === 0 ? (
        <div className="cart-empty-state">
          <h2>Your cart is empty</h2>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-panel">
            <div className="cart-section-heading">
              <h2>Items in cart</h2>
              <span>{cartItems.length} product{cartItems.length > 1 ? 's' : ''}</span>
            </div>

            <div className="cart-item-list">
              {cartItems.map((item) => (
                <article key={item.productId} className="cart-item-card">
                  <div className="cart-item-media">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="cart-item-image" /> : <div className="cart-item-image placeholder">Craft Item</div>}
                  </div>
                  <div className="cart-item-content">
                    <div className="cart-item-copy">
                      <h3>{item.name}</h3>
                      <p>By {item.artisanName}</p>
                      <p>{item.region}</p>
                    </div>
                    <div className="cart-item-controls">
                      <label htmlFor={`qty-${item.productId}`}>Qty</label>
                      <select
                        id={`qty-${item.productId}`}
                        value={item.quantity}
                        onChange={(event) => handleQuantityChange(item.productId, Number(event.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map((qty) => (
                          <option key={qty} value={qty}>
                            {qty}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="cart-remove-btn" onClick={() => handleQuantityChange(item.productId, 0)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">{formatCurrency(item.price * item.quantity)}</div>
                </article>
              ))}
            </div>
          </section>

          <aside className="cart-summary-panel">
            <div className="cart-section-heading">
              <h2>Checkout</h2>
              <span>Choose payment</span>
            </div>

            <div className="payment-options">
              <label className={`payment-option ${selectedPayment === 'upi' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="upi"
                  checked={selectedPayment === 'upi'}
                  onChange={() => setSelectedPayment('upi')}
                />
                <div>
                  <strong>{paymentDetails.upi.title}</strong>
                  <p>{paymentDetails.upi.subtitle}</p>
                </div>
              </label>

              <label className={`payment-option ${selectedPayment === 'card' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="card"
                  checked={selectedPayment === 'card'}
                  onChange={() => setSelectedPayment('card')}
                />
                <div>
                  <strong>{paymentDetails.card.title}</strong>
                  <p>{paymentDetails.card.subtitle}</p>
                </div>
              </label>

              <label className={`payment-option ${selectedPayment === 'cod' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="cod"
                  checked={selectedPayment === 'cod'}
                  onChange={() => setSelectedPayment('cod')}
                />
                <div>
                  <strong>{paymentDetails.cod.title}</strong>
                  <p>{paymentDetails.cod.subtitle}</p>
                </div>
              </label>
            </div>

            <div className="payment-demo-card">
              <h3>{paymentDetails[selectedPayment].summaryTitle}</h3>
              <p>{paymentDetails[selectedPayment].summaryText}</p>
            </div>

            <div className="checkout-form-card">
              <h3>Customer Details</h3>
              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={customerForm.fullName}
                    onChange={(event) => handleCustomerFormChange('fullName', event.target.value)}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                <div className="checkout-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={customerForm.phone}
                    onChange={(event) => handleCustomerFormChange('phone', event.target.value)}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>

                <div className="checkout-field checkout-field-full">
                  <label htmlFor="address">Delivery Address</label>
                  <textarea
                    id="address"
                    value={customerForm.address}
                    onChange={(event) => handleCustomerFormChange('address', event.target.value)}
                    placeholder="House number, street, city, state"
                    rows={3}
                  />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                </div>

                {selectedPayment === 'upi' && (
                  <div className="checkout-field checkout-field-full">
                    <label htmlFor="upiId">UPI ID</label>
                    <input
                      id="upiId"
                      type="text"
                      value={customerForm.upiId}
                      onChange={(event) => handleCustomerFormChange('upiId', event.target.value)}
                      placeholder="name@bank"
                    />
                    {errors.upiId && <span className="field-error">{errors.upiId}</span>}
                  </div>
                )}

                {selectedPayment === 'card' && (
                  <>
                    <div className="checkout-field checkout-field-full">
                      <label htmlFor="cardNumber">Card Number</label>
                      <input
                        id="cardNumber"
                        type="text"
                        value={customerForm.cardNumber}
                        onChange={(event) => handleCustomerFormChange('cardNumber', event.target.value)}
                        placeholder="1234 5678 9012 3456"
                      />
                      {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                    </div>
                    <div className="checkout-field checkout-field-full">
                      <label htmlFor="cardName">Card Holder Name</label>
                      <input
                        id="cardName"
                        type="text"
                        value={customerForm.cardName}
                        onChange={(event) => handleCustomerFormChange('cardName', event.target.value)}
                        placeholder="Name on card"
                      />
                      {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="cart-total-breakdown">
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{formatCurrency(delivery)}</strong>
              </div>
              <div className="cart-grand-total">
                <span>Total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>

            <button type="button" className="btn btn-primary cart-checkout-btn" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
