import React, { useEffect, useState, useRef } from 'react';
import { fetchEmailsFromApi } from './helpers/fetch-emails.js';

export default function Mails() {
    const [emails, setEmails] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const loadingRef = useRef(false);

    const login = () => {
        window.location.href = 'http://localhost:4000/auth/google';
    };

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/emails/summary', {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Failed to fetch email summary');
                const data = await res.json();
                setSummary(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchSummary();
    }, []);

    const fetchEmails = async (pageToken = null) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        try {
            const data = await fetchEmailsFromApi(pageToken, {});
            setEmails((prev) => [...prev, ...data.emails]);
            setNextPageToken(data.nextPageToken || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };

    // Initial load
    useEffect(() => {
        fetchEmails();
    }, []);

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const nearBottom =
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 200;
            if (nearBottom && nextPageToken) {
                fetchEmails(nextPageToken);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [nextPageToken]);

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
            <h2>Your Emails</h2>
            <p>Unread emails: {summary?.unreadEmails ?? 'Loading...'}</p>

            <table border="1" cellPadding="5">
                <thead>
                <tr>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {emails.map(({ id, from, subject, date }) => (
                    <tr key={id}>
                        <td>{from}</td>
                        <td>{subject}</td>
                        <td>{date}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {loading && <p>Loading more emails...</p>}
            {!nextPageToken && !loading && <p>No more emails</p>}
        </div>
    );
}
