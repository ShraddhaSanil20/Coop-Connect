import React, { useState, useEffect } from 'react';
import { ServiceCategory, WorkerProfile, DispatchSimulationResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { PaymentModal } from '../components/common/PaymentModal';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { 
  Search, MapPin, Zap, Cpu, Droplet, Hammer, Sparkles, CheckCircle2, 
  ShieldCheck, Star, Clock, FileText, ChevronRight, UserCheck, ShieldAlert, ThumbsUp
} from 'lucide-react';

export const CustomerView: React.FC = () => {
  const { t } = useAuth();
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [dispatchMode, setDispatchMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [address, setAddress] = useState<string>('7th Block, Koramangala, Bengaluru');

  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchSimulationResult | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackWorker, setFeedbackWorker] = useState<{ id: string; name: string; title: string } | null>(null);

  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState<string | null>(null);

  const localities = [
    'Indiranagar, Bengaluru',
    '7th Block, Koramangala, Bengaluru',
    'Whitefield IT Corridor, Bengaluru',
    'HSR Layout Sector 1, Bengaluru',
    'Jayanagar 4th Block, Bengaluru',
    'Electronic City Phase 1, Bengaluru',
    'Bellandur Outer Ring Rd, Bengaluru',
  ];

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/v1/bookings/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/v1/workers');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await fetch('/api/v1/bookings/my-customer');
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch customer bookings:', err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchWorkers();
    fetchMyBookings();
  }, []);

  const handleCreateBooking = async () => {
    if (!selectedService) return;

    try {
      const res = await fetch('/api/v1/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          workerId: dispatchMode === 'MANUAL' && selectedWorker ? selectedWorker.id : undefined,
          address,
          lat: 12.9716,
          lng: 77.5946,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveBooking(data.booking);
        setDispatchResult(data.dispatchResult || null);
        setBookingModalOpen(false);
        setPaymentModalOpen(true);
        fetchMyBookings();
      }
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  const handlePaymentSuccess = async (paymentMethod: string) => {
    if (activeBooking) {
      try {
        await fetch(`/api/v1/bookings/${activeBooking.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ACCEPTED',
            paymentStatus: 'HELD_IN_ESCROW',
            paymentMethod,
          }),
        });
      } catch (err) {
        console.error('Failed to update payment status:', err);
      }
    }
    setPaymentModalOpen(false);
    fetchMyBookings();
  };

  const handleFeedbackSubmit = async (rating: number, review: string) => {
    if (feedbackWorker) {
      try {
        await fetch(`/api/v1/bookings/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: feedbackWorker.id,
            rating,
            reviewText: review,
          }),
        });
        fetchMyBookings();
      } catch (err) {
        console.error('Failed to submit review:', err);
      }
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-emerald-600" />;
      case 'Droplet': return <Droplet className="w-6 h-6 text-blue-600" />;
      case 'Hammer': return <Hammer className="w-6 h-6 text-amber-800" />;
      default: return <Sparkles className="w-6 h-6 text-amber-500" />;
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Fair Opportunity Service Marketplace
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-100">
            Book Certified Services. <br />
            <span className="text-emerald-400">Empower Worker Cooperatives.</span>
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Every booking through Coop Connect guarantees safety-verified professionals, transparent FairDispatch matching, and direct reinvestment into worker welfare funds.
          </p>

          {/* Search Bar */}
          <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-2.5 flex flex-wrap items-center gap-3 shadow-lg text-stone-200">
            <div className="flex-1 min-w-[240px] px-3 py-1 border-r border-stone-700">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs font-semibold focus:outline-none bg-transparent text-stone-100 placeholder-stone-400"
                  placeholder="Enter service location address..."
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase shrink-0">Bengaluru Locality:</span>
                {localities.slice(0, 3).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setAddress(loc)}
                    className="text-[10px] px-2 py-0.5 bg-stone-700/60 hover:bg-emerald-500/20 text-stone-300 hover:text-emerald-300 rounded font-medium shrink-0 transition-colors"
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-1.5">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold focus:outline-none bg-transparent text-stone-100 placeholder-stone-400"
                placeholder={t('searchPlaceholder')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-800/80 border border-stone-700/80 text-stone-300 hover:bg-stone-700'
            }`}
          >
            {cat === 'ALL' ? 'All Professions' : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-100">Available Cooperative Services</h3>
            <p className="text-xs text-stone-400">
              Vetted professionals dispatched via FairDispatch opportunity balance • {filteredServices.length} categories
            </p>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400 space-y-2">
            <Search className="w-8 h-8 text-stone-500 mx-auto" />
            <h4 className="font-bold text-stone-200">No matching services found</h4>
            <p className="text-xs">Try searching for electrician, plumber, carpenter, barber, solar technician...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-stone-900/90 border border-stone-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getServiceIcon(service.icon)}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {service.category}
                    </span>
                    <h4 className="font-bold text-base text-stone-100 mt-0.5">{service.title}</h4>
                    <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-extrabold text-stone-100">₹{service.base_price}</div>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" /> ~{service.estimated_duration_mins} mins
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedWorker(null);
                      setDispatchMode('AUTO');
                      setBookingModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/20"
                  >
                    {t('bookService')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Worker Directory (Manual Dispatch Option) */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Verified Cooperative Worker Partners
          </h3>
          <p className="text-xs text-stone-400">
            Or choose a verified partner directly for your booking request
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.filter(w => w.verificationStatus === 'VERIFIED').slice(0, 6).map((worker) => (
            <div
              key={worker.id}
              className="bg-stone-800/50 border border-stone-700/60 p-4 rounded-xl space-y-3 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
                    {(worker.name || 'W').charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-200 text-xs flex items-center gap-1">
                      {worker.name || 'Partner'}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </h5>
                    <span className="text-[10px] text-stone-400">{worker.profession || 'Technician'} • {worker.locality || 'Koramangala'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{worker.averageRating || 4.8}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-stone-400 pt-2 border-t border-stone-700/50">
                <span>{worker.experienceYears || 3} yrs exp</span>
                <span className="text-emerald-400 font-semibold">{worker.totalJobsCompleted || 12} jobs done</span>
                <button
                  onClick={() => {
                    const prof = worker.profession || 'Electrician';
                    const matchServ = services.find(s => s.category.toLowerCase().includes(prof.toLowerCase()) || s.title.toLowerCase().includes(prof.toLowerCase())) || services[0];
                    setSelectedService(matchServ);
                    setSelectedWorker(worker);
                    setDispatchMode('MANUAL');
                    setBookingModalOpen(true);
                  }}
                  className="bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                >
                  Book Direct
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Booking History */}
      {myBookings.length > 0 && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-stone-100">Your Service Booking History</h3>
          <div className="space-y-3">
            {myBookings.map((b) => (
              <div key={b.id} className="bg-stone-800/40 border border-stone-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-stone-100 flex items-center gap-2">
                    <span>{b.service_title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-stone-400 text-[11px] mt-1">
                    Booking #{b.booking_number} • Worker Partner: {b.worker_name || 'FairDispatch Dispatched'}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-bold text-stone-100 text-sm">₹{b.total_amount}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      Payment: {b.payment_status}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedInvoiceBookingId(b.id)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-stone-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Receipt</span>
                  </button>

                  {b.status === 'COMPLETED' && !b.rating && (
                    <button
                      onClick={() => {
                        setFeedbackWorker({ id: b.id, name: b.worker_name || 'Partner', title: b.service_title });
                        setFeedbackModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-xl flex items-center space-x-1 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Rate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceBookingId && (
        <InvoiceModal
          bookingId={selectedInvoiceBookingId}
          onClose={() => setSelectedInvoiceBookingId(null)}
        />
      )}

      {/* Multi-Payment Modal */}
      {paymentModalOpen && activeBooking && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          amount={activeBooking.total_amount}
          serviceTitle={selectedService?.title || 'Coop Service'}
          workerName={activeBooking.worker_name || selectedWorker?.name || 'FairDispatch Partner'}
        />
      )}

      {/* Customer Feedback Modal */}
      {feedbackModalOpen && feedbackWorker && (
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
          workerName={feedbackWorker.name}
          serviceTitle={feedbackWorker.title}
        />
      )}

      {/* Booking Confirmation Wizard Modal */}
      {bookingModalOpen && selectedService && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-100">Confirm Service Dispatch</h3>
              <button onClick={() => setBookingModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <div className="bg-stone-800/60 border border-stone-700/80 p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-stone-100 text-sm">{selectedService.title}</div>
              <div className="text-stone-300">Service Location: {address}</div>
              <div className="text-emerald-400 font-bold text-sm pt-1">Total Fixed Price: ₹{selectedService.base_price}</div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Dispatch Mechanism Choice:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setDispatchMode('AUTO'); setSelectedWorker(null); }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    dispatchMode === 'AUTO'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                      : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto FairDispatch</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-normal">Optimal balance of distance, rating & opportunity score</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDispatchMode('MANUAL')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    dispatchMode === 'MANUAL'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                      : 'border-stone-800 bg-stone-800/40 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct Select Partner</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-normal">Pick specific verified partner directly</p>
                </button>
              </div>
            </div>

            {dispatchMode === 'MANUAL' && selectedWorker && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Selected Partner:</span>
                  <div className="font-bold text-emerald-400 text-sm">{selectedWorker.name}</div>
                  <div className="text-[10px] text-stone-300">{selectedWorker.profession} • {selectedWorker.locality}</div>
                </div>
                <div className="text-right text-[11px] text-stone-300">
                  ★ {selectedWorker.averageRating || 4.8}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreateBooking}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-emerald-900/20"
              >
                Proceed to Secure Payment
              </button>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-4 py-3 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

