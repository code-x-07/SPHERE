export function buildTicketQrPayload(eventId, ticketHash) {
  return JSON.stringify({
    kind: 'sphere-ticket',
    version: 1,
    eventId,
    ticketHash: String(ticketHash).toUpperCase(),
  });
}

export function parseTicketQrPayload(rawValue) {
  try {
    const parsed = JSON.parse(rawValue);
    if (
      parsed?.kind === 'sphere-ticket' &&
      parsed?.version === 1 &&
      typeof parsed.eventId === 'string' &&
      typeof parsed.ticketHash === 'string'
    ) {
      return {
        eventId: parsed.eventId,
        ticketHash: parsed.ticketHash.toUpperCase(),
      };
    }
  } catch {
    // Not a JSON payload, will be treated as a plain hash.
  }

  return null;
}

export function normalizeTicketHash(rawValue) {
  return String(rawValue || '').trim().toUpperCase();
}
