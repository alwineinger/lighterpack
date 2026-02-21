const apiRequest = (url, options) => fetchJson(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
        'Content-Type': 'application/json',
    },
    ...options,
});

export function loadSession() {
    return apiRequest('/api/v1/session', { method: 'GET' }).then((response) => response.data);
}

export function saveLibrary({ syncToken, library }) {
    return apiRequest('/api/v1/library', {
        method: 'PUT',
        body: JSON.stringify({ syncToken, library }),
    }).then((response) => response.data);
}

export function createShareExternalId(packId) {
    return apiRequest(`/api/v1/packs/${packId}/share`, {
        method: 'POST',
    }).then((response) => response.data);
}

export function loadTrips() {
    return apiRequest('/api/v1/trips', { method: 'GET' }).then((response) => response.data);
}

export function createTrip(name) {
    return apiRequest('/api/v1/trips', {
        method: 'POST',
        body: JSON.stringify({ name }),
    }).then((response) => response.data);
}

export function loadTrip(tripId) {
    return apiRequest(`/api/v1/trips/${tripId}`, { method: 'GET' }).then((response) => response.data);
}

export function inviteTripUser(tripId, payload) {
    return apiRequest(`/api/v1/trips/${tripId}/invitations`, {
        method: 'POST',
        body: JSON.stringify(payload),
    }).then((response) => response.data);
}

export function acceptTripInvitation(tripId, payload) {
    return apiRequest(`/api/v1/trips/${tripId}/accept`, {
        method: 'POST',
        body: JSON.stringify(payload),
    }).then((response) => response.data);
}

export function updateTripMemberList(tripId, payload) {
    return apiRequest(`/api/v1/trips/${tripId}/member-list`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }).then((response) => response.data);
}

export function updateTripNotes(tripId, notes) {
    return apiRequest(`/api/v1/trips/${tripId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
    }).then((response) => response.data);
}

export function updateTripName(tripId, name) {
    return apiRequest(`/api/v1/trips/${tripId}/name`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    }).then((response) => response.data);
}
