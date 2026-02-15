import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Trash2, Edit, 
  CheckCircle, Store, ArrowLeft, LogOut, User, 
  Package, Truck, CheckSquare, XCircle
} from 'lucide-react';

const formatCurrency = (amount) => `KES ${Number(amount).toLocaleString()}`;

const LS_PRODUCTS = "ruai_products";
const LS_ORDERS = "ruai_orders";
const LS_USERS = "ruai_users";
const LS_USER = "ruai_current_user";

const load = (key, fallback=[]) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const SEED_PRODUCTS = [
  { id:"1", name:"Maize Flour (Unga 1kg)", price:130, category:"Grains", stock:50 },
  { id:"2", name:"Bread (500g)", price:65, category:"Bakery", stock:20 },
  { id:"3", name:"Milk (Fresh 1L)", price:130, category:"Dairy", stock:30 },
  { id:"4", name:"Eggs (12 Pack)", price:230, category:"Poultry", stock:20 },
  { id:"5", name:"Sukuma Wiki (1kg)", price:70, category:"Vegetables", stock:60 },
  { id:"6", name:"Mandazi", price:10, category:"Snacks", stock:100 },
  { id:"7", name:"Matchbox", price:15, category:"Household", stock:200 }
];

const Button = ({ children, onClick, type="button", className="", variant="primary" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
  };
  return (
    <button onClick={onClick} type={type} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Badge = ({ children, color="emerald" }) => {
  const styles = {
    emerald: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`${styles[color] || styles.emerald} text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider`}>
      {children}
    </span>
  );
};

export default function RuaiApp() {
  const [products, setProducts] = useState(load(LS_PRODUCTS, []));
  const [orders, setOrders] = useState(load(LS_ORDERS, []));
  const [users, setUsers] = useState(load(LS_USERS, []));
  const [user, setUser] = useState(load(LS_USER, null));
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("home");
  const [notify, setNotify] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [adminTab, setAdminTab] = useState("inventory");
  const [formData, setFormData] = useState({ name: '', category: '', price: '', stock: '' });

  const toast = msg => { setNotify(msg); setTimeout(()=>setNotify(null), 2500); };

  useEffect(()=>save(LS_PRODUCTS, products),[products]);
  useEffect(()=>save(LS_ORDERS, orders),[orders]);
  useEffect(()=>save(LS_USERS, users),[users]);
  useEffect(()=>save(LS_USER, user),[user]);

  const handleAuth = (e, isRegister) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.pass.value;
    if (isRegister) {
      if (users.find(u=>u.email===email)) return toast("Account exists");
      const role = users.length===0 ? "admin" : "customer";
      const newUser = { id:Date.now().toString(), email, password, role };
      setUsers(prev=>[...prev,newUser]);
      setUser(newUser);
      toast(role==="admin" ? "Admin account created" : "Account created");
      setPage("home");
    } else {
      const found = users.find(u=>u.email===email && u.password===password);
      if (!found) return toast("Invalid login");
      setUser(found);
      toast("Welcome back");
      setPage("home");
    }
  };

  const logout = () => { setUser(null); setPage("login"); };

  const addToCart = p => {
    setCart(prev=>{
      const ex = prev.find(i=>i.id===p.id);
      if (ex) return prev.map(i=>i.id===p.id ? {...i, quantity:i.quantity+1} : i);
      return [...prev,{...p, quantity:1}];
    });
    toast(`Added ${p.name}`);
  };

  const cartSubtotal = cart.reduce((a,i)=>a+i.price*i.quantity,0);
  const deliveryFee = 100;
  const cartTotal = cartSubtotal + deliveryFee;

  const checkout = e => {
    e.preventDefault();
    const order = {
      id: Date.now().toString(),
      userEmail: user.email,
      items: cart,
      total: cartTotal,
      status:"Pending",
      createdAt:new Date().toISOString(),
      customerDetails: {
        name: e.target.name.value,
        phone: e.target.phone.value,
        address: e.target.address.value
      }
    };
    setOrders(prev=>[order,...prev]);
    setCart([]);
    setPage("orders");
    toast("Order placed!");
  };

  useEffect(() => {
    if (editingId) {
      const p = products.find(x => x.id === editingId);
      if (p) setFormData({ name: p.name, category: p.category, price: p.price, stock: p.stock });
    } else {
      setFormData({ name: '', category: '', price: '', stock: '' });
    }
  }, [editingId, products]);

  const saveProduct = e => {
    e.preventDefault();
    const p = { id: editingId || Date.now().toString(), ...formData, price: Number(formData.price), stock: Number(formData.stock) };
    setProducts(prev => editingId ? prev.map(x => x.id === editingId ? p : x) : [...prev, p]);
    setEditingId(null);
    toast("Inventory updated");
  };

  const updateOrderStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    toast(`Status: ${newStatus}`);
  };

  const getStatusColor = (status) => {
    if(status === "Delivered") return "emerald";
    if(status === "Dispatched") return "blue";
    if(status === "Cancelled") return "red";
    return "orange";
  };

  const displayOrders = user?.role==="admin" ? orders : orders.filter(o=>o.userEmail===user?.email);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      <div className="bg-white shadow sticky top-0 z-10 p-4 mb-6">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={()=>setPage("home")}>
            <Store className="text-emerald-600" />
            <h1 className="font-black text-xl tracking-tight">RUAI FRESH</h1>
          </div>
          <div className="flex gap-4">
            {user ? (
               <div className="flex gap-3">
                 <button className="relative" onClick={()=>setPage("cart")}>
                   <ShoppingCart className="text-gray-600" />
                   {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>}
                 </button>
                 <button onClick={()=>setPage("orders")}><User className="text-gray-600"/></button>
                 {user.role==="admin" && <button onClick={()=>setPage("admin")} className="font-bold text-emerald-600">ADMIN</button>}
                 <button onClick={logout}><LogOut className="text-gray-600"/></button>
               </div>
            ) : <button onClick={()=>setPage("login")} className="font-bold text-emerald-600">Login</button>}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {notify && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2"><CheckCircle size={16}/> {notify}</div>}

        {page==="home" && (
          <div className="grid grid-cols-2 gap-4">
            {products.map(p=>(
              <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div><Badge color="emerald">{p.category}</Badge><h3 className="font-bold mt-2">{p.name}</h3></div>
                <div className="flex justify-between items-center mt-4"><span className="font-bold">{formatCurrency(p.price)}</span>
                <button onClick={()=>addToCart(p)} className="bg-emerald-100 text-emerald-700 p-2 rounded-full"><Plus size={20} /></button></div>
              </div>
            ))}
            {products.length === 0 && <Button onClick={()=>setProducts(SEED_PRODUCTS)} variant="outline" className="col-span-2">Seed Products</Button>}
          </div>
        )}

        {page==="cart" && (
          <div>
            <Button onClick={()=>setPage("home")} variant="secondary" className="mb-4"><ArrowLeft size={16}/> Shop</Button>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              {cart.map(i=>(<div key={i.id} className="flex justify-between mb-2"><span>{i.name} x{i.quantity}</span><span>{formatCurrency(i.price*i.quantity)}</span></div>))}
              <div className="border-t pt-2 mt-2 font-bold flex justify-between"><span>Total (+ Delivery)</span><span>{formatCurrency(cartTotal)}</span></div>
            </div>
            <form onSubmit={checkout} className="space-y-3">
              <input required name="name" placeholder="Name" className="border p-3 rounded-lg w-full"/>
              <input required name="phone" placeholder="Phone" className="border p-3 rounded-lg w-full"/>
              <input required name="address" placeholder="Address" className="border p-3 rounded-lg w-full"/>
              <Button type="submit" className="w-full">Confirm Order</Button>
            </form>
          </div>
        )}

        {page==="orders" && (
          <div>
            <h2 className="font-bold text-xl mb-4">My Orders</h2>
            {displayOrders.map(o=>(
              <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <div className="flex justify-between mb-2"><span>Order #{o.id.slice(-5)}</span><Badge color={getStatusColor(o.status)}>{o.status}</Badge></div>
                <div className="font-bold">{formatCurrency(o.total)}</div>
              </div>
            ))}
          </div>
        )}

        {page==="admin" && user?.role==="admin" && (
          <div>
            <div className="flex p-1 bg-gray-200 rounded-lg mb-6">
              <button onClick={() => setAdminTab('inventory')} className={`flex-1 py-2 rounded ${adminTab === 'inventory' ? 'bg-white shadow' : ''}`}>Inventory</button>
              <button onClick={() => setAdminTab('orders')} className={`flex-1 py-2 rounded ${adminTab === 'orders' ? 'bg-white shadow' : ''}`}>Orders</button>
            </div>
            {adminTab === 'inventory' ? (
              <form onSubmit={saveProduct} className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
                <input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} placeholder="Name" className="border p-2 w-full" required/>
                <input value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} type="number" placeholder="Price" className="border p-2 w-full" required/>
                <Button type="submit" className="w-full">{editingId ? "Update" : "Add"}</Button>
              </form>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-white p-4 rounded-xl shadow mb-4">
                  <div className="flex justify-between items-center">
                    <div><div className="font-bold">{o.customerDetails?.name}</div><div className="text-xs">{o.status}</div></div>
                    <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="border p-1 rounded">
                      <option value="Pending">Pending</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {(page==="login" || page==="register") && (
          <form onSubmit={(e)=>handleAuth(e, page==="register")} className="space-y-4 bg-white p-6 rounded-xl shadow-sm mt-10">
            <h1 className="font-black text-2xl text-center">RUAI FRESH</h1>
            <input required name="email" type="email" placeholder="Email" className="border p-3 rounded-lg w-full"/>
            <input required name="pass" type="password" placeholder="Password" className="border p-3 rounded-lg w-full"/>
            <Button type="submit" className="w-full">{page==="login" ? "Sign In" : "Register"}</Button>
            <button type="button" onClick={()=>setPage(page==="login"?"register":"login")} className="w-full text-sm text-emerald-600">Switch Login/Register</button>
          </form>
        )}
      </div>
    </div>
  );
}
