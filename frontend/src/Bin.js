import React, { useEffect, useState, useRef } from 'react';
import { fetchEmailsFromApi } from './helpers/fetch-emails';
import { deleteEmailsFromApi } from './helpers/delete-emails';

export default function Bin() {
    const [emails, setEmails] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(new Set());

    const isLoading = useRef(false);

    // Redirects to login if not authenticated
    const login = () => {
        window.location.href = 'http://localhost:4000/auth/google';
    };

    // Fetch trashed emails (paginated)
    const fetchEmails = (token = null) => {
        if (isLoading.current) return;

        isLoading.current = true;
        setLoading(true);

        fetchEmailsFromApi(token, { trashed: true })
            .then(data => {
                setEmails(prev => [...prev, ...data.emails]);
                setNextPageToken(data.nextPageToken);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                isLoading.current = false;
                setLoading(false);
            });
    };

    // Initial fetch
    useEffect(() => {
        fetchEmails();
    }, []);

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
            if (nearBottom && nextPageToken) {
                fetchEmails(nextPageToken);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [nextPageToken]);

    // Toggle email selection
    const toggleSelect = (id) => {
        setSelected(prev => {
            const updated = new Set(prev);
            updated.has(id) ? updated.delete(id) : updated.add(id);
            return updated;
        });
    };

    // Delete selected emails
    const deleteSelected = async () => {
        try {
            const ids = [...selected];
            await deleteEmailsFromApi(ids);
            setEmails(prev => prev.filter(email => !selected.has(email.id)));
            setSelected(new Set());
        } catch (err) {
            alert('Error deleting selected emails: ' + err.message);
        }
    };

    // Delete all trashed emails
    const deleteAll = async () => {
        try {
            const ids = emails.map(email => email.id);
            await deleteEmailsFromApi(ids);
            setEmails([]);
            setSelected(new Set());
        } catch (err) {
            alert('Error deleting all emails: ' + err.message);
        }
    };

    if (loading && emails.length === 0) return <p>Loading emails...</p>;

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={login}>Login with Google</button>
            </div>
        );
    }

    return (
        <div>
            <h2>Trashed Emails</h2>

            <div style={{ marginBottom: '10px' }}>
                <button onClick={deleteSelected} disabled={selected.size === 0}>
                    Delete Checked
                </button>
                <button onClick={deleteAll} style={{ marginLeft: '10px' }}>
                    Delete All
                </button>
            </div>

            <table border="1" cellPadding="5">
                <thead>
                <tr>
                    <th>Check</th>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {emails.map(email => (
                    <tr key={email.id}>
                        <td>
                            <input
                                type="checkbox"
                                checked={selected.has(email.id)}
                                onChange={() => toggleSelect(email.id)}
                            />
                        </td>
                        <td>{email.from}</td>
                        <td>{email.subject}</td>
                        <td>{email.date}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {loading && <p>Loading more emails...</p>}
            {!loading && !nextPageToken && <p>No more emails</p>}
        </div>
    );
}
