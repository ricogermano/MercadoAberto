import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { alertsEnabled } from "@/lib/market-data";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts, checkInactiveUsers } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    // Price alerts only work in realtime mode, so the checker only runs where they are on
    functions: [sendSignUpEmail, sendWeeklyNewsSummary, checkInactiveUsers, ...(alertsEnabled ? [checkStockAlerts] : [])],
})