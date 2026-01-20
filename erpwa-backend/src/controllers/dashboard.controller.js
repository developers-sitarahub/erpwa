import prisma from "../prisma.js";

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
    try {
        const vendorId = req.user.vendorId;

        // Get counts in parallel
        const [
            teamCount,
            leadsCount,
            templatesCount,
            campaignsCount,
            leadsStatusCount,
        ] = await Promise.all([
            // Team members count
            prisma.user.count({
                where: { vendorId },
            }),

            // Total leads count
            prisma.lead.count({
                where: { vendorId },
            }),

            // Templates count
            prisma.template.count({
                where: { vendorId },
            }),

            // Campaigns count
            prisma.campaign.count({
                where: { vendorId },
            }),

            // Leads by status
            prisma.lead.groupBy({
                by: ["status"],
                where: { vendorId },
                _count: {
                    status: true,
                },
            }),
        ]);

        // Calculate conversion rate (converted / total)
        const convertedLeads = leadsStatusCount.find((s) => s.status === "converted")?._count.status || 0;
        const conversionRate = leadsCount > 0 ? Math.round((convertedLeads / leadsCount) * 100) : 0;

        // Get recent lead activities (last 10)
        const recentLeadActivities = await prisma.lead.findMany({
            where: { vendorId },
            select: {
                id: true,
                companyName: true,
                status: true,
                salesPersonName: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 10,
        });

        // Format activities
        const activities = recentLeadActivities.map((lead) => ({
            id: lead.id,
            member: lead.salesPersonName || "System",
            action: `Updated lead: ${lead.companyName} - Status: ${lead.status}`,
            time: formatTimeAgo(new Date(lead.updatedAt)),
        }));

        // Prepare status breakdown
        const statusBreakdown = leadsStatusCount.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
        }, {});

        res.json({
            stats: {
                teamMembers: teamCount,
                totalLeads: leadsCount,
                templates: templatesCount,
                campaigns: campaignsCount,
                conversionRate: `${conversionRate}%`,
                statusBreakdown,
            },
            recentActivities: activities,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
};

// Helper function to format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
        }
    }

    return "Just now";
}
