import React, { useEffect, useState } from 'react';

export default function Mails() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loginWithGoogle = () => {
        window.location.href = 'http://localhost:4000/auth/google';
    };

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/emails', {
                    credentials: 'include'
                });

                if (res.status === 401) {
                    throw new Error('Not authenticated');
                }

                const data = await res.json();
                setEmails(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, []);

    if (loading) {
        return <p>Loading emails...</p>;
    }

    if (error) {
        return (
            <div>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={loginWithGoogle}>Login with Google</button>
            </div>
        );
    }

    if (!emails.length) {
        return <p>No emails found.</p>;
    }

    return (
        <div>
            <h2>Your Emails</h2>
            <table border="1" cellPadding="5" cellSpacing="0">
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
        </div>
    );
}
