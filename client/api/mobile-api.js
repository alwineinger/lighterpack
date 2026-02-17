const apiRequest = (url, options) => fetchJson(url, {
    credentials: 'same-origin',
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
