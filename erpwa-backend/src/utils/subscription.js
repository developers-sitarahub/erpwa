import prisma from "../prisma.js";

/**
 * Validates if a vendor can initiate a new conversation.
 * Throws an Error if the limit is exceeded.
 */
export async function enforceConversationLimit(vendorId) {
    const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { subscriptionPlan: true },
    });

    // If no plan is assigned, allow by default (safety fallback)
    if (!vendor || !vendor.subscriptionPlan) {
        return true;
    }

    const { conversationLimit, name } = vendor.subscriptionPlan;

    if (conversationLimit === -1) {
        return true; // Unlimited
    }

    const count = await prisma.conversation.count({
        where: {
            vendorId,
            initiatedBy: "vendor"
        }
    });

    if (count >= conversationLimit) {
        throw new Error(`Subscription limit reached. Your ${name} plan allows initiating up to ${conversationLimit} conversations.`);
    }

    return true;
}

/**
 * Validates if a vendor can have another template approved/submitted.
 * Throws an Error if the limit is exceeded.
 */
export async function enforceTemplateLimit(vendorId) {
    const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { subscriptionPlan: true },
    });

    if (!vendor || !vendor.subscriptionPlan) return true;

    const { templateLimit, name } = vendor.subscriptionPlan;

    if (templateLimit === -1) return true; // Unlimited

    // Only count active templates that occupy a slot
    const count = await prisma.template.count({
        where: {
            vendorId,
            status: {
                in: ["approved", "APPROVED", "pending", "PENDING", "ACTIVE", "active"]
            }
        }
    });

    if (count >= templateLimit) {
        throw new Error(`Subscription limit reached. Your ${name} plan allows up to ${templateLimit} approved templates.`);
    }

    return true;
}

/**
 * Check if limit is reached (returns boolean instead of throwing error)
 * Useful for sync logic to downgrade status gracefully.
 */
export async function hasTemplateLimitReached(vendorId) {
    try {
        await enforceTemplateLimit(vendorId);
        return false;
    } catch (error) {
        return true;
    }
}

/**
 * Validates if a vendor can add another team member.
 * Throws an Error if the limit is exceeded.
 */
export async function enforceTeamUsersLimit(vendorId) {
    const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { subscriptionPlan: true },
    });

    if (!vendor || !vendor.subscriptionPlan) return true;

    const { teamUsersLimit, name } = vendor.subscriptionPlan;

    if (teamUsersLimit === -1) return true; // Unlimited

    const count = await prisma.user.count({
        where: {
            vendorId,
            role: { not: "vendor_owner" }
        }
    });

    if (count >= teamUsersLimit) {
        throw new Error(`Subscription limit reached. Your ${name} plan allows up to ${teamUsersLimit} team members.`);
    }

    return true;
}

/**
 * Validates if a vendor can create another chatbot/workflow.
 * Throws an Error if the limit is exceeded.
 */
export async function enforceChatbotLimit(vendorId) {
    const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { subscriptionPlan: true },
    });

    if (!vendor) {
        throw new Error("Vendor not found.");
    }

    if (!vendor.subscriptionPlan) {
        throw new Error("No subscription plan assigned. Please contact support to activate your plan.");
    }

    const { chatbotLimit, name } = vendor.subscriptionPlan;

    if (chatbotLimit === -1) return true; // Unlimited

    const count = await prisma.workflow.count({
        where: { vendorId }
    });

    if (count >= chatbotLimit) {
        throw new Error(`Subscription limit reached. Your ${name} plan allows up to ${chatbotLimit} chatbot workflows.`);
    }

    return true;
}

/**
 * Check if chatbot limit is reached (returns boolean instead of throwing).
 */
export async function hasChatbotLimitReached(vendorId) {
    try {
        await enforceChatbotLimit(vendorId);
        return false;
    } catch (error) {
        return true;
    }
}

/**
 * Validates if a vendor can add more gallery items.
 * Throws an Error if the limit is exceeded.
 */
export async function enforceGalleryLimit(vendorId, amountToAdd = 1) {
    const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { subscriptionPlan: true },
    });

    if (!vendor) {
        throw new Error("Vendor not found.");
    }

    if (!vendor.subscriptionPlan) {
        throw new Error("No subscription plan assigned. Please contact support to activate your plan.");
    }

    const { galleryLimit, name } = vendor.subscriptionPlan;

    if (galleryLimit === -1) return true; // Unlimited

    const count = await prisma.galleryImage.count({
        where: { vendorId }
    });

    if (count + amountToAdd > galleryLimit) {
        const remaining = galleryLimit - count;
        if (remaining <= 0) {
            throw new Error(`Subscription limit reached. Your ${name} plan allows up to ${galleryLimit} gallery items.`);
        } else {
            throw new Error(`Limit exceeded. You can only add ${remaining} more item(s) on your ${name} plan.`);
        }
    }

    return true;
}

/**
 * Check if gallery limit is reached (returns boolean instead of throwing).
 */
export async function hasGalleryLimitReached(vendorId) {
    try {
        await enforceGalleryLimit(vendorId, 1);
        return false;
    } catch (error) {
        return true;
    }
}
