import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import CityVillageSelectorModal from '../components/CityVillageSelectorModal';
import { COMMON_CROPS, KARNATAKA_CITIES_AND_VILLAGES } from '../utils/helpers';
import { DUMMY_POSTS } from '../utils/dummyData';
import {
  ShoppingBag,
  ListPlus,
  PackageCheck,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Filter,
  Sparkles,
  MapPin,
  Building2,
  Sprout
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BuyerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'my-requirements'

  // Tab 1: Farmer Listings Feed
  const [farmerPosts, setFarmerPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [selectedCropFilter, setSelectedCropFilter] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Requirement Form State
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqCrop, setReqCrop] = useState('Tomato');
  const [reqQty, setReqQty] = useState('');
  const [reqPrice, setReqPrice] = useState('');
  const [creatingReq, setCreatingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState('');

  // Tab 2: My Requirements
  const [myRequirements, setMyRequirements] = useState([]);
  const [loadingMyReqs, setLoadingMyReqs] = useState(false);

  // Load Farmer Listings Feed
  const fetchFarmerPosts = async (cropFilter = selectedCropFilter, locFilter = selectedLocationFilter) => {
    setLoadingFeed(true);
    try {
      const params = { userType: 'buyer' };
      if (cropFilter) params.cropType = cropFilter;
      if (locFilter) params.city_or_village = locFilter;
      const res = await api.get('/posts', { params });
      if (res.data && res.data.length > 0) {
        setFarmerPosts(res.data);
        setLoadingFeed(false);
        return;
      }
    } catch (err) {
      console.warn('API listings unreachable, using fallback demo posts:', err.message);
    } finally {
      setLoadingFeed(false);
    }

    // Fallback filter over DUMMY_POSTS
    let filtered = DUMMY_POSTS.filter(p => p.category === 'produce');
    if (cropFilter) filtered = filtered.filter(p => p.crop_type.toLowerCase() === cropFilter.toLowerCase());
    if (locFilter) filtered = filtered.filter(p => p.city_or_village === locFilter);
    setFarmerPosts(filtered);
  };

  // Load Buyer's Own Requirements
  const fetchMyRequirements = async () => {
    if (!user) return;
    setLoadingMyReqs(true);
    try {
      const res = await api.get(`/posts/user/${user.id}`);
      setMyRequirements(res.data || []);
    } catch (err) {
      console.error('Failed to fetch my requirements', err);
    } finally {
      setLoadingMyReqs(false);
    }
  };

  useEffect(() => {
    fetchFarmerPosts();
    fetchMyRequirements();
  }, [user]);

  // Create Requirement Post
  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    if (!reqTitle || !reqQty || !reqPrice) {
      alert('Please fill in title, quantity, and budget');
      return;
    }

    setCreatingReq(true);
    setReqSuccess('');

    try {
      await api.post('/posts', {
        userId: user.id,
        title: reqTitle,
        description: reqDesc,
        category: 'requirement',
        cropType: reqCrop,
        quantity: Number(reqQty),
        pricePerUnit: Number(reqPrice),
        imageUrl: null,
        userType: 'buyer'
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      setReqSuccess('Requirement posted! Farmers can now view and contact you on WhatsApp.');
      setReqTitle('');
      setReqDesc('');
      setReqQty('');
      setReqPrice('');

      fetchMyRequirements();
      setTimeout(() => setReqSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create requirement');
    } finally {
      setCreatingReq(false);
    }
  };

  // Dealing Done Handler
  const handleDealingDone = async (postId) => {
    try {
      await api.post(`/posts/${postId}/dealing-done`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      fetchMyRequirements();
      fetchFarmerPosts();
    } catch (err) {
      alert('Failed to mark deal as done');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                Buyer Procurement Hub
              </span>
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                Procuring for:
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="inline-flex items-center gap-1 font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 px-2.5 py-0.5 rounded-full border border-purple-200 transition-colors cursor-pointer"
                  title="Change your procurement city/village"
                >
                  <MapPin className="w-3 h-3 text-purple-600" />
                  {user?.city_or_village || user?.district || 'Bengaluru'}
                  <span className="text-[10px] text-purple-700 underline font-extrabold ml-0.5">Change</span>
                </button>
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Direct Produce Sourcing & Order Desk
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Browse AI-inspected farmer harvests, negotiate directly via WhatsApp, and post procurement orders.
            </p>
          </div>

          {/* Navigation Pill Bar */}
          <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl border border-slate-300/60 overflow-x-auto self-start">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'listings'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              Farmer Listings
            </button>

            <button
              onClick={() => setActiveTab('my-requirements')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'my-requirements'
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-purple-600" />
              My Requirements ({myRequirements.length})
            </button>
          </div>
        </div>

        {/* TAB 1: FARMER LISTINGS & POST REQUIREMENT */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Farmer Produce Feed (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900">
                    Farmer Harvest Listings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fresh produce directly from verified farmers with CV grading
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* City/Village Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedLocationFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedLocationFilter(val);
                        fetchFarmerPosts(selectedCropFilter, val);
                      }}
                      className="text-xs pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[170px] truncate"
                    >
                      <option value="">All Cities & Villages</option>
                      {user?.city_or_village && (
                        <option value={user.city_or_village}>
                          📍 My Area ({user.city_or_village})
                        </option>
                      )}
                      <optgroup label="Farming Villages & Clusters">
                        {KARNATAKA_CITIES_AND_VILLAGES.filter(l => l.type === 'village').map(v => (
                          <option key={v.name} value={v.name}>
                            🌾 {v.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Cities & APMC Hubs">
                        {KARNATAKA_CITIES_AND_VILLAGES.filter(l => l.type === 'city').map(c => (
                          <option key={c.name} value={c.name}>
                            🏙️ {c.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                  </div>

                  {/* Crop Filter */}
                  <select
                    value={selectedCropFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCropFilter(val);
                      fetchFarmerPosts(val, selectedLocationFilter);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">All Crop Types</option>
                    {COMMON_CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {(selectedCropFilter || selectedLocationFilter) && (
                    <button
                      onClick={() => {
                        setSelectedCropFilter('');
                        setSelectedLocationFilter('');
                        fetchFarmerPosts('', '');
                      }}
                      className="text-xs px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    onClick={() => fetchFarmerPosts(selectedCropFilter, selectedLocationFilter)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Refresh feed"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingFeed ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loadingFeed ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
                  <p className="text-xs text-slate-500">Loading farmer listings...</p>
                </div>
              ) : farmerPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">No active farmer listings found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try clearing the crop filter or check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {farmerPosts.map((post) => (
                    <PostCard key={post.id} post={post} isOwner={false} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Post Requirement Form (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl text-slate-900">
                    Post Produce Requirement
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Broadcast your bulk order requirements to regional farmer clusters
                  </p>
                </div>
              </div>

              {reqSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>{reqSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateRequirement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Order Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need Quality Potatoes - Bulk Order"
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Crop Type
                    </label>
                    <select
                      value={reqCrop}
                      onChange={(e) => setReqCrop(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 focus:bg-white font-medium"
                    >
                      {COMMON_CROPS.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quantity (kg)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="100"
                      value={reqQty}
                      onChange={(e) => setReqQty(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Budget / kg (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      required
                      placeholder="28"
                      value={reqPrice}
                      onChange={(e) => setReqPrice(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Order Details / Specification
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Bulk order for hotel kitchen. Grade A or B preferred. Need dispatch within 48 hours."
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingReq}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-display"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>{creatingReq ? 'Posting...' : 'Post Buyer Requirement'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: MY REQUIREMENTS */}
        {activeTab === 'my-requirements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="font-display font-extrabold text-xl text-slate-900">
                  My Active Requirements
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requirements posted by you currently open for farmer offers
                </p>
              </div>
              <button
                onClick={fetchMyRequirements}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMyReqs ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingMyReqs ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
                <p className="text-xs text-slate-500">Loading requirements...</p>
              </div>
            ) : myRequirements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                <PackageCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">You have no active requirements</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Switch to the "Farmer Listings" tab to post a new procurement order!
                </p>
                <button
                  onClick={() => setActiveTab('listings')}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-purple-700"
                >
                  Post a Requirement
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myRequirements.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={true}
                    onDealingDone={handleDealingDone}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Location Selector Modal */}
      <CityVillageSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelected={(loc) => {
          fetchFarmerPosts(selectedCropFilter, loc.name);
        }}
      />
    </div>
  );
}
