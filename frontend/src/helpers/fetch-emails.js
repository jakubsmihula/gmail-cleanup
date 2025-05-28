const MAX_RESULTS = 50;

export async function fetchEmailsFromApi(pageToken, params) {
    let url = `http://localhost:4000/api/emails?&maxResults=${MAX_RESULTS}`;
    if(params.trashed) url += `&labelIds=TRASH`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const res = await fetch(url, { credentials: 'include' });

    if (res.status === 401) throw new Error('Not authenticated');

    return await res.json();
}
