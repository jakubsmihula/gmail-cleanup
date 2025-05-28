import React, { useEffect, useState, useRef } from 'react';
import { fetchEmailsFromApi } from "./helpers/fetch-emails";

export default function Bin() {
    const [emails, setEmails] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadingRef = useRef(false); // prevent duplicate calls

    const login = () => {
        window.location.href = 'http://localhost:4000/auth/google';
    };

    const fetchEmails = (pageToken = null) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);

        const params = {
            trashed : true,
        }

        fetchEmailsFromApi(pageToken, params)
            .then(data => {
                setEmails(prev => [...prev, ...data.emails]);
                setNextPageToken(data.nextPageToken);
                setLoading(false);
                loadingRef.current = false;
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
                loadingRef.current = false;
            });
    };


    useEffect(() => {
        fetchEmails();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 200
                && nextPageToken
            ) {
                fetchEmails(nextPageToken);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [nextPageToken]);

    if (loading && emails.length === 0) return <p>Loading emails...</p>;

    if (error) return (
        <div>
            <p>{error}</p>
            <button onClick={login}>Login with Google</button>
        </div>
    );

    return (
        <div>
            <h2>Your Trashed Emails</h2>
            <table border="1" cellPadding="5">
                <thead>
                <tr><th>From</th><th>Subject</th><th>Date</th></tr>
                </thead>
                <tbody>
                {emails.map(email => (
                    <tr key={email.id}>
                        <td>{email.from}</td>
                        <td>{email.subject}</td>
                        <td>{email.date}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            {loading && <p>Loading more emails...</p>}
            {!nextPageToken && !loading && <p>No more emails</p>}
        </div>
    );
}
