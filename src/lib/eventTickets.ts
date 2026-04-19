export interface TicketQrPayload {
  kind: 'sphere-ticket';
  version: 1;
  eventId: string;
  ticketHash: string;
}

export function buildTicketQrPayload(eventId: string, ticketHash: string): string {
  const payload: TicketQrPayload = {
    kind: 'sphere-ticket',
    version: 1,
    eventId,
    ticketHash: ticketHash.toUpperCase(),
  };

  return JSON.stringify(payload);
}

export function parseTicketQrPayload(value: string): TicketQrPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<TicketQrPayload>;
    if (
      parsed.kind === 'sphere-ticket' &&
      parsed.version === 1 &&
      typeof parsed.eventId === 'string' &&
      typeof parsed.ticketHash === 'string'
    ) {
      return {
        kind: 'sphere-ticket',
        version: 1,
        eventId: parsed.eventId,
        ticketHash: parsed.ticketHash.toUpperCase(),
      };
    }
  } catch {
    // Ignore non-JSON QR payloads and allow hash fallback.
  }

  return null;
}

export function normalizeTicketHash(value: string): string {
  return value.trim().toUpperCase();
}
