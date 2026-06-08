import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  CheckCircle,
  Truck,
  RotateCcw,
  Sliders
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AdminPanel() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products'>('analytics');
  
  // Analytics State
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    customersCount: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Products CRUD State
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');

  // Catalog Product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('shirts');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [isNewProdNewArrival, setIsNewProdNewArrival] = useState(false);
  const [isNewProdBestSeller, setIsNewProdBestSeller] = useState(false);

  // Editing & Image Upload states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    // Lock access to auth admins
    if (!user || user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user]);

  // Clean local ObjectURLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Load analytics & orders & products from API
  const refreshAdminData = async () => {
    try {
      setOrdersLoading(true);
      setProductsLoading(true);

      // Load Analytics
      const analResp = await fetch('/api/admin/analytics');
      const analData = await analResp.json();
      setStats(analData.stats || { totalSales: 247000, ordersCount: 120, avgOrderValue: 2058, customersCount: 95 });
      setChartData(analData.salesChart || []);

      // Load Orders
      const ordResp = await fetch('/api/orders');
      const ordData = await ordResp.json();
      setOrders(ordData || []);
      setOrdersLoading(false);

      // Load Products
      const prodResp = await fetch('/api/products?limit=50');
      const prodData = await prodResp.json();
      setProducts(prodData.products || []);
      setProductsLoading(false);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      const resp = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (resp.ok) {
        // Refresh
        setOrders((prev) => 
          prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o)
        );
        setCrudSuccess(`Order ${orderId} successfully marked as ${nextStatus}.`);
        setTimeout(() => setCrudSuccess(''), 2500);
      }
    } catch {
      setCrudError('Failed to modify order status in database.');
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm('Are you strictly sure you want to delete this product?')) return;
    try {
      const resp = await fetch(`/api/products/${prodId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        setCrudSuccess('Garment removed from database catalogs.');
        setTimeout(() => setCrudSuccess(''), 2500);
      } else {
        setCrudError('Failed to delete product.');
      }
    } catch {
      setCrudError('Database constraint failure during deletion.');
    }
  };

  // Process selected file objects with validation
  const processFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Unsupported file: "${file.name}". Only JPG, JPEG, PNG, and WEBP images are allowed.`);
        continue;
      }
      if (file.size > maxSize) {
        setUploadError(`File too large: "${file.name}" exceeds the 10MB size limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setPreviewUrls((prev) => [...prev, ...validPreviews]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartEditProduct = (p: any) => {
    setEditingProduct(p);
    setNewProdName(p.name);
    setNewProdCategory(p.category);
    setNewProdPrice(String(p.price));
    setNewProdDesc(p.description || '');
    setIsNewProdNewArrival(!!p.isNewArrival);
    setIsNewProdBestSeller(!!p.isBestSeller);
    setExistingImages(p.images || []);
    
    // Revoke previous URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadError('');
    setCrudError('');
    setCrudSuccess('');

    // Smooth scroll to catalog-form
    setTimeout(() => {
      const el = document.getElementById('catalog-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProdName('');
    setNewProdCategory('shirts');
    setNewProdPrice('');
    setNewProdDesc('');
    setIsNewProdNewArrival(false);
    setIsNewProdBestSeller(false);
    setExistingImages([]);
    
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadError('');
    setCrudError('');
    setCrudSuccess('');
  };

  const handleCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError('');
    setCrudSuccess('');

    if (!newProdName.trim() || !newProdPrice || !newProdDesc.trim()) {
      setCrudError('All standard properties are mandatory for registration.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newProdName);
      formData.append('category', newProdCategory);
      formData.append('price', newProdPrice);
      formData.append('description', newProdDesc);
      formData.append('isNewArrival', String(isNewProdNewArrival));
      formData.append('isBestSeller', String(isNewProdBestSeller));

      // Append newly uploaded image files
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      let url = '/api/products';
      let method = 'POST';

      if (editingProduct) {
        url = `/api/products/${editingProduct.id}`;
        method = 'PUT';
        // Send keeping list of existing images
        formData.append('images', JSON.stringify(existingImages));
      }

      const resp = await fetch(url, {
        method,
        body: formData
      });

      const data = await resp.json();
      if (!resp.ok) {
        setCrudError(data.error || 'Failed to catalog product.');
      } else {
        const returnedProduct = data.product || data;
        if (editingProduct) {
          setProducts((prev) =>
            prev.map((p) => p.id === editingProduct.id ? returnedProduct : p)
          );
          setCrudSuccess(`Product "${newProdName}" updated successfully!`);
          handleCancelEdit();
        } else {
          setProducts((prev) => [returnedProduct, ...prev]);
          setCrudSuccess(`Product "${newProdName}" cataloged successfully!`);
          
          // Reset standard form inputs
          setNewProdName('');
          setNewProdPrice('');
          setNewProdDesc('');
          setIsNewProdNewArrival(false);
          setIsNewProdBestSeller(false);
          setExistingImages([]);
          // Revoke ObjectURLs
          previewUrls.forEach((url) => URL.revokeObjectURL(url));
          setSelectedFiles([]);
          setPreviewUrls([]);
        }
        setTimeout(() => setCrudSuccess(''), 4000);
      }
    } catch {
      setCrudError('Connection write errors.');
    }
  };

  const statusTags: Record<string, string> = {
    'pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'processing': 'bg-blue-100 text-blue-800 border-blue-200',
    'shipped': 'bg-purple-100 text-purple-800 border-purple-200',
    'delivered': 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };

  return (
    <div id="admin-page" className="pb-16 select-none bg-brand-white">
      {/* Click paths */}
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        
        {/* Title metrics overview */}
        <div className="border-b border-brand-off pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-black/95 text-white p-6 rounded-lg select-none">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-montserrat uppercase font-extrabold text-brand-sky block">
              STREETVIBE ENTERPRISE DECK
            </span>
            <h1 className="font-montserrat font-black text-xl md:text-2xl tracking-tight text-white uppercase pt-1">
              ADMIN CONTROL CONSOLE
            </h1>
            <p className="text-xs text-brand-gray pt-0.5 leading-none">Catalog adjustments, real-time sales analyses, and delivery status controllers</p>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={refreshAdminData}
              className="text-[10px] font-bold uppercase tracking-widest bg-brand-charcoal text-brand-sky border border-brand-sky/20 px-4 py-2.5 rounded-lg flex items-center space-x-1.5 duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Sync Dashboard</span>
            </button>
            <Link 
              to="/profile"
              className="text-[10px] font-bold uppercase tracking-widest border border-brand-gray/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/10"
            >
              My Account
            </Link>
          </div>
        </div>

        {crudError && <div className="bg-red-50 text-red-700 font-semibold p-4 rounded-lg mb-6 border border-red-200 text-xs">{crudError}</div>}
        {crudSuccess && <div className="bg-emerald-50 text-emerald-800 font-semibold p-4 rounded-lg mb-6 border border-emerald-300 text-xs">{crudSuccess}</div>}

        {/* Tab Selection */}
        <div className="flex border-b border-brand-off bg-brand-off/30 rounded-lg p-1.5 select-none mb-8 max-w-lg">
          {[
            { id: 'analytics', label: 'Overview Analytics' },
            { id: 'orders', label: 'Order Dispatch Board' },
            { id: 'products', label: 'Catalog Product CRUD' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 text-xs font-montserrat font-bold uppercase tracking-wider text-center rounded-md transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-brand-charcoal text-[#B8E1F0] font-black' 
                  : 'text-brand-gray hover:text-brand-charcoal hover:bg-brand-off'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
              <div className="bg-white border rounded-lg p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div>
                  <DollarSign className="w-8 h-8 text-brand-sky absolute right-4 top-4 opacity-75" />
                  <span className="text-[10px] font-extrabold text-brand-gray uppercase tracking-widest block">NET SALES REVENUES</span>
                  <h3 className="text-xl md:text-2xl font-black font-sans text-brand-charcoal mt-1.5 leading-none">₹{stats.totalSales}</h3>
                </div>
                <p className="text-[10px] text-brand-gray mt-4 font-semibold">100% processed securely</p>
              </div>

              <div className="bg-white border rounded-lg p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div>
                  <ShoppingBag className="w-8 h-8 text-brand-sky absolute right-4 top-4 opacity-75" />
                  <span className="text-[10px] font-extrabold text-brand-gray uppercase tracking-widest block">TOTAL ORDERS PROCESSED</span>
                  <h3 className="text-xl md:text-2xl font-black font-sans text-brand-charcoal mt-1.5 leading-none">{stats.ordersCount}</h3>
                </div>
                <p className="text-[10px] text-brand-gray mt-4 font-semibold">Average conversion speed active</p>
              </div>

              <div className="bg-white border rounded-lg p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div>
                  <TrendingUp className="w-8 h-8 text-brand-sky absolute right-4 top-4 opacity-75" />
                  <span className="text-[10px] font-extrabold text-brand-gray uppercase tracking-widest block">AVERAGE ORDER VALUE</span>
                  <h3 className="text-xl md:text-2xl font-black font-sans text-brand-charcoal mt-1.5 leading-none">₹{stats.avgOrderValue}</h3>
                </div>
                <p className="text-[10px] text-brand-gray mt-4 font-semibold">Increased this clearance season</p>
              </div>

              <div className="bg-white border rounded-lg p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div>
                  <Users className="w-8 h-8 text-brand-sky absolute right-4 top-4 opacity-75" />
                  <span className="text-[10px] font-extrabold text-brand-gray uppercase tracking-widest block">RETAINED USERS</span>
                  <h3 className="text-xl md:text-2xl font-black font-sans text-brand-charcoal mt-1.5 leading-none">{stats.customersCount}</h3>
                </div>
                <p className="text-[10px] text-brand-gray mt-4 font-semibold">Newsletter syncs inclusive</p>
              </div>
            </div>

            {/* Recharts sales curves */}
            <div className="bg-white border rounded-lg p-6 shadow-sm select-none">
              <h3 className="font-montserrat font-bold text-xs uppercase tracking-wider text-brand-charcoal mb-6 flex items-center space-x-1">
                <span>WEEKLY SALES ANALYTICS TIMELINE</span>
                <span className="bg-[#B8E1F0] text-brand-charcoal text-[9px] px-1.5 py-0.2 rounded">LIVE</span>
              </h3>
              
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#061114', color: '#fff', fontSize: '11px', borderRadius: '4px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" name="Store Sales (₹)" stroke="#061114" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: REGISTERED ORDER STATUS MODIFIERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-xs font-montserrat font-extrabold uppercase tracking-wide text-brand-charcoal mb-4">
              Order Dispatch tracking Board
            </h3>

            {ordersLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-brand-off rounded"></div>
                <div className="h-10 bg-brand-off rounded"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-xs text-brand-gray font-semibold">No orders recorded in database storage currently.</p>
            ) : (
              <div className="overflow-x-auto border border-brand-off rounded-lg bg-white shadow-xs">
                <table className="w-full text-xs text-left" id="admin-orders-table">
                  <thead className="bg-[#F3F6F8] border-b text-[10px] font-montserrat font-extrabold uppercase text-brand-gray tracking-wider">
                    <tr>
                      <th className="p-4">ORDER ID</th>
                      <th className="p-4">BUYER COORDINATES</th>
                      <th className="p-4">DISPATCH ADDRESS</th>
                      <th className="p-4">BILLING AMOUNT</th>
                      <th className="p-4">CURRENT STATUS</th>
                      <th className="p-4 text-center">CHANGE ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-brand-charcoal">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-brand-off/25">
                        <td className="p-4 select-all font-mono font-black">{ord.id}</td>
                        <td className="p-4 select-all">
                          <p>{ord.shippingAddress.firstName} {ord.shippingAddress.lastName}</p>
                          <span className="text-[10px] text-brand-gray font-normal block">{ord.shippingAddress.email}</span>
                        </td>
                        <td className="p-4 select-all">
                          <p className="truncate max-w-[150px]" title={ord.shippingAddress.address}>{ord.shippingAddress.address}</p>
                          <span className="text-[10px] text-brand-gray font-mono font-normal">PIN: {ord.shippingAddress.pinCode}</span>
                        </td>
                        <td className="p-4 font-black font-sans">₹{ord.amount}</td>
                        <td className="p-4 font-medium">
                          <span className={`px-2.5 py-0.5 border text-[10px] uppercase font-bold tracking-wider rounded ${statusTags[ord.status] || 'bg-brand-off'}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-4 text-center select-none">
                          <select 
                            value={ord.status} 
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            className="bg-brand-off border text-[10px] font-bold uppercase rounded p-1.5 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS CRUD DECLARATIONS */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* CRUD Lists (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-montserrat font-extrabold uppercase tracking-wide text-brand-charcoal">
                Active Catalog Inventory Listings ({products.length} Items)
              </h3>

              {productsLoading ? (
                <div className="space-y-3 animate-pulse select-none">
                  <div className="h-10 bg-brand-off rounded"></div>
                  <div className="h-10 bg-brand-off rounded"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div 
                      key={p.id}
                      className="flex justify-between items-center bg-white border border-brand-off rounded p-3 text-xs font-bold font-montserrat"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <img src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80'} alt="crud thumb" className="w-[36px] h-[48px] object-cover bg-brand-off border rounded shrink-0" referrerPolicy="no-referrer" />
                        <div className="truncate max-w-[160px] md:max-w-[280px]">
                          <span className="text-brand-charcoal truncate block font-extrabold">{p.name}</span>
                          <span className="text-[10px] text-brand-gray block capitalize font-semibold">{p.category} index | ₹{p.price}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className={`text-[10px] px-2 py-0.5 border font-bold uppercase rounded ${p.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                          {p.inStock ? 'Active' : 'Muted'}
                        </div>
                        <button
                          onClick={() => handleStartEditProduct(p)}
                          className="p-1.5 border hover:bg-amber-50 text-brand-gray hover:text-amber-600 rounded transition-colors animate-fade-in"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 border hover:bg-red-50 text-brand-gray hover:text-red-600 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Creation/Edit form (5 cols) */}
            <div id="catalog-form" className="lg:col-span-5 bg-brand-off border rounded-lg p-6 space-y-5 scroll-mt-6">
              <div className="flex items-center space-x-2 border-b pb-3 mb-2 justify-between">
                <div className="flex items-center space-x-2">
                  {editingProduct ? (
                    <Edit3 className="w-5 h-5 text-amber-500 animate-pulse" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-brand-sky" />
                  )}
                  <h3 className="font-montserrat font-extrabold text-xs uppercase tracking-widest text-[#061114]">
                    {editingProduct ? 'Edit Cataloged Garment' : 'Catalog a new garment'}
                  </h3>
                </div>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-700 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleCatalogSubmit} className="space-y-4 text-xs font-semibold select-none">
                <div>
                  <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Product Title *</label>
                  <input 
                    type="text" 
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Ex. StreetVibe Alpine Corduroy Jacket"
                    className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold text-brand-charcoal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#061114] uppercase mb-1">Category *</label>
                    <select 
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full bg-white border border-brand-gray/30 rounded p-1.5 text-xs text-brand-charcoal focus:outline-none font-bold"
                    >
                      <option value="shirts">Shirts</option>
                      <option value="pants">Pants</option>
                      <option value="tshirts">T-Shirts</option>
                      <option value="shoes">Shoes</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Pricing (₹ INR) *</label>
                    <input 
                      type="number" 
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="1899"
                      className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold text-brand-charcoal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Garment Descriptions *</label>
                  <textarea 
                    required
                    rows={3}
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Fine structural detailing. Organic long-staple linen designed for durability."
                    className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-medium text-brand-charcoal leading-relaxed"
                  ></textarea>
                </div>

                {/* Local Multi-Image Drop & File Picker Upload Section */}
                <div className="space-y-2 pt-2 border-t border-brand-charcoal/10">
                  <label className="block text-[10px] font-extrabold text-brand-gray uppercase">Product Images *</label>
                  
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      processFiles(e.dataTransfer.files);
                    }}
                    onClick={() => document.getElementById('image-file-input')?.click()}
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
                      isDragOver 
                        ? 'border-brand-sky bg-brand-sky/10 text-brand-charcoal' 
                        : 'border-brand-gray/30 hover:border-brand-gray/60 bg-white text-brand-gray'
                    }`}
                  >
                    <input
                      id="image-file-input"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => processFiles(e.target.files)}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center space-y-1">
                      <ShoppingBag className="w-6 h-6 text-brand-gray/70" />
                      <p className="font-bold text-[11px] text-brand-charcoal">
                        Drag & drop product images here, or <span className="text-brand-sky underline font-extrabold">browse files</span>
                      </p>
                      <p className="text-[9px] font-medium text-brand-gray/80">
                        Supports JPEG, JPG, PNG, WEBP (Max 10MB per file)
                      </p>
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 p-2 rounded">
                      {uploadError}
                    </p>
                  )}

                  {/* Thumbnail gallery showcasing kept and freshly loaded images */}
                  {((editingProduct && existingImages.length > 0) || previewUrls.length > 0) && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {/* Already set images */}
                      {existingImages.map((img, idx) => (
                        <div key={`existing-${idx}`} className="relative group border rounded overflow-hidden aspect-[3/4] bg-brand-off">
                          <img src={img} alt="existing preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150">
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(idx)}
                              className="bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition animate-fade-in"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] py-0.5 text-center tracking-wide uppercase font-extrabold">
                            Saved
                          </span>
                        </div>
                      ))}

                      {/* Fresh local selections preview */}
                      {previewUrls.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative group border rounded overflow-hidden aspect-[3/4] bg-brand-off">
                          <img src={url} alt="new preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-150">
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(idx)}
                              className="bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition animate-fade-in"
                              title="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[8px] py-0.5 text-center tracking-wide uppercase font-extrabold animate-pulse">
                            New
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 select-none pt-2 border-t border-brand-off text-[#061114]">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs">
                    <input 
                      type="checkbox" 
                      checked={isNewProdNewArrival}
                      onChange={(e) => setIsNewProdNewArrival(e.target.checked)}
                      className="rounded border-brand-gray/35 text-brand-charcoal w-4 h-4"
                    />
                    <span>Mark as New Arrival badge</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs">
                    <input 
                      type="checkbox" 
                      checked={isNewProdBestSeller}
                      onChange={(e) => setIsNewProdBestSeller(e.target.checked)}
                      className="rounded border-brand-gray/35 text-brand-charcoal w-4 h-4"
                    />
                    <span>Mark as Hot Best Seller badge</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-charcoal text-brand-sky font-montserrat font-bold text-xs py-3 rounded-lg hover:scale-101 duration-200 uppercase tracking-widest cursor-pointer mt-4"
                >
                  {editingProduct ? 'Update Product Details' : 'Create & Catalog Product'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
