import React, { useState, useEffect } from 'react';

const SEED_DATA = [
  { id: 1, name: 'Premium Coffee Beans', price: 1200, category: 'Beverages', stock: 50, emoji: '☕' },
  { id: 2, name: 'Organic Honey', price: 800, category: 'Pantry', stock: 30, emoji: '🍯' },
  { id: 3, name: 'Whole Wheat Bread', price: 150, category: 'Bakery', stock: 20, emoji: '🍞' },
  { id: 4, name: 'Fresh Avocados', price: 200, category: 'Produce', stock: 100, emoji: '🥑' },
];

const DELIVERY_FEE = 100;

export default function App() {
  // --- State Management (with LocalStorage) ---
  const [view, setView] = useState('shop'); // shop, cart, history, admin
  const [toast, setToast] = useState(null);

  const [products, setProducts] = useState(() => {
    return JSON.parse(localStorage.getItem('my_products')) || [];
  });
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem('my_cart')) || [];
  });
  const [orders, setOrders] = useState(() => {
    return JSON.parse(localStorage.getItem('my_orders')) || [];
  });

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('my_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('my_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('my_orders', JSON.stringify(orders));
  }, [orders]);

  // --- Helper Functions ---
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    showToast(`Added ${product.name} to cart!`);
  };

  const seedStore = () => {
    setProducts(SEED_DATA);
    showToast('Store seeded with original products!');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const newOrder = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      items: cart,
      subtotal: subtotal,
      total: subtotal + DELIVERY_FEE,
      status: 'Pending' // Pending -> Dispatched -> Delivered
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
    showToast('Order placed successfully!');
    setView('history');
  };

  // --- Admin Functions ---
  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updatedOrders);
    showToast(`Order status updated to ${newStatus}`);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = {
      id: Date.now(),
      name: formData.get('name'),
      price: Number(formData.get('price')),
      category: formData.get('category'),
      stock: Number(formData.get('stock')),
      emoji: formData.get('emoji')
    };
    setProducts([...products, newProduct]);
    e.target.reset();
    showToast('New product added to inventory!');
  };

  // --- Derived Admin Stats ---
  const totalRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800 font-sans pb-20">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 cursor-pointer" onClick={() => setView('shop')}>
            FreshMart KES
          </h1>
          <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button onClick={() => setView('shop')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'shop' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>Shop</button>
            <button onClick={() => setView('cart')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'cart' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>
              Cart ({cart.length})
            </button>
            <button onClick={() => setView('history')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>Orders</button>
            <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'admin' ? 'bg-gray-800 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>Admin</button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 mt-6">
        
        {/* --- SHOP VIEW --- */}
        {view === 'shop' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Products</h2>
            {products.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No products available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-white/40 backdrop-blur-lg border border-white/40 shadow-xl rounded-2xl p-6 flex flex-col items-center hover:-translate-y-1 transition duration-300">
                    <span className="text-6xl mb-4">{p.emoji}</span>
                    <h3 className="text-xl font-semibold text-center">{p.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{p.category}</p>
                    <p className="text-lg font-bold text-indigo-600 mb-4">KES {p.price}</p>
                    <button 
                      onClick={() => addToCart(p)}
                      className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-medium transition shadow-md"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CART VIEW --- */}
        {view === 'cart' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Review Cart</h2>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/40">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-6">Your cart is empty.</p>
              ) : (
                <>
                  <ul className="divide-y divide-gray-200/50 mb-6">
                    {cart.map((item, index) => (
                      <li key={index} className="py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-700">KES {item.price}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-300 pt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>KES {cart.reduce((sum, item) => sum + item.price, 0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee:</span>
                      <span>KES {DELIVERY_FEE}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 pt-2">
                      <span>Total:</span>
                      <span>KES {cart.reduce((sum, item) => sum + item.price, 0) + DELIVERY_FEE}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg transition shadow-lg"
                  >
                    Confirm & Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- ORDER HISTORY VIEW --- */}
        {view === 'history' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Your Orders</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center bg-white/40 p-8 rounded-2xl">No orders placed yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-md border border-white/40">
                    <div className="flex justify-between items-center border-b border-gray-200/50 pb-3 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order.id}</p>
                        <p className="text-xs text-gray-400">{order.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                        ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                          order.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 
                          'bg-green-100 text-green-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.items.length} items (incl. KES {DELIVERY_FEE} delivery)
                    </p>
                    <p className="font-bold text-lg text-gray-800">Total: KES {order.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ADMIN DASHBOARD --- */}
        {view === 'admin' && (
          <div className="animate-fade-in">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h2 className="text-3xl font-bold">Admin Dashboard</h2>
              <button onClick={seedStore} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition">
                🌱 Seed Store Data
              </button>
            </div>

            {/* Sales Tracker */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl mb-8">
              <h3 className="text-lg font-medium opacity-90">Total Delivered Revenue</h3>
              <p className="text-4xl font-bold mt-2">KES {totalRevenue.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Order Management */}
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/40">
                <h3 className="text-xl font-bold mb-4">Manage Orders</h3>
                {orders.length === 0 ? <p className="text-gray-500">No orders yet.</p> : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white/80 rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">KES {order.total}</p>
                        </div>
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Inventory Form */}
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/40">
                <h3 className="text-xl font-bold mb-4">Add New Product</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Mangoes" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                      <input name="emoji" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="🥭" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
                      <input name="price" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Count</label>
                      <input name="stock" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input name="category" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Produce" />
                  </div>
                  <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-medium transition shadow-md">
                    Add Product to Inventory
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span>✨</span>
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
