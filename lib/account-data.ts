import { connectToDatabase } from "@/database/mongoose";
import { alertModel } from "@/database/models/alert.model";
import { watchlistModel } from "@/database/models/watchlist.model";
import { watchlistListModel } from "@/database/models/watchlist-list.model";

// Everything the app keeps about a user outside better-auth's own collections (user, session, account).
// Runs before the user row goes (see `deleteUser.beforeDelete`): if this fails the account stays, so
// nothing is ever left behind without an owner. A new per-user collection must be added here.
export async function deleteUserData(userId: string) {
    if (!userId) throw new Error('deleteUserData needs a user id');
    const db = await connectToDatabase();
    await Promise.all([
        watchlistModel(db).deleteMany({ userId }),
        watchlistListModel(db).deleteMany({ userId }),
        alertModel(db).deleteMany({ userId }),
    ]);
}
