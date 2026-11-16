// Server-only, deliberately NOT a 'use server' module: it reads every user's name and email.

import { connectToDatabase } from "@/database/mongoose";

// ADMIN_EMAILS is a comma-separated list. Unset means nobody is an admin.
export const isAdmin = (email: string | null | undefined, list = process.env.ADMIN_EMAILS) => {
    const wanted = email?.trim().toLowerCase();
    if (!wanted) return false;
    return (list ?? '').split(',').some((entry) => entry.trim().toLowerCase() === wanted);
};

export type SignupStats = {
    total: number;
    verified: number;
    last24h: number;
    last7d: number;
    last30d: number;
    countries: { country: string | null; count: number }[];
    latest: { id: string; name: string; email: string; country: string | null; verified: boolean; createdAt: Date | null }[];
};

const DAY = 86_400_000;

export const getSignupStats = async (now = Date.now()): Promise<SignupStats> => {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');
    const users = db.collection('user');
    const since = (days: number) => users.countDocuments({ createdAt: { $gte: new Date(now - days * DAY) } });

    const [total, verified, last24h, last7d, last30d, countries, latest] = await Promise.all([
        users.countDocuments(),
        users.countDocuments({ emailVerified: true }),
        since(1),
        since(7),
        since(30),
        users.aggregate<{ _id: string | null; count: number }>([
            // Missing and empty countries count together
            { $group: { _id: { $cond: [{ $in: [{ $ifNull: ['$country', ''] }, ['']] }, null, '$country'] }, count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 },
        ]).toArray(),
        users.find({}, { projection: { name: 1, email: 1, country: 1, emailVerified: 1, createdAt: 1 } })
            .sort({ createdAt: -1 }).limit(20).toArray(),
    ]);

    return {
        total, verified, last24h, last7d, last30d,
        countries: countries.map(({ _id, count }) => ({ country: _id, count })),
        latest: latest.map((user) => ({
            id: user._id.toString(),
            name: user.name ?? '',
            email: user.email ?? '',
            country: user.country || null,
            verified: user.emailVerified === true,
            createdAt: user.createdAt instanceof Date ? user.createdAt : null,
        })),
    };
};
