import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../api/client.js';
import ItemVisual from '../components/ItemVisual.jsx';
import SideDrawer from '../components/SideDrawer.jsx';

export default function POS() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Master Data
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // POS State
  const [orderType, setOrderType] = useState('dine-in'); // dine-in | takeaway | delivery
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

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

  // Selected cart item index for keyboard shortcut navigation
  const [selectedCartIndex, setSelectedCartIndex] = useState(0);

  // Keep selectedCartIndex valid when cart length changes
  useEffect(() => {
    if (cart.length === 0) {
      setSelectedCartIndex(0);
    } else if (selectedCartIndex >= cart.length) {
      setSelectedCartIndex(cart.length - 1);
    }
  }, [cart.length, selectedCartIndex]);

  // History stack for cash tendered Undo
  const [cashHistory, setCashHistory] = useState([]);

  function pushCashTendered(newVal) {
    setCashHistory((prev) => [...prev, cashTendered]);
    setCashTendered(newVal);
  }

  function handleUndoCash() {
    if (cashHistory.length === 0) return;
    const previous = cashHistory[cashHistory.length - 1];
    setCashHistory((prev) => prev.slice(0, -1));
    setCashTendered(previous);
  }

  function handleClearCash() {
    setCashHistory((prev) => [...prev, cashTendered]);
    setCashTendered('');
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Check if user is typing in an editable field or input/textarea/select
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isEditable = document.activeElement?.isContentEditable || activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
      if (isEditable) return;

      // Do NOT allow quantity adjustment via arrow keys if checkout modal or receipt modal is open
      if (showCheckoutModal || showReceiptModal) {
        if (e.key === 'Enter') {
          if (showReceiptModal) return;
          e.preventDefault();
          if (showCheckoutModal) {
            handleConfirmOrder();
          }
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (cart.length === 0) return;
        e.preventDefault();

        // Target currently selected cart item
        const targetIndex = selectedCartIndex < cart.length ? selectedCartIndex : 0;
        const targetItem = cart[targetIndex];
        if (targetItem) {
          const delta = e.key === 'ArrowUp' ? 1 : -1;
          updateQuantity(targetItem.menuItem, delta);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowCheckoutModal(true);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCartIndex, showCheckoutModal, showReceiptModal, grandTotal, paymentMethod, cashTendered, orderType, selectedTable]);

  useEffect(() => {
    fetchPOSData();
  }, []);

  async function fetchPOSData() {
    try {
      setLoading(true);
      const [catsData, itemsData, tablesData, settingsData, customersData] = await Promise.all([
        api.get('/categories'),
        api.get('/menu-items'),
        api.get('/tables'),
        api.get('/settings'),
        api.get('/customers'),
      ]);

      setCategories(catsData);
      setMenuItems(itemsData);
      setTables(tablesData);
      setSettings(settingsData);
      setCustomers(customersData || []);

      // Auto-select first table if none selected
      const defaultTable = tablesData[0];
      if (defaultTable) {
        handleSelectTable(defaultTable);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTable(t) {
    setSelectedTable(t);
    try {
      const openOrd = await api.get(`/orders/open-by-table/${t._id}`);
      if (openOrd) {
        setActiveOrder(openOrd);
        // Pre-populate cart with existing items snapshot
        const existingCartItems = openOrd.items.map((i) => ({
          cartKey: `${i.menuItem}_${i.variant || 'base'}_r${i.round}`,
          menuItem: i.menuItem,
          name: i.name,
          variant: i.variant || '',
          price: i.price,
          quantity: i.quantity,
          notes: i.notes || '',
          round: i.round,
          isSent: true,
        }));
        setCart(existingCartItems);
        setDiscount(openOrd.discount || 0);
      } else {
        setActiveOrder(null);
        setCart([]);
        setDiscount(0);
      }
    } catch (err) {
      setActiveOrder(null);
    }
  }


  // Variant Picker Modal State
  const [variantPickerItem, setVariantPickerItem] = useState(null);

  // Cart Operations
  function handleItemClick(menuItem) {
    if (!menuItem.isAvailable) return;
    if (Array.isArray(menuItem.variants) && menuItem.variants.length > 0) {
      setVariantPickerItem(menuItem);
    } else {
      addToCart(menuItem, null);
    }
  }

  function addToCart(menuItem, variant = null) {
    if (!menuItem.isAvailable) return;

    const itemPrice = variant ? variant.price : menuItem.price;
    const variantName = variant ? variant.name : '';
    const cartKey = variant ? `${menuItem._id}_${variant.name}` : menuItem._id;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (ci) => ci.cartKey === cartKey
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            cartKey,
            menuItem: menuItem._id,
            name: menuItem.name,
            variant: variantName,
            price: itemPrice,
            quantity: 1,
            notes: '',
            imageUrl: menuItem.imageUrl,
            categoryName: menuItem.category?.name,
          },
        ];
      }
    });
  }

  function updateQuantity(cartKey, delta) {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if ((item.cartKey || item.menuItem) === cartKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  }

  function updateNotes(cartKey, notes) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        (item.cartKey || item.menuItem) === cartKey ? { ...item, notes } : item
      )
    );
  }

  function removeFromCart(cartKey) {
    setCart((prevCart) => prevCart.filter((i) => (i.cartKey || i.menuItem) !== cartKey));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setCashTendered('');
    setActiveOrder(null);
  }

  async function handleSendToKitchen() {
    const unsentItems = cart.filter((ci) => !ci.isSent);
    if (unsentItems.length === 0) return;
    if (orderType === 'dine-in' && !selectedTable) {
      setError('Please select a dining table');
      setShowTableModal(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const orderPayload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTable?._id : undefined,
        items: unsentItems.map((ci) => ({
          menuItem: ci.menuItem,
          variant: ci.variant || undefined,
          price: ci.price,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
        discount: discountAmount,
        isSendToKitchen: true,
      };

      const updatedOrd = await api.post('/orders', orderPayload);
      setActiveOrder(updatedOrd);

      // Refresh table status so it shows occupied
      const updatedTables = await api.get('/tables');
      setTables(updatedTables);
      if (selectedTable) {
        const cur = updatedTables.find((t) => t._id === selectedTable._id);
        if (cur) setSelectedTable(cur);
      }

      // Refresh cart to show all items as sent
      handleSelectTable(selectedTable);
      setError('');
      showToast('success', `👨‍🍳 ${unsentItems.length} new item(s) sent to kitchen display successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to send order to kitchen');
      showToast('error', err.message || 'Failed to send order to kitchen');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Checkout Submission
  async function handleConfirmOrder() {
    if (cart.length === 0) return;
    if (orderType === 'dine-in' && !selectedTable) {
      setError('Please select a dining table for dine-in orders');
      setShowTableModal(true);
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomerId) {
      setCheckoutError('Please select a customer from the dropdown to charge to their Credit Tab.');
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
      const unsentItems = cart.filter((ci) => !ci.isSent);
      
      const orderPayload = {
        orderType,
        tableId: orderType === 'dine-in' ? selectedTable?._id : undefined,
        customerId: selectedCustomerId || undefined,
        items: unsentItems.length > 0 ? unsentItems.map((ci) => ({
          menuItem: ci.menuItem,
          variant: ci.variant || undefined,
          price: ci.price,
          quantity: ci.quantity,
          notes: ci.notes,
        })) : cart.map((ci) => ({
          menuItem: ci.menuItem,
          variant: ci.variant || undefined,
          price: ci.price,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
        discount: discountAmount,
        paymentMethod,
        isSendToKitchen: false,
      };

      const orderData = await api.post('/orders', orderPayload);
      setCompletedOrder(orderData);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);

      // Refresh tables list so freed table reflects
      const updatedTables = await api.get('/tables');
      setTables(updatedTables);
      const nextAvailable = updatedTables.find((t) => t.status === 'available');
      if (nextAvailable) {
        handleSelectTable(nextAvailable);
      } else {
        clearCart();
      }
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
              {filteredItems.map((item) => {
                const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
                return (
                  <div
                    key={item._id}
                    className={`menu-card ${!item.isAvailable ? 'menu-card-unavailable' : ''} ${item.isDeal ? 'menu-card-deal' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.isDeal && (
                      <span className="deal-badge">🔥 DEAL</span>
                    )}
                    <ItemVisual
                      imageUrl={item.imageUrl}
                      itemName={item.name}
                      categoryName={item.category?.name}
                      className="menu-card-visual"
                    />

                    <div className="menu-card-header">
                      <span className="menu-card-name">{item.name}</span>
                      <div className="menu-card-price-block">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="menu-card-original-price">Rs. {item.originalPrice}</span>
                        )}
                        <span className="menu-card-price">
                          {hasVariants ? `From Rs. ${Math.min(...item.variants.map(v => v.price))}` : `Rs. ${item.price}`}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="deal-discount-pct">
                            -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>
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
                        {!item.isAvailable ? 'Sold Out' : hasVariants ? 'Choose Size' : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
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
              cart.map((item, index) => {
                const isSelected = index === selectedCartIndex;
                const itemKey = item.cartKey || item.menuItem;
                return (
                  <div
                    key={itemKey}
                    className={`cart-item-row ${isSelected ? 'cart-item-selected' : ''}`}
                    onClick={() => setSelectedCartIndex(index)}
                    style={isSelected ? { outline: '2px solid #f59e0b', borderRadius: '8px' } : {}}
                  >
                    <ItemVisual
                      imageUrl={item.imageUrl}
                      itemName={item.name}
                      categoryName={item.categoryName}
                      className="cart-item-visual"
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-name">
                        {item.name}
                        {item.variant && (
                          <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                            {item.variant}
                          </span>
                        )}
                        {item.isSent ? (
                          <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                            Sent (R{item.round || 1})
                          </span>
                        ) : (
                          <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                            New
                          </span>
                        )}
                      </span>
                      <span className="cart-item-unit-price">Rs. {item.price} each</span>

                      {/* Per Item Note Input */}
                      <input
                        type="text"
                        className="cart-item-notes-input"
                        placeholder="Add note (e.g. extra foam)..."
                        value={item.notes}
                        onChange={(e) => updateNotes(itemKey, e.target.value)}
                      />
                    </div>

                    {/* Quantity Controls */}
                    <div className="cart-item-qty-controls">
                      <button
                        className="qty-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCartIndex(index);
                          updateQuantity(itemKey, -1);
                        }}
                      >
                        -
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCartIndex(index);
                          updateQuantity(itemKey, 1);
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total & Delete */}
                    <div className="cart-item-total">
                      <span className="line-total-price">Rs. {item.price * item.quantity}</span>
                      <button
                        className="btn-remove-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(itemKey);
                        }}
                        title="Remove Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
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
            <div className="cart-actions flex-col gap-2">
              <button
                className="btn-secondary w-full text-xs py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold"
                onClick={handleSendToKitchen}
                disabled={cart.filter((ci) => !ci.isSent).length === 0 || submitting}
              >
                👨‍🍳 Send New Items to Kitchen →
              </button>
              <div className="flex gap-2 w-full">
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
      </div>

      {/* Size / Variant Picker Modal */}
      {variantPickerItem && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Select Size / Portion</h3>
              <button className="modal-close" onClick={() => setVariantPickerItem(null)}>
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
                <ItemVisual
                  imageUrl={variantPickerItem.imageUrl}
                  itemName={variantPickerItem.name}
                  categoryName={variantPickerItem.category?.name}
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <h4 className="font-bold text-lg text-white">{variantPickerItem.name}</h4>
                  <p className="text-xs text-zinc-400">Choose a portion size to add to order:</p>
                </div>
              </div>

              <div className="space-y-2">
                {variantPickerItem.variants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800/80 hover:bg-amber-500/20 border border-zinc-700 hover:border-amber-500 text-left transition-all"
                    onClick={() => {
                      addToCart(variantPickerItem, v);
                      setVariantPickerItem(null);
                    }}
                  >
                    <span className="font-semibold text-white">{v.name}</span>
                    <span className="font-bold text-amber-400">Rs. {v.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>

              <button
                className="btn-secondary w-full mt-4"
                onClick={() => setVariantPickerItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                        handleSelectTable(t);
                        setShowTableModal(false);
                      }}
                    >
                      <div className="table-box-header">
                        <span className="table-box-name">{t.name}</span>
                        <span
                          className={`status-badge ${
                            isAvailable ? 'status-badge-available' : 'status-badge-occupied'
                          }`}
                        >
                          {isAvailable ? 'AVAILABLE' : 'OPEN ORDER'}
                        </span>
                      </div>
                      <div className="table-box-body">
                        <p className="table-box-section">📍 {t.section || 'Main Hall'}</p>
                        <p className="table-box-capacity">👥 Capacity: {t.capacity}</p>
                        {!isAvailable && (
                          <p className="text-xs text-amber-400 mt-1 font-semibold">Tap to Add Items / Pay</p>
                        )}
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

              {/* Customer Selector */}
              <div className="form-group mb-3">
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Customer Profile (Optional for Credit Tab)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="settings-input w-full"
                >
                  <option value="">-- Guest Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} - Due: PKR {(c.receivableBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-method-toggle grid grid-cols-3 gap-1">
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
                    💳 Card / Digital
                  </button>
                  <button
                    type="button"
                    className={`pay-btn ${paymentMethod === 'credit' ? 'pay-btn-active' : ''}`}
                    onClick={() => {
                      setPaymentMethod('credit');
                      if (!selectedCustomerId && customers.length > 0) {
                        setSelectedCustomerId(customers[0]._id);
                      }
                    }}
                  >
                    📋 Credit Tab
                  </button>
                </div>
              </div>

              {/* Cash Calculator if Cash */}
              {paymentMethod === 'cash' && (
                <div className="form-group">
                  <label>Cash Tendered (PKR)</label>

                  {/* Quick Denomination Buttons */}
                  <div className="cash-denominations">
                    {[50, 100, 500, 1000, 5000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        className="denom-btn"
                        onClick={() => {
                          const current = Number(cashTendered) || 0;
                          pushCashTendered(String(current + denom));
                        }}
                      >
                        +{denom >= 1000 ? `${denom / 1000}K` : denom}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`denom-btn denom-btn-exact ${Number(cashTendered) === grandTotal ? 'denom-btn-active' : ''}`}
                      onClick={() => pushCashTendered(String(grandTotal))}
                      title="Set exact amount"
                    >
                      Exact
                    </button>
                    <button
                      type="button"
                      className="denom-btn denom-btn-undo"
                      onClick={handleUndoCash}
                      disabled={cashHistory.length === 0}
                      title="Undo last cash entry"
                    >
                      ↩ Undo
                    </button>
                    <button
                      type="button"
                      className="denom-btn denom-btn-clear"
                      onClick={handleClearCash}
                      disabled={!cashTendered}
                      title="Clear cash amount"
                    >
                      🗑️ Clear
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
