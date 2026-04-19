import { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, QrCode, Ticket, Users } from 'lucide-react';
import QRCode from 'qrcode';
import type { Event, EventTicket } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { buildTicketQrPayload } from '../../lib/eventTickets';
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
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      void fetchWallet();
    }
  }, [profile?.id]);

  useEffect(() => {
    let active = true;

    async function generateCodes() {
      const entries = await Promise.all(
        wallet.map(async (ticket) => {
          const payload = ticket.qr_payload || buildTicketQrPayload(ticket.event_id, ticket.ticket_hash);
          const dataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 220,
            color: {
              dark: '#f8fafc',
              light: '#00000000',
            },
          });
          return [ticket.id, dataUrl] as const;
        })
      );

      if (active) {
        setQrCodes(Object.fromEntries(entries));
      }
    }

    if (wallet.length > 0) {
      void generateCodes();
    } else {
      setQrCodes({});
    }

    return () => {
      active = false;
    };
  }, [wallet]);

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
        qr_payload: buildTicketQrPayload(ticket.event_id, ticket.ticket_hash),
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

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      addToast({ type: 'error', title: 'Session Missing', message: 'Sign in again before claiming a ticket.' });
      setClaimingEventId(null);
      return;
    }

    const response = await fetch('/api/tickets/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ eventId }),
    });

    const payload = await response.json();

    if (!response.ok) {
      addToast({ type: 'error', title: 'Ticket Claim Failed', message: payload.error || 'Ticket claim could not be completed.' });
    } else {
      const claimedTicket = payload.ticket as EventTicket | undefined;
      addToast({
        type: 'success',
        title: 'Ticket Added to Wallet',
        message: claimedTicket?.ticket_hash
          ? `QR generated for ${claimedTicket.ticket_hash}.`
          : 'Your gate pass is ready. Show the QR to the operator at the venue.',
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
                    <div className="text-right">
                      <span
                        className="block text-[10px] uppercase tracking-[0.22em]"
                        style={{ color: ticket.status === 'used' ? '#fbbf24' : '#34d399' }}
                      >
                        {ticket.status}
                      </span>
                      <span className="block text-[10px] uppercase tracking-[0.22em] text-sky-300 mt-1">
                        Free
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[108px_1fr] gap-4 items-center">
                    <div
                      className="rounded-2xl p-2 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {qrCodes[ticket.id] ? (
                        <img
                          src={qrCodes[ticket.id]}
                          alt={`${ticket.events?.title || 'Event'} QR`}
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl border border-white/10 animate-pulse" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="rounded-xl px-3 py-2 font-mono text-sm text-sky-200 break-all" style={{ background: 'rgba(14,165,233,0.08)' }}>
                        {ticket.ticket_hash}
                      </div>
                      <p className="text-white/35 text-xs mt-2">
                        Present this QR at the gate. The operator scanner is locked to this event and validates only this ticket.
                      </p>
                    </div>
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
                    {claimingEventId === event.id ? 'Claiming...' : claim ? 'Claimed' : soldOut ? 'Sold Out' : 'Get Free Ticket'}
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
