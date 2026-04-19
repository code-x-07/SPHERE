import { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, QrCode, Ticket, Users } from 'lucide-react';
import type { Event, EventTicket } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import HeroSlider3D from '../3d/HeroSlider3D';
import GlassCard from '../ui/GlassCard';
import MagneticButton from '../ui/MagneticButton';

interface EventCustomerViewProps {
  events: Event[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function EventCustomerView({ events, loading, onRefresh }: EventCustomerViewProps) {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();
  const [wallet, setWallet] = useState<EventTicket[]>([]);
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      void fetchWallet();
    }
  }, [profile?.id]);

  async function fetchWallet() {
    if (!profile) return;

    setWalletLoading(true);

    const { data, error } = await supabase
      .from('event_tickets')
      .select('id, event_id, user_id, ticket_hash, status, created_at, scanned_at, events(title, venue, event_date)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      addToast({ type: 'error', title: 'Wallet Load Failed', message: error.message });
    } else {
      const normalized = ((data || []) as Array<EventTicket & { events?: EventTicket['events'][] }>).map((ticket) => ({
        ...ticket,
        events: Array.isArray(ticket.events) ? ticket.events[0] || null : ticket.events || null,
      }));
      setWallet(normalized);
    }

    setWalletLoading(false);
  }

  const claimedTickets = useMemo(
    () => new Map(wallet.map((ticket) => [ticket.event_id, ticket])),
    [wallet]
  );

  async function handleClaim(eventId: string) {
    setClaimingEventId(eventId);

    const { error } = await supabase.rpc('claim_event_ticket', {
      target_event_id: eventId,
    });

    if (error) {
      addToast({ type: 'error', title: 'Ticket Claim Failed', message: error.message });
    } else {
      addToast({
        type: 'success',
        title: 'Ticket Added to Wallet',
        message: 'Your gate pass is ready. Show the code to the operator at the venue.',
      });
      await Promise.all([fetchWallet(), onRefresh()]);
    }

    setClaimingEventId(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <GlassCard className="overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white text-lg font-semibold">Customer Discovery</p>
              <p className="text-white/40 text-sm mt-1">Explore campus events and reserve your entry pass.</p>
            </div>
            <span className="text-white/25 text-xs uppercase tracking-[0.22em]">Events</span>
          </div>
          {loading ? (
            <div className="h-[460px] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <HeroSlider3D events={events} />
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={16} className="text-sky-300" />
            <p className="text-white font-semibold">My Wallet</p>
          </div>

          {walletLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
            </div>
          ) : wallet.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-white font-semibold">No tickets claimed yet</p>
              <p className="text-white/40 text-sm mt-2">Reserve any event below and the access code will appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{ticket.events?.title || 'Event Ticket'}</p>
                      <p className="text-white/35 text-xs mt-1">{ticket.events?.venue || 'Campus Venue'}</p>
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{ color: ticket.status === 'used' ? '#fbbf24' : '#34d399' }}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl px-3 py-2 font-mono text-sm text-sky-200" style={{ background: 'rgba(14,165,233,0.08)' }}>
                    {ticket.ticket_hash}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((event) => {
          const claim = claimedTickets.get(event.id);
          const seatsLeft = Math.max(0, event.capacity - event.registered);
          const soldOut = seatsLeft === 0 && !claim;

          return (
            <GlassCard key={event.id} className="h-full">
              <div className="flex items-center justify-between gap-3">
                <p className="text-white text-lg font-semibold leading-tight">{event.title}</p>
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/30">Customer</span>
              </div>
              <p className="text-white/45 text-sm mt-2 line-clamp-3">{event.description}</p>

              <div className="space-y-2 mt-4 text-sm text-white/45">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-sky-300" />
                  <span>{new Date(event.event_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-sky-300" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-sky-300" />
                  <span>{event.registered}/{event.capacity} seats taken</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{claim ? 'Ticket already claimed' : `${seatsLeft} seats left`}</p>
                  <p className="text-white/35 text-xs mt-1">
                    {claim ? `Wallet code: ${claim.ticket_hash}` : 'Claim one gate pass per event.'}
                  </p>
                </div>
                <MagneticButton
                  size="sm"
                  disabled={Boolean(claim) || soldOut || claimingEventId === event.id}
                  onClick={() => handleClaim(event.id)}
                >
                  <span className="flex items-center gap-2">
                    <QrCode size={14} />
                    {claimingEventId === event.id ? 'Claiming...' : claim ? 'Claimed' : soldOut ? 'Sold Out' : 'Claim Ticket'}
                  </span>
                </MagneticButton>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
