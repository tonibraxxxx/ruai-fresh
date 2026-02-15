import React, { useState, useEffect } from 'react';

const SEED_DATA = [
  { id: 1, name: 'Premium Coffee Beans', price: 1200, category: 'Beverages', stock: 50, emoji: '☕' },
  { id: 2, name: 'Organic Honey', price: 800, category: 'Pantry', stock: 30, emoji: '🍯' },
  { id: 3, name: 'Whole Wheat Bread', price: 150, category: 'Bakery', stock: 20, emoji: '🍞' },
  { id: 4, name: 'Fresh Avocados', price: 200, category: 'Produce', stock: 100, emoji: '🥑' },
];

const DELIVERY_FEE = 100;

export default function App() {
  // --- Data States (LocalStorage) ---
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('my_users')) || []);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('my_currentUser')) || null);
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('my_products')) || []);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('my_cart')) || []);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('my_orders')) || []);

  // --- UI States ---
  const [view, setView] = useState(currentUser ? 'shop' : 'login'); // login, register, shop, cart, history, admin
  const [toast, setToast] = useState(null);
  
  // Checkout Details State
  const [deliveryDetails, setDeliveryDetails] = useState({ location: '', apartment: '', door: '' });

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('my_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('my_currentUser', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('my_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('my_cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('my_orders', JSON.stringify(orders)), [orders]);

  // Protect Admin Route
  useEffect(() => {
    if (view === 'admin' && currentUser?.role !== 'admin') {
      setView('shop');
      showToast('Access denied: Admins only.');
    }
  }, [view, currentUser]);

  // --- Helper Functions ---
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Authentication ---
  const handleRegister = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    if (users.find(u => u.username === username)) {
      return showToast('Username already exists!');
    }

    // First user is automatically Admin. Others are Customers.
    const isFirstUser = users.length === 0;
    const newUser = { id: Date.now(), username, password, role: isFirstUser ? 'admin' : 'customer' };
    
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setView('shop');
    showToast(isFirstUser ? 'Registered as First Admin!' : 'Registered successfully!');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setView('shop');
      showToast(`Welcome back, ${user.username}!`);
    } else {
      showToast('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]); // Clear cart on logout for security
    setView('login');
  };

  // --- Store Functions ---
  const addToCart = (product) => {
    setCart([...cart, product]);
    showToast(`Added ${product.name} to cart!`);
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const newOrder = {
      id: Date.now(),
      userId: currentUser.id,
      customerName: currentUser.username,
      date: new Date().toLocaleString(),
      items: cart,
      subtotal: subtotal,
      total: subtotal + DELIVERY_FEE,
      status: 'Pending',
      delivery: deliveryDetails
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
    setDeliveryDetails({ location: '', apartment: '', door: '' }); // Reset form
    showToast('Order placed successfully!');
    setView('history');
  };

  // --- Admin Functions ---
  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updatedOrders);
    showToast(`Order updated to ${newStatus}`);
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
    showToast('New product added!');
  };

  const handleAddAdmin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    if (users.find(u => u.username === username)) {
      return showToast('User already exists!');
    }

    const newAdmin = { id: Date.now(), username, password, role: 'admin' };
    setUsers([...users, newAdmin]);
    e.target.reset();
    showToast(`${username} is now an Admin!`);
  };

  const seedStore = () => {
    setProducts(SEED_DATA);
    showToast('Store seeded with original products!');
  };

  // Derived Stats
  const totalRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, order) => sum + order.total, 0);

  // Filter orders: Admins see all, customers see only their own
  const visibleOrders = currentUser?.role === 'admin' 
    ? orders 
    : orders.filter(o => o.userId === currentUser?.id);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800 font-sans pb-20">
      
      {/* Navigation Bar (Only show if logged in) */}
      {currentUser && (
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 cursor-pointer" onClick={() => setView('shop')}>
              FreshMart KES
            </h1>
            <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0 items-center">
              <button onClick={() => setView('shop')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'shop' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>Shop</button>
              <button onClick={() => setView('cart')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'cart' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>
                Cart ({cart.length})
              </button>
              <button onClick={() => setView('history')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>Orders</button>
              
              {/* Only show Admin button if user is Admin */}
              {currentUser.role === 'admin' && (
                <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-full font-medium transition ${view === 'admin' ? 'bg-gray-800 text-white shadow-md' : 'bg-white/50 hover:bg-white'}`}>Admin</button>
              )}
              
              <button onClick={handleLogout} className="px-4 py-2 rounded-full font-medium bg-red-100 text-red-600 hover:bg-red-200 transition ml-2">
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-6xl mx-auto p-4 mt-6">
        
        {/* --- AUTHENTICATION VIEWS --- */}
        {!currentUser && (
          <div className="max-w-md mx-auto mt-20 animate-fade-in bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40">
            <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">FreshMart</h1>
            <p className="text-center text-gray-500 mb-8">
              {users.length === 0 ? "Be the first to join! (You'll be Admin)" : "Login to shop"}
            </p>

            {view === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input name="username" type="text" placeholder="Username" required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                <input name="password" type="password" placeholder="Password" required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition shadow-lg">Login</button>
                <p className="text-center text-sm text-gray-600">
                  New here? <span className="text-indigo-600 font-bold cursor-pointer" onClick={() => setView('register')}>Register</span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <input name="username" type="text" placeholder="Choose a Username" required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                <input name="password" type="password" placeholder="Choose a Password" required className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition shadow-lg">Create Account</button>
                <p className="text-center text-sm text-gray-600">
                  Already have an account? <span className="text-indigo-600 font-bold cursor-pointer" onClick={() => setView('login')}>Login</span>
                </p>
              </form>
            )}
          </div>
        )}

        {/* --- SHOP VIEW --- */}
        {currentUser && view === 'shop' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Welcome, {currentUser.username}!</h2>
            {products.length === 0 ? (
              <p className="text-gray-500">No products available yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-white/40 backdrop-blur-lg border border-white/40 shadow-xl rounded-2xl p-6 flex flex-col items-center hover:-translate-y-1 transition duration-300">
                    <span className="text-6xl mb-4">{p.emoji}</span>
                    <h3 className="text-xl font-semibold text-center">{p.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{p.category}</p>
                    <p className="text-lg font-bold text-indigo-600 mb-4">KES {p.price}</p>
                    <button onClick={() => addToCart(p)} className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-medium transition shadow-md">
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CART VIEW --- */}
        {currentUser && view === 'cart' && (
          <div className="max-w-4xl mx-auto animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cart Items */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/40">
              <h2 className="text-2xl font-bold mb-6">Review Cart</h2>
              {cart.length === 0 ? <p className="text-gray-500">Cart is empty.</p> : (
                <ul className="divide-y divide-gray-200/50 mb-6">
                  {cart.map((item, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <span>{item.emoji} {item.name}</span>
                      <span className="font-bold text-gray-700">KES {item.price}</span>
                    </li>
                  ))}
                  <li className="pt-4 flex justify-between font-bold text-lg">
                    <span>Subtotal</span>
                    <span>KES {cart.reduce((sum, item) => sum + item.price, 0)}</span>
                  </li>
                  <li className="pt-2 flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>KES {DELIVERY_FEE}</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Delivery Details Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/40 h-fit">
                <h2 className="text-2xl font-bold mb-6">Delivery Details</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Location / Area *</label>
                    <input type="text" required placeholder="e.g. Westlands, Kilimani" 
                      value={deliveryDetails.location} onChange={e => setDeliveryDetails({...deliveryDetails, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Building/Apartment *</label>
                      <input type="text" required placeholder="e.g. Sunset Apts" 
                        value={deliveryDetails.apartment} onChange={e => setDeliveryDetails({...deliveryDetails, apartment: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Door Number *</label>
                      <input type="text" required placeholder="e.g. B4" 
                        value={deliveryDetails.door} onChange={e => setDeliveryDetails({...deliveryDetails, door: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg transition shadow-lg">
                  Pay KES {cart.reduce((sum, item) => sum + item.price, 0) + DELIVERY_FEE} & Order
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- ORDER HISTORY VIEW --- */}
        {currentUser && view === 'history' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">{currentUser.role === 'admin' ? 'All System Orders' : 'Your Orders'}</h2>
            {visibleOrders.length === 0 ? <p className="text-gray-500">No orders found.</p> : (
              <div className="space-y-4">
                {visibleOrders.map(order => (
                  <div key={order.id} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-md border border-white/40">
                    <div className="flex justify-between items-start border-b border-gray-200/50 pb-3 mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Order #{order.id}</p>
                        <p className="text-xs text-gray-500">{order.date}</p>
                        {currentUser.role === 'admin' && (
                          <p className="text-sm text-indigo-600 font-medium mt-1">Customer: {order.customerName}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                        ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                          order.status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Items</p>
                        <p className="text-sm text-gray-600">{order.items.length} items</p>
                        <p className="font-bold text-gray-800">Total: KES {order.total}</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Delivery Details</p>
                        <p className="text-sm text-gray-700">{order.delivery?.location}</p>
                        <p className="text-sm text-gray-700">{order.delivery?.apartment}, Door {order.delivery?.door}</p>
                      </div>
                    </div>

                    {/* Admin Status Changer in History */}
                    {currentUser.role === 'admin' && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Update Status:</span>
                        <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-white border border-gray-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 shadow-sm">
                          <option value="Pending">Pending</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ADMIN DASHBOARD --- */}
        {currentUser && view === 'admin' && currentUser.role === 'admin' && (
          <div className="animate-fade-in space-y-8">
            
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-3xl font-bold">Admin Dashboard</h2>
              <button onClick={seedStore} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition">
                🌱 Seed Store Data
              </button>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-medium opacity-90">Total Delivered Revenue</h3>
              <p className="text-4xl font-bold mt-2">KES {totalRevenue.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add Product Form */}
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/40">
                <h3 className="text-xl font-bold mb-4">Add New Product</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input name="name" type="text" required placeholder="Product Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                    <input name="emoji" type="text" required placeholder="Emoji (e.g. 🥭)" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="price" type="number" required placeholder="Price (KES)" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                    <input name="stock" type="number" required placeholder="Stock Count" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                  </div>
                  <input name="category" type="text" required placeholder="Category" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                  <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-medium shadow-md">Add Product</button>
                </form>
              </div>

              {/* Add New Admin Form */}
              <div className="bg-indigo-50/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-indigo-100">
                <h3 className="text-xl font-bold mb-4 text-indigo-900">Add Co-Admin</h3>
                <p className="text-sm text-indigo-700 mb-4">Create a new account with full admin privileges.</p>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <input name="username" type="text" required placeholder="Admin Username" className="w-full px-3 py-2 border border-white rounded-lg outline-none shadow-sm" />
                  <input name="password" type="password" required placeholder="Admin Password" className="w-full px-3 py-2 border border-white rounded-lg outline-none shadow-sm" />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium shadow-md">Create Admin Account</button>
                </form>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span>✨</span><span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
