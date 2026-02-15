import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Trash2, Edit, 
  CheckCircle, Store, ArrowLeft, LogOut, User, 
  Package, Truck, CheckSquare, XCircle, 
  Smartphone, Laptop, History, Save, Download, Upload
} from 'lucide-react';

// --- CONFIGURATION ---
const ADMIN_PIN = "2025nairobi"; // The secret key
const DELIVERY_FEE = 150;

// --- SEED DATA (Includes Laptops now) ---
const SEED_PRODUCTS = [
  { id: "1", name: "Premium Coffee", price: 1200, category: "Beverages", stock: 50, emoji: "☕" },
  { id: "2", name: "Organic Honey", price: 800, category: "Pantry", stock: 30, emoji: "🍯" },
  { id: "3", name: "MacBook Air M2", price: 145000, category: "Laptops", stock: 5, emoji: "💻" },
  { id: "4", name: "HP Pavilion 15", price: 65000, category: "Laptops", stock: 8, emoji: "🖥️" },
  { id: "5", name: "Dell XPS 13", price: 180000, category: "Laptops", stock: 3, emoji: "🖱️" },
  { id: "6", name: "Fresh Avocados", price: 200, category: "Produce", stock: 100, emoji: "🥑" },
];

const Button = ({ children, onClick, type="button", className="", variant="primary" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    dark: "bg-gray-800 text-white hover:bg-gray-900"
  };
  return (
    <button onClick={onClick} type={type} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Badge = ({ children, color="indigo" }) => {
  const styles = {
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700"
  };
  return (
    <span className={`${styles[color] || styles.indigo} text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider`}>
      {children}
    </span>
  );
};

// --- STORAGE HELPERS ---
const LS_KEYS = {
  PRODUCTS: "ruai_products_v2",
  ORDERS: "ruai_orders_v2",
  USERS: "ruai_users_v2",
  USER: "ruai_current_user_v2"
};

const load = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) { return fallback; }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export default function RuaiApp() {
  // --- STATE ---
  const [products, setProducts] = useState(load(LS_KEYS.PRODUCTS, []));
  const [orders, setOrders] = useState(load(LS_KEYS.ORDERS, []));
  const [users, setUsers] = useState(load(LS_KEYS.USERS, []));
  const [user, setUser] = useState(load(LS_KEYS.USER, null));
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("login"); // login, register, shop, cart, orders, admin
  const [notify, setNotify] = useState(null);
  const [syncData, setSyncData] = useState("");
  
  // Admin Form State
  const [productForm, setProductForm] = useState({ name: '', category: '', price: '', stock: '', emoji: '' });
  
  // Effects
  useEffect(() => save(LS_KEYS.PRODUCTS, products), [products]);
  useEffect(() => save(LS_KEYS.ORDERS, orders), [orders]);
  useEffect(() => save(LS_KEYS.USERS, users), [users]);
  useEffect(() => save(LS_KEYS.USER, user), [user]);
  useEffect(() => { if(user) setPage("shop"); }, []);

  const toast = (msg) => { setNotify(msg); setTimeout(() => setNotify(null), 3000); };

  // --- AUTH ---
  const handleAuth = (e, isRegister) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.pass.value;
    
    if (isRegister) {
      if (users.find(u => u.email === email)) return toast("Account exists!");
      
      const pin = e.target.pin?.value;
      let role = "customer";
      
      // THE SECRET PIN LOGIC
      if (pin === ADMIN_PIN) {
        role = "admin";
        toast("Verified! Creating Admin Account...");
      }

      const newUser = { id: Date.now().toString(), email, password, role };
      setUsers([...users, newUser]);
      setUser(newUser);
      setPage("shop");
    } else {
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) return toast("Invalid credentials");
      setUser(found);
      setPage("shop");
      toast(`Welcome back ${found.role === 'admin' ? 'Admin' : ''}`);
    }
  };

  // --- SHOPPING ---
  const addToCart = (p) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === p.id);
      if (exist) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
    toast(`Added ${p.name}`);
  };

  const checkout = (e) => {
    e.preventDefault();
    const total = cart.reduce((a, c) => a + c.price * c.quantity, 0) + DELIVERY_FEE;
    const order = {
      id: Date.now().toString(),
      userEmail: user.email,
      items: cart,
      total,
      status: "Pending",
      createdAt: new Date().toLocaleString(),
      phone: e.target.phone.value, // Captured Phone Number
      details: {
        name: e.target.name.value,
        address: e.target.address.value,
      }
    };
    setOrders([order, ...orders]); // Add to top
    setCart([]);
    setPage("orders");
    toast("Order Placed Successfully!");
  };

  // --- ADMIN ACTIONS ---
  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast(`Order marked as ${status}`);
  };

  const addProduct = (e) => {
    e.preventDefault();
    const newP = { id: Date.now().toString(), ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
    setProducts([...products, newP]);
    setProductForm({ name: '', category: '', price: '', stock: '', emoji: '' });
    toast("Product Added");
  };

  // --- DATA TRANSFER (SYNC) ---
  const handleExport = () => {
    const data = JSON.stringify({ products, orders, users });
    setSyncData(data);
    navigator.clipboard.writeText(data);
    toast("Data copied to clipboard! Send this to your other device.");
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(syncData);
      if(data.products) setProducts(data.products);
      if(data.orders) setOrders(data.orders);
      if(data.users) setUsers(data.users);
      toast("Data restored successfully!");
    } catch (err) {
      toast("Invalid Data String");
    }
  };

  // --- VIEW HELPERS ---
  const activeOrders = orders.filter(o => o.status !== "Delivered");
  const pastOrders = orders.filter(o => o.status === "Delivered");
  
  const getMyOrders = (list) => user?.role === 'admin' ? list : list.filter(o => o.userEmail === user.email);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* HEADER */}
      {user && (
        <div className="bg-white shadow sticky top-0 z-10 px-4 py-3">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <h1 className="font-black text-xl tracking-tight text-indigo-700 flex items-center gap-2 cursor-pointer" onClick={() => setPage('shop')}>
              <Store size={24}/> RUAI FRESH
            </h1>
            <div className="flex gap-2">
              <button onClick={() => setPage("cart")} className="relative p-2">
                <ShoppingCart className="text-gray-600" />
                {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
              </button>
              <button onClick={() => setPage("orders")}><History className="text-gray-600"/></button>
              {user.role === "admin" && <button onClick={() => setPage("admin")}><User className="text-indigo-600"/></button>}
              <button onClick={() => { setUser(null); setPage("login"); }}><LogOut className="text-red-400"/></button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notify && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-2 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce"><CheckCircle size={16}/> {notify}</div>}

      <div className="max-w-2xl mx-auto p-4">
        
        {/* --- SHOP PAGE --- */}
        {page === "shop" && (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-2">{p.emoji}</div>
                  <Badge color="indigo">{p.category}</Badge>
                  <h3 className="font-bold mt-2 leading-tight">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.stock} left</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold">KES {p.price.toLocaleString()}</span>
                  <button onClick={() => addToCart(p)} className="bg-indigo-50 text-indigo-600 p-2 rounded-full hover:bg-indigo-100"><Plus size={20}/></button>
                </div>
              </div>
            ))}
            {products.length === 0 && <Button onClick={() => setProducts(SEED_PRODUCTS)} variant="outline" className="col-span-2">Load Seed Data</Button>}
          </div>
        )}

        {/* --- CART PAGE --- */}
        {page === "cart" && (
          <div>
            <Button onClick={() => setPage("shop")} variant="secondary" className="mb-4"><ArrowLeft size={16}/> Keep Shopping</Button>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              {cart.map((i, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                  <span>{i.emoji} {i.name} (x{i.quantity})</span>
                  <span>KES {(i.price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-4 text-lg">
                <span>Total + Delivery</span>
                <span>KES {(cart.reduce((a,c) => a + c.price * c.quantity, 0) + DELIVERY_FEE).toLocaleString()}</span>
              </div>
            </div>
            
            <form onSubmit={checkout} className="space-y-3 bg-white p-5 rounded-xl shadow-sm">
              <h3 className="font-bold border-b pb-2">Delivery Details</h3>
              <input required name="name" placeholder="Full Name" className="border p-3 rounded-lg w-full"/>
              <input required name="phone" type="tel" placeholder="Active Phone Number" className="border p-3 rounded-lg w-full bg-yellow-50"/>
              <input required name="address" placeholder="Delivery Address (House/Road)" className="border p-3 rounded-lg w-full"/>
              <Button type="submit" className="w-full">Confirm Order</Button>
            </form>
          </div>
        )}

        {/* --- ORDERS PAGE --- */}
        {page === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2"><Truck size={20}/> Active Orders</h2>
              {getMyOrders(activeOrders).length === 0 ? <p className="text-gray-400 italic">No active orders.</p> : 
                getMyOrders(activeOrders).map(o => (
                  <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm mb-3 border-l-4 border-yellow-400">
                    <div className="flex justify-between">
                      <span className="font-bold">#{o.id.slice(-4)}</span>
                      <Badge color="orange">{o.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Total: KES {o.total.toLocaleString()}</p>
                      <p>Phone: {o.phone}</p>
                    </div>
                  </div>
                ))
              }
            </div>

            <div>
              <h2 className="font-bold text-xl mb-3 flex items-center gap-2"><CheckSquare size={20}/> Order History</h2>
              {getMyOrders(pastOrders).length === 0 ? <p className="text-gray-400 italic">No past orders.</p> : 
                getMyOrders(pastOrders).map(o => (
                  <div key={o.id} className="bg-gray-100 p-4 rounded-xl mb-3 opacity-75">
                    <div className="flex justify-between">
                      <span className="font-bold">#{o.id.slice(-4)}</span>
                      <Badge color="green">{o.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Delivered on {o.createdAt}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* --- ADMIN PANEL --- */}
        {page === "admin" && user?.role === "admin" && (
          <div className="space-y-8">
            {/* 1. Add Product */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
              <h3 className="font-bold mb-4 text-indigo-800">Add New Product</h3>
              <form onSubmit={addProduct} className="grid grid-cols-2 gap-3">
                <input value={productForm.name} onChange={e=>setProductForm({...productForm, name:e.target.value})} placeholder="Name" className="border p-2 rounded w-full col-span-2" required/>
                <input value={productForm.category} onChange={e=>setProductForm({...productForm, category:e.target.value})} placeholder="Category" className="border p-2 rounded w-full" required/>
                <input value={productForm.emoji} onChange={e=>setProductForm({...productForm, emoji:e.target.value})} placeholder="Emoji (💻)" className="border p-2 rounded w-full" required/>
                <input value={productForm.price} onChange={e=>setProductForm({...productForm, price:e.target.value})} type="number" placeholder="Price" className="border p-2 rounded w-full" required/>
                <input value={productForm.stock} onChange={e=>setProductForm({...productForm, stock:e.target.value})} type="number" placeholder="Stock" className="border p-2 rounded w-full" required/>
                <Button type="submit" className="col-span-2" variant="dark">Save Product</Button>
              </form>
            </div>

            {/* 2. Manage Orders */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="font-bold mb-4 text-indigo-800">Manage Active Orders</h3>
              {activeOrders.length === 0 ? <p>No pending orders.</p> : activeOrders.map(o => (
                <div key={o.id} className="border-b py-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold">{o.details.name}</span>
                    <span className="font-mono text-sm">{o.phone}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {o.details.address} • KES {o.total.toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateStatus(o.id, "Dispatched")} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded">Mark Dispatched</button>
                    <button onClick={()=>updateStatus(o.id, "Delivered")} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded">Mark Delivered</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Transfer Data (Sync) */}
            <div className="bg-indigo-900 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Smartphone size={20}/> Device Transfer</h3>
              <p className="text-xs text-indigo-200 mb-4">
                To move data to another device: Copy from this device, send the text to yourself, and paste it on the new device.
              </p>
              
              <div className="space-y-3">
                <button onClick={handleExport} className="w-full bg-white text-indigo-900 py-2 rounded font-bold flex items-center justify-center gap-2">
                  <Download size={16}/> Copy Data (Export)
                </button>
                
                <div className="flex gap-2">
                  <input 
                    value={syncData} 
                    onChange={e => setSyncData(e.target.value)}
                    placeholder="Paste data code here..." 
                    className="flex-1 text-black px-2 rounded text-sm"
                  />
                  <button onClick={handleImport} className="bg-green-500 text-white px-3 py-2 rounded font-bold">
                    <Upload size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- LOGIN / REGISTER --- */}
        {(page === "login" || page === "register") && (
          <div className="mt-10 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-indigo-700">RUAI FRESH</h1>
              <p className="text-gray-500">Premium Delivery Service</p>
            </div>
            
            <form onSubmit={(e) => handleAuth(e, page === "register")} className="space-y-4">
              <input required name="email" type="email" placeholder="Email Address" className="w-full border p-3 rounded-lg"/>
              <input required name="pass" type="password" placeholder="Password" className="w-full border p-3 rounded-lg"/>
              
              {page === "register" && (
                <div className="pt-4 border-t">
                  <label className="text-xs font-bold text-gray-500 uppercase">Secret Admin PIN (Optional)</label>
                  <input name="pin" type="password" placeholder="Enter PIN to become Admin" className="w-full border p-3 rounded-lg mt-1 bg-gray-50"/>
                  <p className="text-[10px] text-gray-400 mt-1">Leave empty to register as Customer.</p>
                </div>
              )}

              <Button type="submit" className="w-full">{page === "login" ? "Sign In" : "Create Account"}</Button>
              
              <div className="text-center text-sm">
                <button type="button" onClick={() => setPage(page === "login" ? "register" : "login")} className="text-indigo-600 font-bold hover:underline">
                  {page === "login" ? "New here? Create Account" : "Have an account? Login"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
