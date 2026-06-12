import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShoppingBag, MapPin, Truck, Calendar, KeyRound, Check, RefreshCw } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { API_BASE_URL } from '../config/api';

export default function Profile() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile field modifications
  const [profileName, setProfileName] = useState(user?.name || 'Verified Buyer');
  const [shippingAddress, setShippingAddress] = useState('102 Premium Block, residency Road, Bangalore, Karnataka - 560001');
  const [saveNotify, setSaveNotify] = useState(false);

  useEffect(() => {
    // If no user is authenticated, redirect to home or open login
    if (!user) {
      navigate('/?auth=login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE_URL}/api/orders?userId=${user.id}`);
        const data = await resp.json();
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotify(true);
    setTimeout(() => setSaveNotify(false), 2000);
  };

  const statusProgressColors: Record<string, string> = {
    'pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'processing': 'bg-blue-100 text-blue-800 border-blue-200',
    'shipped': 'bg-purple-100 text-purple-800 border-purple-200',
    'delivered': 'bg-emerald-100 text-emerald-850 border-emerald-250'
  };

  return (
    <div id="profile-page" className="pb-16 select-none bg-brand-white">
      {/* Clickable breadcrumb indicators */}
      <Breadcrumbs />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Sidebar options: Info & Logout (4 Columns) */}
        <div className="md:col-span-4 bg-brand-off border border-brand-off/10 rounded-lg p-6 space-y-6 select-none">
          <div className="flex items-center space-x-3.5 pb-4 border-b">
              <div className="w-12 h-12 bg-brand-charcoal text-white rounded-full flex items-center justify-center font-montserrat font-black text-sm uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-montserrat font-extrabold text-xs text-brand-charcoal uppercase select-all truncate">{user?.name}</h3>
              <span className="text-[10px] text-brand-gray font-bold tracking-widest block uppercase">Premium Privilege tier</span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Display Username</label>
              <input 
                type="text" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-bold text-brand-charcoal"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Registered Coordinates Email</label>
              <input 
                type="email" 
                disabled
                value={user?.email || 'sales@streetvibe.com'}
                className="w-full bg-brand-off/55 border border-brand-gray/25 rounded px-3 py-2 text-xs text-brand-charcoal/65 outline-none font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-brand-gray uppercase mb-1">Backup Dispatch Address Block</label>
              <textarea 
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full bg-white border border-brand-gray/30 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-brand-sky outline-none font-semibold text-brand-charcoal leading-normal"
              ></textarea>
            </div>

            {saveNotify && (
              <div className="bg-emerald-50 text-emerald-800 text-[10px] p-2 rounded text-center border font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>SAVED DATA UPDATES!</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-brand-charcoal text-brand-white font-montserrat font-bold text-[10px] py-2.5 tracking-widest rounded-lg hover:bg-brand-gray transition-colors cursor-pointer"
            >
              Update Settings coordinates
            </button>
          </form>

          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2.5 text-[10px] font-montserrat font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
          >
            Sign Out From Dashboard (Logout)
          </button>
        </div>

        {/* Right Side Purchases & Deliveries lists (8 Columns) */}
        <div className="md:col-span-8 space-y-6">
          <div className="border-b border-brand-off pb-4.5 flex justify-between items-center bg-brand-off/15 px-4 rounded-lg py-1 border border-brand-off/40">
            <div>
              <h2 className="font-montserrat font-black text-sm uppercase tracking-wider text-brand-charcoal flex items-center space-x-1.5 pt-3">
                <ShoppingBag className="w-4.5 h-4.5 text-brand-sky mt-0.5" />
                <span>My Purchases Historical Logs ({orders.length})</span>
              </h2>
              <p className="text-[10px] text-brand-gray font-semibold pt-0.5">Track shipping codes and statuses from Bangalore hub center</p>
            </div>
            
            {user?.role === 'admin' && (
              <Link 
                to="/admin"
                className="bg-brand-charcoal text-[#B8E1F0] font-montserrat font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded shadow border border-brand-charcoal active:scale-95 duration-200"
              >
                Launch Admin Control Deck
              </Link>
            )}
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4 select-none">
              <div className="bg-brand-off h-20 w-full rounded"></div>
              <div className="bg-brand-off h-20 w-full rounded"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 border border-brand-off bg-brand-off/25 rounded-lg flex flex-col items-center justify-center space-y-3">
              <Truck className="w-10 h-10 text-brand-gray" />
              <h4 className="font-montserrat font-bold text-xs uppercase tracking-widest text-brand-charcoal">No Orders Placed Yet</h4>
              <p className="text-xs text-brand-gray max-w-xs font-semibold leading-relaxed">Ensure items are checked out securely and your historic receipts will validate inside this profile hub.</p>
              <Link 
                to="/shop"
                className="bg-brand-charcoal text-white font-montserrat font-extrabold text-[10px] py-2.5 px-6 uppercase tracking-wider rounded transition-all duration-200"
              >
                Go Shop Outfits
              </Link>
            </div>
          ) : (
            <div className="space-y-6 select-all">
              {orders.map((ord: any) => (
                <div 
                  key={ord.id}
                  className="border border-brand-off rounded-lg overflow-hidden bg-white hover:shadow-xs transition-shadow duration-200"
                >
                  {/* Order header information strip */}
                  <div className="bg-brand-off p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b text-xs font-bold text-brand-gray">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest block text-brand-gray font-bold">ORDER ID REFERENCE</span>
                      <span className="text-brand-charcoal select-all text-xs font-mono font-black">{ord.id}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest block text-brand-gray font-bold">PURCHASE DATE</span>
                      <span className="text-brand-charcoal font-sans font-medium text-[11px] block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest block text-brand-gray font-bold">NET BILL AMOUNT</span>
                      <span className="text-brand-charcoal font-sans text-xs font-black block">₹{ord.amount}</span>
                    </div>

                    {/* Progress tracking badge */}
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold font-montserrat uppercase tracking-wider rounded border ${statusProgressColors[ord.status] || 'bg-brand-off'}`}>
                      {ord.status}
                    </span>
                  </div>

                  {/* Order items lists */}
                  <div className="p-4 space-y-3 border-b">
                    {ord.items.map((it: any) => (
                      <div key={it.productId} className="flex items-center justify-between text-xs font-bold gap-4 select-none">
                        <div className="flex items-center space-x-3">
                          <img src={it.image} alt="purchased thumb" className="w-[40px] h-[52px] object-cover rounded bg-brand-off border text-brand-gray shrink-0" referrerPolicy="no-referrer" />
                          <div>
                            <span className="text-brand-charcoal capitalize truncate max-w-[150px] md:max-w-[250px] block">{it.name}</span>
                            <span className="text-[10px] text-brand-gray font-semibold block uppercase">SIZE: {it.size} | Finish: {it.color} (x{it.quantity})</span>
                          </div>
                        </div>

                        <span className="font-sans text-brand-charcoal font-black text-xs">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Estimated Delivery Tracking Speed row */}
                  <div className="p-3.5 bg-[#F3F6F8]/35 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] font-semibold text-brand-gray gap-2">
                    <div className="flex items-center space-x-1.5 select-none text-brand-gray">
                      <Truck className="w-4 h-4 shrink-0 text-brand-sky" />
                      <span className="font-bold">Shipping speed: <strong className="text-brand-charcoal capitalize">{ord.paymentMethod === 'cod' ? 'COD Ground Dispatch' : 'Secured Air Gateway'}</strong></span>
                    </div>

                    <div className="flex items-center space-x-1 text-brand-gray select-none">
                      <Calendar className="w-4 h-4 text-brand-gray shrink-0" />
                      <span>Estimated delivery date: <strong>{new Date(new Date(ord.createdAt).getTime() + 350 * 50 * 60 * 1000).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
