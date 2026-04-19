import { createPublicServerClient, getBearerToken, sendJson } from '../_lib/supabase.js';
import { redisSetJson } from '../_lib/redis.js';
import { buildTicketQrPayload } from '../_lib/tickets.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return sendJson(res, 401, { error: 'Authentication required' });
    }

    const supabase = createPublicServerClient(accessToken);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return sendJson(res, 401, { error: authError?.message || 'Invalid session' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const eventId = body.eventId;

    if (!eventId) {
      return sendJson(res, 400, { error: 'eventId is required' });
    }

    const { error: claimError } = await supabase.rpc('claim_event_ticket', {
      target_event_id: eventId,
    });

    if (claimError) {
      return sendJson(res, 400, { error: claimError.message });
    }

    const { data: ticketRows, error: ticketError } = await supabase
      .from('event_tickets')
      .select('id, event_id, user_id, ticket_hash, status, created_at, scanned_at, events(title, venue, event_date)')
      .eq('event_id', eventId)
      .eq('user_id', authData.user.id)
      .limit(1);

    if (ticketError || !ticketRows?.[0]) {
      return sendJson(res, 500, { error: ticketError?.message || 'Ticket could not be loaded after claim' });
    }

    const rawTicket = ticketRows[0];
    const eventDetails = Array.isArray(rawTicket.events) ? rawTicket.events[0] || null : rawTicket.events || null;
    const qrPayload = buildTicketQrPayload(rawTicket.event_id, rawTicket.ticket_hash);

    await redisSetJson(
      `sphere:ticket:${rawTicket.ticket_hash}`,
      {
        eventId: rawTicket.event_id,
        userId: rawTicket.user_id,
        ticketHash: rawTicket.ticket_hash,
        status: rawTicket.status,
        title: eventDetails?.title || 'Event Ticket',
        venue: eventDetails?.venue || '',
        eventDate: eventDetails?.event_date || '',
      },
      60 * 60 * 24 * 30
    ).catch(() => null);

    return sendJson(res, 200, {
      ticket: {
        id: rawTicket.id,
        event_id: rawTicket.event_id,
        user_id: rawTicket.user_id,
        ticket_hash: rawTicket.ticket_hash,
        status: rawTicket.status,
        created_at: rawTicket.created_at,
        scanned_at: rawTicket.scanned_at,
        events: eventDetails,
      },
      qrPayload,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Ticket claim failed',
    });
  }
}
