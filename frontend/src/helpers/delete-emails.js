export async function deleteEmailsFromApi(emailIds) {
    const response = await fetch('http://localhost:4000/api/emails/delete', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailIds }),
    });

    if (!response.ok) {
        throw new Error('Failed to delete emails');
    }

    return response.json();
}