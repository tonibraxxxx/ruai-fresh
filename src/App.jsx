import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Trash2, Edit, 
  CheckCircle, Store, ArrowLeft, LogOut, User, 
  Package, Truck, CheckSquare, History, Save, Download, Upload, Search
} from 'lucide-react';

const ADMIN_PIN = "2025nairobi";
const DELIVERY_FEE = 150;

const SEED_PRODUCTS = [
  { id: "1", name: "Coconut Cake", price: 10, category: "Bakery", stock: 100, emoji: "🥥", type: "Home Made" },
  { id: "2", name: "Maziwa Kubwa", price: 60, category: "Milk", stock: 50, emoji: "🥛", type: "Brookside" },
  { id: "3", name: "Maziwa Kidogo", price: 35, category: "Milk", stock: 80, emoji: "🧃", type: "KCC" },
  { id: "4", name: "Maize Flour 2kg", price: 180, category: "Grains", stock: 40, emoji: "🌽", type: "Jogoo" },
];

const LS_KEYS = {
  PRODUCTS: "ruai_fresh_products_v3",
  ORDERS: "ruai_fresh_orders_v3",
  USERS: "ruai_fresh_users_v3",
  USER: "ruai_fresh_current_user_v3"
};

const load = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) { return fallback; }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export default function RuaiFresh() {
  const [products, setProducts] = useState(load(LS_KEYS.PRODUCTS, SEED_PRODUCTS));
  const [orders, setOrders] = useState(load(LS_KEYS.ORDERS, []));
  const [users, setUsers] = useState(load(LS_KEYS.USERS, []));
  const [user, setUser] = useState(load(LS_KEYS.USER, null));
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("login");
  const [notify, setNotify] = useState(null);
  const [syncData, setSyncData] = useState("");
  
  // Admin Form State
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', category: '', price: '', stock: '', emoji: '', type: '' });

  useEffect(() => save(LS_KEYS.PRODUCTS, products), [products]);
  useEffect(() => save(LS_KEYS.ORDERS, orders), [orders]);
  useEffect(() => save(LS_KEYS.USERS, users), [users]);
  useEffect(() => save(LS_KEYS.USER, user), [user]);
  useEffect(() => { if(user) setPage("shop"); }, []);

  const toast = (msg) => { setNotify(msg); setTimeout(() => setNotify(null), 3000); };

  const handleAuth = (e, isRegister) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.pass.value;
    if (isRegister) {
      if (users.find(u => u.email === email)) return toast("Account exists!");
      const pin = e.target.pin?.value;
      const role = pin === ADMIN_PIN ? "admin" : "customer";
      const newUser = { id: Date.now().toString(), email, password, role };
      setUsers([...users, newUser]);
      setUser(newUser);
      setPage("shop");
      toast(role === "admin" ? "Admin Access Granted!" : "Account Created!");
    } else {
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) return toast("Invalid login");
      setUser(found);
      setPage("shop");
    }
  };

  const saveProduct = (e) => {
    e.preventDefault();
    const cleanProduct = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...cleanProduct, id: editingId } : p));
      setEditingId(null);
      toast("Product Updated!");
    } else {
      setProducts([...products, { ...cleanProduct, id: Date.now().toString() }]);
      toast("Product Added!");
    }
    setProductForm({ name: '', category: '', price: '', stock: '', emoji: '', type: '' });
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setProductForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, emoji: p.emoji, type: p.type || '' });
    window.scrollTo(0, 0);
  };

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
      items: [...cart],
      total,
      status: "Pending",
      createdAt: new Date().toLocaleString(),
      phone: e.target.phone.value,
      details: { name: e.target.name.value, address: e.target.address.value }
    };
    setOrders([order, ...orders]);
    setCart([]);
    setPage("orders");
    toast("Order Placed!");
  };

  const activeOrders = orders.filter(o => o.status !== "Delivered");
  const pastOrders = orders.filter(o => o.status === "Delivered");
  const getMyOrders = (list) => user?.role === 'admin' ? list : list.filter(o => o.userEmail === user.email);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      {user && (
        <div className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="cursor-pointer" onClick={() => setPage('shop')}>
              <h1 className="font-black text-2xl tracking-tighter text-emerald-700">RUAI FRESH</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Nanyuki's Finest Mart</p>
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={() => setPage("cart")} className="relative p-2 bg-slate-100 rounded-full">
                <ShoppingCart size={20} />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
              </button>
              {user.role === "admin" && <button onClick={() => setPage("admin")} className="p-2 bg-emerald-100 text-emerald-700 rounded-full"><User size={20}/></button>}
              <button onClick={() => { setUser(null); setPage("login"); }} className="p-2 text-slate-400"><LogOut size={20}/></button>
            </div>
          </div>
          <div className="bg-emerald-700 text-white text-[10px] text-center py-1 font-medium tracking-widest uppercase">
            Consistency Pays Off
          </div>
        </div>
      )}

      {notify && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-pulse border border-slate-700 font-bold">{notify}</div>}

      <div className="max-w-2xl mx-auto p-4">
        {page === "shop" && (
          <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition">
                <div className="text-4xl mb-3">{p.emoji}</div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded uppercase text-slate-500">{p.type || p.category}</span>
                  <h3 className="font-bold text-lg mt-1">{p.name}</h3>
                  <p className="text-xl font-black text-emerald-600">KES {p.price}</p>
                </div>
                <button onClick={() => addToCart(p)} className="mt-4 w-full bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition"><Plus size={18}/> Add</button>
              </div>
            ))}
          </div>
        )}

        {page === "cart" && (
          <div className="animate-in fade-in duration-300">
            <button onClick={() => setPage("shop")} className="flex items-center gap-2 font-bold text-slate-500 mb-4"><ArrowLeft size={18}/> Back to Shop</button>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="font-black text-xl mb-4 border-b pb-2">Your Basket</h2>
              {cart.map((i, idx) => (
                <div key={idx} className="flex justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex gap-3">
                    <span className="text-2xl">{i.emoji}</span>
                    <div><p className="font-bold">{i.name}</p><p className="text-xs text-slate-400">Qty: {i.quantity}</p></div>
                  </div>
                  <span className="font-bold">KES {i.price * i.quantity}</span>
                </div>
              ))}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-slate-500"><span>Delivery Fee</span><span>KES {DELIVERY_FEE}</span></div>
                <div className="flex justify-between text-2xl font-black text-emerald-700 pt-2 border-t"><span>Total</span><span>KES {cart.reduce((a,c)=>a+c.price*c.quantity,0)+DELIVERY_FEE}</span></div>
              </div>
            </div>
            
            <form onSubmit={checkout} className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-black text-lg">Delivery Info</h3>
              <input required name="name" placeholder="Full Name" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-emerald-500 outline-none transition"/>
              <input required name="phone" type="tel" placeholder="Active Phone Number (M-Pesa)" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-emerald-500 outline-none transition bg-emerald-50/30"/>
              <input required name="address" placeholder="Estate / House No / Road" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-emerald-500 outline-none transition"/>
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200">Order Now</button>
            </form>
          </div>
        )}

        {page === "orders" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <h2 className="font-black text-2xl">Orders</h2>
               <button onClick={() => setPage("shop")} className="text-emerald-600 font-bold">Back to Shop</button>
            </div>
            <div>
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Pending Delivery</h3>
              {getMyOrders(activeOrders).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-2xl shadow-sm mb-4 border-l-4 border-emerald-500">
                  <div className="flex justify-between font-black mb-2"><span>Order #{o.id.slice(-4)}</span><span className="text-emerald-600 uppercase text-xs bg-emerald-50 px-2 py-1 rounded">{o.status}</span></div>
                  <div className="text-sm space-y-1 text-slate-600">
                    <p>Items: {o.items.length}</p>
                    <p>Total: <span className="font-bold text-slate-900 font-mono text-lg">KES {o.total}</span></p>
                  </div>
                </div>
              ))}
            </div>
            {getMyOrders(pastOrders).length > 0 && (
              <div>
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Past Orders</h3>
                {getMyOrders(pastOrders).map(o => (
                  <div key={o.id} className="bg-slate-100 p-4 rounded-xl mb-3 opacity-60">
                    <div className="flex justify-between font-bold text-sm"><span>Order #{o.id.slice(-4)}</span><span>{o.status}</span></div>
                    <p className="text-xs mt-1 italic">{o.createdAt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {page === "admin" && user?.role === "admin" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-emerald-100">
              <h3 className="font-black text-xl mb-4 text-emerald-800">{editingId ? "Edit Product" : "Add New Product"}</h3>
              <form onSubmit={saveProduct} className="grid grid-cols-2 gap-3">
                <input value={productForm.name} onChange={e=>setProductForm({...productForm, name:e.target.value})} placeholder="Product Name (e.g. Maziwa)" className="col-span-2 border p-3 rounded-xl outline-none focus:border-emerald-500" required/>
                <input value={productForm.type} onChange={e=>setProductForm({...productForm, type:e.target.value})} placeholder="Type/Brand (e.g. Brookside)" className="border p-3 rounded-xl outline-none focus:border-emerald-500" required/>
                <input value={productForm.emoji} onChange={e=>setProductForm({...productForm, emoji:e.target.value})} placeholder="Emoji (🥥)" className="border p-3 rounded-xl outline-none focus:border-emerald-500" required/>
                <input value={productForm.price} onChange={e=>setProductForm({...productForm, price:e.target.value})} type="number" placeholder="Price (KES)" className="border p-3 rounded-xl outline-none focus:border-emerald-500" required/>
                <input value={productForm.stock} onChange={e=>setProductForm({...productForm, stock:e.target.value})} type="number" placeholder="Stock Level" className="border p-3 rounded-xl outline-none focus:border-emerald-500" required/>
                <button type="submit" className="col-span-2 bg-emerald-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={18}/> {editingId ? "Update Item" : "Add to Shelf"}</button>
                {editingId && <button onClick={()=>{setEditingId(null); setProductForm({name:'',category:'',price:'',stock:'',emoji:'',type:''})}} className="col-span-2 text-slate-400 font-bold">Cancel Edit</button>}
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-black text-xl mb-4">Live Inventory</h3>
              <div className="space-y-4">
                {products.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <span className="text-2xl">{p.emoji}</span>
                      <div><p className="font-bold text-sm leading-none">{p.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{p.type || 'General'}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>startEdit(p)} className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Edit size={16}/></button>
                      <button onClick={()=>{if(confirm('Delete?'))setProducts(products.filter(x=>x.id!==p.id))}} className="p-2 bg-red-100 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900 text-white p-6 rounded-2xl">
              <h3 className="font-black text-xl mb-4">Manage Orders</h3>
              {activeOrders.length === 0 ? <p className="text-slate-500 italic text-sm text-center">No pending orders to fulfill.</p> : activeOrders.map(o => (
                <div key={o.id} className="border-b border-slate-800 py-4 last:border-0">
                  <div className="flex justify-between mb-2"><span className="font-bold text-emerald-400">{o.details.name}</span><span className="font-mono text-sm">{o.phone}</span></div>
                  <div className="text-xs text-slate-400 mb-4">{o.details.address} • <span className="text-white font-bold">KES {o.total}</span></div>
                  <div className="flex gap-2">
                    <button onClick={()=>{setOrders(orders.map(x=>x.id===o.id?{...x, status:'Dispatched'}:x)); toast('Order Dispatched')}} className="flex-1 bg-slate-800 text-xs py-2 rounded-lg font-bold border border-slate-700">Dispatch</button>
                    <button onClick={()=>{setOrders(orders.map(x=>x.id===o.id?{...x, status:'Delivered'}:x)); toast('Order Delivered')}} className="flex-1 bg-emerald-600 text-xs py-2 rounded-lg font-bold">Delivered</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(page === "login" || page === "register") && (
          <div className="mt-12 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-emerald-700 tracking-tighter">RUAI FRESH</h1>
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Nanyuki's Finest Mart</p>
            </div>
            <form onSubmit={(e) => handleAuth(e, page === "register")} className="space-y-4">
              <input required name="email" type="email" placeholder="Email Address" className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-emerald-500 bg-slate-50/50 transition"/>
              <input required name="pass" type="password" placeholder="Password" className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-emerald-500 bg-slate-50/50 transition"/>
              {page === "register" && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Secret Admin Key (Optional)</p>
                  <input name="pin" type="password" placeholder="PIN" className="w-full border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-emerald-500 bg-slate-50/50 transition"/>
                </div>
              )}
              <button type="submit" className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-100 transition-transform active:scale-95">{page === "login" ? "Welcome Back" : "Join the Mart"}</button>
              <button type="button" onClick={() => setPage(page === "login" ? "register" : "login")} className="w-full text-sm font-bold text-slate-400 hover:text-emerald-700 transition">
                {page === "login" ? "Don't have an account? Register" : "Already a member? Login"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
