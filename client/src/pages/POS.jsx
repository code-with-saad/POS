import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import ItemVisual from '../components/ItemVisual.jsx';
import SideDrawer from '../components/SideDrawer.jsx';

export default function POS() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Master Data
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // POS State
  const [orderType, setOrderType] = useState('dine-in'); // dine-in | takeaway | delivery
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  // Modals
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    fetchPOSData();
  }, []);

  async function fetchPOSData() {
    try {
      setLoading(true);
      const [catsData, itemsData, tablesData, settingsData] = await Promise.all([
        api.get('/categories'),
        api.get('/menu-items'),
        api.get('/tables'),
        api.get('/settings'),
      ]);

      setCategories(catsData);
      setMenuItems(itemsData);
      setTables(tablesData);
      setSettings(settingsData);

      // Auto-select first available table for dine-in if none selected
      const availableTable = tablesData.find((t) => t.status === 'available');
      if (availableTable) {
        setSelectedTable(availableTable);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  }

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        !selectedCategory ||
        (item.category?._id || item.category) === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart Computations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const taxRatePercent = settings?.taxRatePercent || 16;
  const discountAmount = Math.max(0, Number(discount) || 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(afterDiscount * (taxRatePercent / 100));
  const grandTotal = Math.round(afterDiscount + tax);

  const changeDue = useMemo(() => {
    const tendered = Number(cashTendered) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [cashTendered, grandTotal]);

  // Cart Operations
  function addToCart(menuItem) {
    if (!menuItem.isAvailable) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (ci) => ci.menuItem === menuItem._id
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            menuItem: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            notes: '',
            imageUrl: menuItem.imageUrl,
            categoryName: menuItem.category?.name,
          },
        ];
      }
    });
  }

  function updateQuantity(menuItemId, delta) {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.menuItem === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  }

  function updateNotes(menuItemId, notes) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.menuItem === menuItemId ? { ...item, notes } : item
      )
    );
  }

  function removeFromCart(menuItemId) {
    setCart((prevCart) => prevCart.filter((i) => i.menuItem !== menuItemId));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setCashTendered('');
  }

  // Handle Checkout Submission
  async function handleConfirmOrder() {
    if (cart.length === 0) return;
    if (orderType === 'dine-in' && !selectedTable) {
      setError('Please select a dining table for dine-in orders');
      setShowTableModal(true);
      return;
    }

    // Cash validation — tendered must cover the total
    if (paymentMethod === 'cash') {
      const tendered = Number(cashTendered) || 0;
      if (tendered < grandTotal) {
        setCheckoutError(`Cash tendered (Rs. ${tendered.toLocaleString()}) is less than total (Rs. ${grandTotal.toLocaleString()}). Please give enough cash.`);
        return;
      }
    }
    setCheckoutError('');

    setSubmitting(true);
    setError('');

    try {
      const orderPayload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTable?._id : undefined,
        items: cart.map((ci) => ({
          menuItem: ci.menuItem,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
        discount: discountAmount,
        paymentMethod,
      };

      const orderData = await api.post('/orders', orderPayload);
      setCompletedOrder(orderData);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);

      // Refresh tables list so occupied table reflects
      const updatedTables = await api.get('/tables');
      setTables(updatedTables);
      const nextAvailable = updatedTables.find((t) => t.status === 'available');
      setSelectedTable(nextAvailable || null);

      clearCart();
    } catch (err) {
      setError(err.message || 'Failed to complete order');
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={`pos-app${drawerOpen ? ' pos-drawer-active' : ''}`}>
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} currentPage="POS Terminal" />

      {/* Top Navbar */}
      <header className="pos-header">
        <div className="pos-header-left">
          <button
            className="pos-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <span /><span /><span />
          </button>
          <div className="pos-logo">☕</div>
          <div>
            <h1 className="pos-title">{settings?.restaurantName || 'CafePOS'}</h1>
            <span className="pos-subtitle">Point of Sale Terminal</span>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="order-type-tabs">
          <button
            className={`type-btn ${orderType === 'dine-in' ? 'type-btn-active' : ''}`}
            onClick={() => {
              setOrderType('dine-in');
              if (!selectedTable) setShowTableModal(true);
            }}
          >
            🪑 Dine-In
          </button>
          <button
            className={`type-btn ${orderType === 'takeaway' ? 'type-btn-active' : ''}`}
            onClick={() => setOrderType('takeaway')}
          >
            🛍️ Takeaway
          </button>
          <button
            className={`type-btn ${orderType === 'delivery' ? 'type-btn-active' : ''}`}
            onClick={() => setOrderType('delivery')}
          >
            🛵 Delivery
          </button>
        </div>

        <div className="pos-header-right">
          <Link to="/kitchen" className="btn-admin-link">
            👨‍🍳 Kitchen View
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn-admin-link">
              🛠️ Admin Dashboard
            </Link>
          )}
          <div className="pos-user-badge">
            <span>👤 {user?.name}</span>
            <button className="pos-logout" onClick={handleLogout} title="Logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-error pos-alert">{error}</div>}

      {/* Main 2-Column Grid */}
      <div className="pos-main-grid">
        {/* Left Column: Menu Items Browser */}
        <div className="pos-menu-section">
          {/* Category Tabs & Search */}
          <div className="pos-filter-bar">
            <div className="category-tabs">
              <button
                className={`tab-btn ${selectedCategory === '' ? 'tab-btn-active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  className={`tab-btn ${selectedCategory === cat._id ? 'tab-btn-active' : ''}`}
                  onClick={() => setSelectedCategory(cat._id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Menu Items Cards */}
          {loading ? (
            <div className="loading-state">
              <div className="btn-spinner" />
              <p>Loading menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">☕</span>
              <p>No menu items available matching criteria</p>
            </div>
          ) : (
            <div className="menu-cards-grid">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className={`menu-card ${!item.isAvailable ? 'menu-card-unavailable' : ''}`}
                  onClick={() => addToCart(item)}
                >
                  <ItemVisual
                    imageUrl={item.imageUrl}
                    itemName={item.name}
                    categoryName={item.category?.name}
                    className="menu-card-visual"
                  />

                  <div className="menu-card-header">
                    <span className="menu-card-name">{item.name}</span>
                    <span className="menu-card-price">Rs. {item.price}</span>
                  </div>

                  {item.description && (
                    <p className="menu-card-desc">{item.description}</p>
                  )}

                  <div className="menu-card-footer">
                    <span className="category-pill">{item.category?.name}</span>
                    <button
                      className="btn-add-cart"
                      disabled={!item.isAvailable}
                    >
                      {item.isAvailable ? '+ Add' : 'Sold Out'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Cart & Bill Panel */}
        <div className="pos-cart-section">
          {/* Table Header / Selection Bar */}
          <div className="cart-header">
            <div className="cart-header-title">
              <h2>Current Order</h2>
              <span className="order-type-badge">{orderType.toUpperCase()}</span>
            </div>

            {orderType === 'dine-in' && (
              <button
                className="table-select-btn"
                onClick={() => setShowTableModal(true)}
              >
                {selectedTable ? (
                  <>📍 {selectedTable.name} ({selectedTable.section})</>
                ) : (
                  <>⚠️ Select Table</>
                )}
              </button>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="cart-items-list">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">🛒</span>
                <p>Cart is empty</p>
                <span className="cart-empty-sub">Click items on the left to add to order</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuItem} className="cart-item-row">
                  <ItemVisual
                    imageUrl={item.imageUrl}
                    itemName={item.name}
                    categoryName={item.categoryName}
                    className="cart-item-visual"
                  />
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-unit-price">Rs. {item.price} each</span>

                    {/* Per Item Note Input */}
                    <input
                      type="text"
                      className="cart-item-notes-input"
                      placeholder="Add note (e.g. extra foam)..."
                      value={item.notes}
                      onChange={(e) => updateNotes(item.menuItem, e.target.value)}
                    />
                  </div>

                  {/* Quantity Controls */}
                  <div className="cart-item-qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.menuItem, -1)}
                    >
                      -
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.menuItem, 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total & Delete */}
                  <div className="cart-item-total">
                    <span className="line-total-price">Rs. {item.price * item.quantity}</span>
                    <button
                      className="btn-remove-item"
                      onClick={() => removeFromCart(item.menuItem)}
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Totals Summary */}
          <div className="cart-summary">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>

            <div className="summary-line">
              <span>Discount (PKR)</span>
              <input
                type="number"
                min="0"
                className="discount-input"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="summary-line">
              <span>Tax ({taxRatePercent}%)</span>
              <span>Rs. {tax.toLocaleString()}</span>
            </div>

            <div className="summary-line summary-grand-total">
              <span>Total Payable</span>
              <span>Rs. {grandTotal.toLocaleString()}</span>
            </div>

            {/* Cart Action Buttons */}
            <div className="cart-actions">
              <button
                className="btn-secondary flex-1"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear Cart
              </button>
              <button
                className="btn-primary flex-2"
                onClick={() => setShowCheckoutModal(true)}
                disabled={cart.length === 0}
              >
                Checkout &amp; Pay →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Picker Modal */}
      {showTableModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>Select Dining Table</h3>
              <button className="modal-close" onClick={() => setShowTableModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body p-6">
              <p className="text-muted mb-4">Choose an available table for this dine-in order:</p>
              <div className="tables-grid">
                {tables.map((t) => {
                  const isAvailable = t.status === 'available';
                  const isSelected = selectedTable?._id === t._id;
                  return (
                    <div
                      key={t._id}
                      className={`table-box cursor-pointer ${
                        isSelected ? 'ring-2 ring-amber-500' : ''
                      } ${isAvailable ? 'table-box-available' : 'table-box-occupied opacity-60'}`}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedTable(t);
                          setShowTableModal(false);
                        }
                      }}
                    >
                      <div className="table-box-header">
                        <span className="table-box-name">{t.name}</span>
                        <span
                          className={`status-badge ${
                            isAvailable ? 'status-badge-available' : 'status-badge-occupied'
                          }`}
                        >
                          {isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                        </span>
                      </div>
                      <div className="table-box-body">
                        <p className="table-box-section">📍 {t.section || 'Main Hall'}</p>
                        <p className="table-box-capacity">👥 Capacity: {t.capacity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Checkout &amp; Payment</h3>
              <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-form">
              <div className="checkout-summary-box">
                <div className="flex justify-between text-sm mb-1">
                  <span>Order Type:</span>
                  <span className="font-semibold uppercase">{orderType}</span>
                </div>
                {orderType === 'dine-in' && (
                  <div className="flex justify-between text-sm mb-1">
                    <span>Table:</span>
                    <span className="font-semibold">{selectedTable?.name} ({selectedTable?.section})</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-amber-400 mt-2 pt-2 border-t border-zinc-700">
                  <span>Total Amount:</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-method-toggle">
                  <button
                    type="button"
                    className={`pay-btn ${paymentMethod === 'cash' ? 'pay-btn-active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    className={`pay-btn ${paymentMethod === 'card' ? 'pay-btn-active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    💳 Card / POS Machine
                  </button>
                </div>
              </div>

              {/* Cash Calculator if Cash */}
              {paymentMethod === 'cash' && (
                <div className="form-group">
                  <label>Cash Tendered (PKR)</label>

                  {/* Quick Denomination Buttons */}
                  <div className="cash-denominations">
                    {[100, 200, 500, 1000, 5000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        className={`denom-btn ${Number(cashTendered) === denom ? 'denom-btn-active' : ''}`}
                        onClick={() => setCashTendered(String(denom))}
                      >
                        {denom >= 1000 ? `${denom / 1000}K` : denom}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`denom-btn denom-btn-exact ${Number(cashTendered) === grandTotal ? 'denom-btn-active' : ''}`}
                      onClick={() => setCashTendered(String(grandTotal))}
                      title="Set exact amount"
                    >
                      Exact
                    </button>
                  </div>

                  <input
                    type="number"
                    placeholder="Or enter custom amount..."
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                  />
                  {Number(cashTendered) > 0 && (
                    <div className="change-due-box mt-2">
                      <span>Change to Return:</span>
                      <span className="change-due-val">Rs. {changeDue.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {checkoutError && (
                <div className="checkout-inline-error">
                  ⚠️ {checkoutError}
                </div>
              )}

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setShowCheckoutModal(false); setCheckoutError(''); }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Confirm Order & Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && completedOrder && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header no-print">
              <h3>Order Completed!</h3>
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>
                ✕
              </button>
            </div>

            <div className="receipt-container" id="printable-receipt">
              {/* Receipt Header */}
              <div className="receipt-header">
                <h2>{settings?.restaurantName || 'CafePOS'}</h2>
                <p>{settings?.address}</p>
                <p>Tel: {settings?.phone}</p>
                <div className="receipt-divider" />
                <p className="receipt-order-no">ORDER #{completedOrder.orderNumber}</p>
                <p className="receipt-date">
                  Date: {new Date(completedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Order Metadata */}
              <div className="receipt-meta">
                <p>Type: <strong>{completedOrder.orderType.toUpperCase()}</strong></p>
                {completedOrder.table && (
                  <p>Table: <strong>{completedOrder.table.name || completedOrder.table}</strong></p>
                )}
                <p>Cashier: <strong>{completedOrder.cashier?.name || user?.name}</strong></p>
                <p>Payment: <strong>{completedOrder.paymentMethod.toUpperCase()}</strong></p>
              </div>

              <div className="receipt-divider" />

              {/* Items Table */}
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {item.name}
                        {item.notes && <span className="receipt-item-note"> ({item.notes})</span>}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{item.price}</td>
                      <td className="text-right">{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-divider" />

              {/* Totals */}
              <div className="receipt-totals">
                <div className="receipt-line">
                  <span>Subtotal:</span>
                  <span>Rs. {completedOrder.subtotal}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="receipt-line">
                    <span>Discount:</span>
                    <span>-Rs. {completedOrder.discount}</span>
                  </div>
                )}
                <div className="receipt-line">
                  <span>Tax ({settings?.taxRatePercent || 16}%):</span>
                  <span>Rs. {completedOrder.tax}</span>
                </div>
                <div className="receipt-line receipt-grand-total">
                  <span>TOTAL:</span>
                  <span>Rs. {completedOrder.total}</span>
                </div>
              </div>

              <div className="receipt-divider" />
              <p className="receipt-footer-msg">
                {settings?.receiptFooter || 'Thank you for your visit!'}
              </p>
            </div>

            {/* Receipt Modal Buttons */}
            <div className="modal-actions no-print p-4 bg-zinc-900 border-t border-zinc-800">
              <button
                className="btn-secondary"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
              <button className="btn-primary" onClick={handlePrintReceipt}>
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
