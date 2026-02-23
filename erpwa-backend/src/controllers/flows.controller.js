import prisma from '../prisma.js';
import flowsService from '../services/flows.service.js';
import { decrypt, encrypt } from '../utils/encryption.js';
import 'dotenv/config';
import crypto from 'crypto';
import axios from 'axios';

/**
 * WhatsApp Flows Controller
 * Handles all Flow management operations
 */

/**
 * Get all Flows for a vendor
 */
/**
 * Helper: Sanitize Flow JSON to match Meta V6.0 requirements
 */
const sanitizeFlowJson = (json) => {
    try {
        if (!json) return json;
        const data = typeof json === 'string' ? JSON.parse(json) : json;

        if (data.screens) {
            data.screens.forEach(screen => {
                const processChildren = (children) => {
                    if (!children || !Array.isArray(children)) return;
                    children.forEach(child => {
                        // Meta V6.0 Distinction:
                        // RadioButtons -> RadioButtonsGroup
                        // Choice components -> data-source
                        if (['Dropdown', 'RadioButtons', 'RadioButtonsGroup', 'CheckboxGroup'].includes(child.type)) {
                            if (child.type === 'RadioButtons') child.type = 'RadioButtonsGroup';
                            
                            const val = child.options || child['data-source'];
                            child['data-source'] = val;
                            delete child.options;
                        }
                        
                        // Fix initial value naming (V6.0 strictly requires underscore)
                        if (child['initial-value'] !== undefined) {
                            child.initial_value = child['initial-value'];
                            delete child['initial-value'];
                        }

                        // Sanitize component names (allow numbers, ensure lowercase)
                        if (child.name) {
                            child.name = child.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
                            if (!/^[a-z]/.test(child.name)) {
                                child.name = 'f_' + child.name;
                            }
                        }
                        
                        if (child.children) {
                            processChildren(child.children);
                        }
                    });
                };

                if (screen.layout && screen.layout.children) {
                    processChildren(screen.layout.children);
                }
            });
        }

        return JSON.stringify(data, null, 2);
    } catch (e) {
        console.warn('❌ Sanitization failed:', e.message);
        return json;
    }
};

/**
 * Helper: Delete all templates associated with a flow
 * @param {string} flowId - Database Flow ID
 * @param {string} vendorId - Vendor ID
 * @param {string} accessToken - Meta access token
 * @param {string} wabaId - WhatsApp Business Account ID
 */
const deleteFlowTemplates = async (flowId, vendorId, accessToken, wabaId) => {
    try {
        console.log(`🧹 Cleaning up templates associated with Flow: ${flowId}`);
        
        // Find all templates that either reference this flow ID directly 
        // OR have a button that references this flow
        const templates = await prisma.template.findMany({
            where: { 
                vendorId,
                OR: [
                    { flowId: flowId },
                    { buttons: { some: { flowId: flowId } } }
                ]
            }
        });

        if (templates.length === 0) {
            console.log('No associated templates found to delete.');
            return;
        }

        console.log(`Found ${templates.length} templates to delete`);

        for (const template of templates) {
            // 1. Delete from Meta if not draft
            if (template.status !== 'draft') {
                try {
                    console.log(`🗑️ Deleting template "${template.metaTemplateName}" from Meta`);
                    // Use the same version as in FlowsService
                    await axios.delete(
                        `https://graph.facebook.com/v21.0/${wabaId}/message_templates?name=${template.metaTemplateName}`,
                        {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }
                    );
                } catch (metaError) {
                    console.warn(`⚠️ Failed to delete template "${template.metaTemplateName}" from Meta:`, 
                        metaError.response?.data?.error?.message || metaError.message);
                }
            }

            // 2. Clear templateId in campaigns to avoid foreign key errors
            await prisma.campaign.updateMany({
                where: { templateId: template.id },
                data: { templateId: null }
            });

            // 3. Delete from local DB (cascades to buttons, languages, media)
            await prisma.template.delete({
                where: { id: template.id }
            });
            console.log(`✅ Deleted template locally: ${template.metaTemplateName}`);
        }
    } catch (error) {
        console.error('❌ Error in deleteFlowTemplates helper:', error);
    }
};

export const getFlows = async (req, res) => {
    try {
        const { vendorId } = req.user;

        const flows = await prisma.whatsAppFlow.findMany({
            where: { vendorId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        responses: true
                    }
                }
            }
        });

        // Calculate template usage counts for each flow
        const enrichedFlows = await Promise.all(flows.map(async (flow) => {
            const templateCount = await prisma.templateButton.count({
                where: { flowId: flow.id }
            });
            return {
                ...flow,
                _count: {
                    ...flow._count,
                    templates: templateCount
                }
            };
        }));

        res.json({ success: true, flows: enrichedFlows });
    } catch (error) {
        console.error('Error fetching Flows:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get a single Flow by ID
 */
export const getFlowById = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id } = req.params;

        const flow = await prisma.whatsAppFlow.findFirst({
            where: { id, vendorId },
            include: {
                _count: {
                    select: {
                        responses: true
                    }
                }
            }
        });

        if (!flow) {
            return res.status(404).json({ success: false, message: 'Flow not found' });
        }

        // Count templates using this flow via buttons
        const templateCount = await prisma.templateButton.count({
            where: { flowId: id }
        });

        const flowWithCount = {
            ...flow,
            validationErrors: [], // Placeholder, populated below if possible
            _count: {
                ...flow._count,
                templates: templateCount
            }
        };

        // Try to fetch validation errors from Meta
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { id: vendorId },
                select: { whatsappAccessToken: true }
            });
            if (vendor) {
                const accessToken = decrypt(vendor.whatsappAccessToken);
                // We use our service to get errors
                // Note: This adds latency, but vital for debugging
                const errors = await flowsService.getValidationErrors(flow.metaFlowId, accessToken);
                flowWithCount.validationErrors = errors;
            }
        } catch (err) {
            // Ignore token errors, just return flow
        }

        res.json({ success: true, flow: flowWithCount });
    } catch (error) {
        console.error('Error fetching Flow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new Flow
 */
export const createFlow = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { name, category, flowJson, endpointUri } = req.body;

        // Validate required fields
        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name and category are required'
            });
        }

        // Get vendor's WhatsApp credentials
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            select: {
                whatsappBusinessId: true,
                whatsappAccessToken: true
            }
        });

        if (!vendor.whatsappBusinessId || !vendor.whatsappAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp Business Account not configured'
            });
        }

        // Decrypt the access token
        const accessToken = decrypt(vendor.whatsappAccessToken);

        // Create Flow in Meta's system
        const metaFlow = await flowsService.createFlow(
            vendor.whatsappBusinessId,
            name,
            [category.toUpperCase()],
            accessToken
        );

        // If Flow JSON is provided, update it
        const sanitizedJson = sanitizeFlowJson(flowJson);
        if (flowJson) {
            await flowsService.updateFlowJSON(
                metaFlow.id,
                sanitizedJson,
                accessToken
            );
        }

        const newFlow = await prisma.whatsAppFlow.create({
            data: {
                vendorId: vendorId,
                metaFlowId: metaFlow.id,
                name: name,
                category: category,
                status: 'DRAFT',
                flowJson: sanitizedJson || {},
                endpointUri
            }
        });

        res.json({ success: true, flow: newFlow });
    } catch (error) {
        console.error('Error creating Flow:', error);

        let message = error.message;
        try {
            // Try to parse Meta error message
            const metaError = JSON.parse(error.message);
            if (metaError.error_user_msg) {
                message = metaError.error_user_msg;
            } else if (metaError.message) {
                message = metaError.message;
            }
        } catch (e) {
            // Not a JSON error, use original message
        }

        res.status(500).json({ success: false, message });
    }
};

/**
 * Update a Flow
 */
export const updateFlow = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id } = req.params;
        const { name, category, flowJson, endpointUri } = req.body;

        // Check if Flow exists and belongs to vendor
        const existingFlow = await prisma.whatsAppFlow.findFirst({
            where: { id, vendorId }
        });

        if (!existingFlow) {
            return res.status(404).json({ success: false, message: 'Flow not found' });
        }

        // Get vendor credentials
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            select: { whatsappAccessToken: true }
        });

        const accessToken = decrypt(vendor.whatsappAccessToken);

        // Update Flow JSON in Meta if provided
        const sanitizedJson = sanitizeFlowJson(flowJson);
        if (flowJson) {
            const data = typeof sanitizedJson === 'string' ? JSON.parse(sanitizedJson) : sanitizedJson;
            const screenCount = data.screens ? data.screens.length : 0;
            console.log(`📝 Updating Flow JSON with ${screenCount} screens`);
            console.log(`Screen IDs:`, data.screens?.map(s => s.id) || []);

            await flowsService.updateFlowJSON(
                existingFlow.metaFlowId,
                sanitizedJson,
                accessToken
            );
        }

        // Update Flow Metadata (Endpoint URI, Categories) in Meta if provided
        if (endpointUri !== undefined || category) {
            const updates = {};
            if (endpointUri !== undefined) updates.endpoint_uri = endpointUri;

            // Meta expects categories as array
            if (category) updates.categories = [category.toUpperCase()]; // Ensure format

            if (Object.keys(updates).length > 0) {
                await flowsService.updateFlowMetadata(
                    existingFlow.metaFlowId,
                    updates,
                    accessToken
                );
            }
        }

        // Update in database
        const flow = await prisma.whatsAppFlow.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(category && { category }),
                flowJson: sanitizedJson,
                ...(endpointUri !== undefined && { endpointUri }),
                status: 'DRAFT'
            }
        });

        res.json({ success: true, flow });
    } catch (error) {
        console.error('Error updating Flow:', error);
        
        // Fetch detailed validation errors if possible
        let validationErrors = [];
        let message = error.message;

        try {
            // Try to parse Meta error message
            const metaError = JSON.parse(error.message);
            if (metaError.error_user_msg) {
                message = metaError.error_user_msg;
            } else if (metaError.message) {
                message = metaError.message;
            }
            
            // If it's a validation error, try to get specific errors
            if (metaError.code === 100 || message.includes('validation')) {
                const { vendorId } = req.user;
                const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { whatsappAccessToken: true } });
                const existingFlow = await prisma.whatsAppFlow.findFirst({ where: { id: req.params.id } });
                if (vendor && existingFlow) {
                    const accessToken = decrypt(vendor.whatsappAccessToken);
                    validationErrors = await flowsService.getValidationErrors(existingFlow.metaFlowId, accessToken);
                }
            }
        } catch (e) { /* Ignore parsing errors */ }

        res.status(500).json({ 
            success: false, 
            message: message,
            validationErrors 
        });
    }
};

/**
 * Publish a Flow
 */
/**
 * Publish a Flow
 */
export const publishFlow = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id } = req.params;

        // Check if Flow exists
        const flow = await prisma.whatsAppFlow.findFirst({
            where: { id, vendorId }
        });

        if (!flow) {
            return res.status(404).json({ success: false, message: 'Flow not found' });
        }

        if (flow.status === 'PUBLISHED') {
            return res.status(400).json({
                success: false,
                message: 'Flow is already published'
            });
        }

        // Get vendor credentials (including fields needed for security setup)
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            select: {
                whatsappAccessToken: true,
                whatsappPhoneNumberId: true,
                whatsappBusinessId: true,
                whatsappFlowsPrivateKey: true
            }
        });

        const accessToken = decrypt(vendor.whatsappAccessToken);

        // --- AUTOMATIC SECURITY SETUP START ---
        // Check if flow encryption is configured. If not, auto-generate and upload.
        if (!vendor.whatsappFlowsPrivateKey) {
            console.log("🔐 Encryption keys missing. Auto-generating for Publish...");

            try {
                // 1. Generate RSA Key Pair (2048 bit)
                const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                    modulusLength: 2048,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem'
                    }
                });

                // 2. Upload Public Key to Meta
                await flowsService.updatePublicKey(
                    vendor.whatsappPhoneNumberId,
                    publicKey,
                    accessToken
                );

                // 3. Save to Database
                await prisma.vendor.update({
                    where: { id: vendorId },
                    data: {
                        whatsappFlowsPublicKey: publicKey,
                        whatsappFlowsPrivateKey: encrypt(privateKey)
                    }
                });

                console.log("✅ Auto-setup Security Complete: Keys generated and uploaded.");

            } catch (secError) {
                console.error("❌ Auto-setup Security Failed:", secError);
                return res.status(500).json({
                    success: false,
                    message: `Failed to auto-configure security keys: ${secError.message}. Please try 'Setup Security' manually.`
                });
            }
        }
        // --- AUTOMATIC SECURITY SETUP END ---

        // Ensure 'endpoint_uri' is set on Meta before publishing
        let finalEndpointUri = flow.endpointUri;

        // Auto-detect and FORCE update Endpoint URI if META_OAUTH_REDIRECT_URI is provided
        // This ensures ngrok changes are automatically synced to Meta during publish
        if (process.env.META_OAUTH_REDIRECT_URI) {
            try {
                const baseUrl = new URL(process.env.META_OAUTH_REDIRECT_URI).origin;
                const detectedUri = `${baseUrl}/api/whatsapp/flows/endpoint`;
                
                // If the detected URI is different from what's in DB, or DB is empty, use the detected one
                if (detectedUri !== finalEndpointUri) {
                    console.log(`� Endpoint URI change detected!`);
                    console.log(`   Old: ${finalEndpointUri}`);
                    console.log(`   New: ${detectedUri}`);
                    finalEndpointUri = detectedUri;

                    // Save to DB to persist this setting
                    await prisma.whatsAppFlow.update({
                        where: { id },
                        data: { endpointUri: finalEndpointUri }
                    });
                }
            } catch (uriErr) {
                console.warn("⚠️ Could not resolve endpoint URI from .env:", uriErr.message);
            }
        }

        if (finalEndpointUri) {
            console.log(`📍 Testing Endpoint URI locally: ${finalEndpointUri}`);
            
            // Self-check: Try to ping the endpoint from the server itself
            try {
                const checkRes = await axios.get(finalEndpointUri, { 
                    timeout: 5000,
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                console.log(`✅ Endpoint self-check successful: ${checkRes.status} ${checkRes.data}`);
            } catch (checkErr) {
                console.warn(`⚠️ Endpoint self-check failed! Meta will likely reject this. URL: ${finalEndpointUri}. Error: ${checkErr.message}`);
                // We show this in logs but continue, in case it's a loopback/DNS issue that Meta can still bypass
            }

            try {
                await flowsService.updateFlowMetadata(
                    flow.metaFlowId,
                    { endpoint_uri: finalEndpointUri },
                    accessToken
                );
            } catch (metaUpdateErr) {
                console.warn("Failed to sync endpoint_uri before publish:", metaUpdateErr.message);
            }
        } else if (flow.flowJson && /"version"\s*:\s*"[3-6]\.\d"/.test(typeof flow.flowJson === 'string' ? flow.flowJson : JSON.stringify(flow.flowJson))) {
            // Logic for v3+ where endpointUri might be managed externally or implicitly via simple endpoint settings
            // If we rely on the global endpoint setting, we might need to ensure it's set.
            // But usually, it's safer to have it in the DB or auto-detected above.
            // For now, we allow it to pass if it's V3/4/5 (user requested no strict check).
        } else {
            // Strict check for V2 flows
            return res.status(400).json({
                success: false,
                message: 'Endpoint URI is missing. Please Edit the Flow and set the "Endpoint URI" before publishing.'
            });
        }

        // One last sanitization before publish
        const sanitizedJson = sanitizeFlowJson(flow.flowJson);
        if (sanitizedJson !== (typeof flow.flowJson === 'string' ? flow.flowJson : JSON.stringify(flow.flowJson))) {
            console.log("🛠️ Applying final JSON fixes before publish...");
            await flowsService.updateFlowJSON(flow.metaFlowId, sanitizedJson, accessToken);
            await prisma.whatsAppFlow.update({ where: { id }, data: { flowJson: sanitizedJson } });
        }

        // Publish in Meta
        await flowsService.publishFlow(flow.metaFlowId, accessToken);

        // Update status in database
        const updatedFlow = await prisma.whatsAppFlow.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date()
            }
        });

        res.json({ success: true, flow: updatedFlow });
    } catch (error) {
        console.error('Error publishing Flow:', error);

        // Fetch detailed validation errors if it's a validation issue
        let validationErrors = [];
        try {
            // Need to get access token again (or reuse if available, but fetch fresh for safety catch block)
            const { vendorId } = req.user;
            const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { whatsappAccessToken: true } });
            if (vendor) {
                const accessToken = decrypt(vendor.whatsappAccessToken);
                const existingFlow = await prisma.whatsAppFlow.findFirst({ where: { id: req.params.id } });
                if (existingFlow) {
                    validationErrors = await flowsService.getValidationErrors(existingFlow.metaFlowId, accessToken);
                }
            }
        } catch (err) { console.error('Failed to get validation errors:', err); }

        // DIAGNOSTIC ERROR MESSAGE
        const envStatus = process.env.META_OAUTH_REDIRECT_URI ? "Loaded" : "Missing";
        // We can't easily access finalEndpointUri here due to scope, but we know if env loaded.

        res.status(500).json({
            success: false,
            message: `Publish Failed details: ${error.message}. [Env: ${envStatus}]`,
            validationErrors
        });
    }
};

/**
 * Deprecate a Flow
 */
export const deprecateFlow = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id } = req.params;

        // Check if Flow exists
        const flow = await prisma.whatsAppFlow.findFirst({
            where: { id, vendorId }
        });

        if (!flow) {
            return res.status(404).json({ success: false, message: 'Flow not found' });
        }

        // Get vendor credentials
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            select: { 
                whatsappAccessToken: true,
                whatsappBusinessId: true 
            }
        });

        const accessToken = decrypt(vendor.whatsappAccessToken);

        // Deprecate in Meta
        await flowsService.deprecateFlow(flow.metaFlowId, accessToken);

        // --- NEW: Delete associated templates ---
        // Deprecated flows can still be used but user requested cascaded deletion for cleanliness
        await deleteFlowTemplates(id, vendorId, accessToken, vendor.whatsappBusinessId);

        // Update status in database
        const updatedFlow = await prisma.whatsAppFlow.update({
            where: { id },
            data: {
                status: 'DEPRECATED',
                deprecatedAt: new Date()
            }
        });

        res.json({ success: true, flow: updatedFlow });
    } catch (error) {
        console.error('Error deprecating Flow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a Flow
 */
export const deleteFlow = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id } = req.params;
        const { deleteResponses } = req.query;

        // Check if Flow exists
        const flow = await prisma.whatsAppFlow.findFirst({
            where: { id, vendorId }
        });

        if (!flow) {
            return res.status(404).json({ success: false, message: 'Flow not found' });
        }

        // Get vendor credentials
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            select: { 
                whatsappAccessToken: true,
                whatsappBusinessId: true 
            }
        });

        const accessToken = decrypt(vendor.whatsappAccessToken);

        // --- NEW: Delete associated templates ---
        // Templates MUST be deleted before the Flow itself in some Meta scenarios, 
        // but locally we definitely want them gone.
        await deleteFlowTemplates(id, vendorId, accessToken, vendor.whatsappBusinessId);

        // Delete or Deprecate from Meta
        try {
            if (flow.status === 'PUBLISHED' || flow.status === 'DEPRECATED') {
                await flowsService.deprecateFlow(flow.metaFlowId, accessToken);
            } else {
                await flowsService.deleteFlow(flow.metaFlowId, accessToken);
            }
        } catch (error) {
            console.warn('Warning: Failed to fully delete/deprecate Flow from Meta, but will remove from database:', error.message);
        }
        // Optional: Delete associate responses
        if (deleteResponses === 'true') {
            const deleteResCount = await prisma.flowResponse.deleteMany({
                where: { flowId: id }
            });
            console.log(`Deleted ${deleteResCount.count} responses for Flow ${id}`);
        }

        // Delete from database
        await prisma.whatsAppFlow.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Flow deleted successfully' });
    } catch (error) {
        console.error('Error deleting Flow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Flow Responses
 */
export const getFlowResponses = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id: flowId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        // Build query
        const where = {
            conversation: {
                vendorId
            }
        };

        // If specific flow ID provided (not 'all'), verify and filter
        if (flowId !== 'all') {
            // Verify Flow belongs to vendor
            const flow = await prisma.whatsAppFlow.findFirst({
                where: { id: flowId, vendorId }
            });

            if (!flow) {
                return res.status(404).json({ success: false, message: 'Flow not found' });
            }
            where.flowId = flowId;
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        // Get total count
        const total = await prisma.flowResponse.count({ where });

        // Get responses with pagination
        const responses = await prisma.flowResponse.findMany({
            where,
            include: {
                flow: {
                    select: { name: true, category: true }
                },
                conversation: {
                    include: {
                        lead: {
                            select: {
                                companyName: true,
                                phoneNumber: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        res.json({
            success: true,
            responses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching Flow responses:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a Flow Response
 */
export const deleteFlowResponse = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id: flowId, responseId } = req.params;

        // Create query object
        const where = {
            id: responseId,
            conversation: {
                vendorId: vendorId // Directly check vendor ID on conversation
            }
        };

        // If specific flow ID is provided (not 'all'), verify it matches
        if (flowId !== 'all') {
            where.flowId = flowId;
        }

        // Verify Flow Response and find it
        const response = await prisma.flowResponse.findFirst({
            where: where
        });

        if (!response) {
            return res.status(404).json({ success: false, message: 'Response not found or access denied' });
        }

        // Delete response
        await prisma.flowResponse.delete({
            where: { id: responseId }
        });

        res.json({ success: true, message: 'Response deleted successfully' });
    } catch (error) {
        console.error('Error deleting Flow response:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};



/**
 * Get Flow metrics/analytics
 */
export const getFlowMetrics = async (req, res) => {
    try {
        const { vendorId } = req.user;
        const { id } = req.params;

        // Verify specific flow logic
        if (id !== 'all') {
            const flow = await prisma.whatsAppFlow.findFirst({
                where: { id, vendorId }
            });

            if (!flow) {
                return res.status(404).json({ success: false, message: 'Flow not found' });
            }
        }

        // Build shared where clause
        const where = {
            conversation: { vendorId }
        };
        if (id !== 'all') where.flowId = id;

        // Get local metrics from database
        const responses = await prisma.flowResponse.groupBy({
            by: ['status'],
            where,
            _count: true
        });

        const totalResponses = await prisma.flowResponse.count({
            where
        });

        const completedResponses = await prisma.flowResponse.count({
            where: { ...where, status: 'completed' }
        });

        const metrics = {
            totalResponses,
            completedResponses,
            abandonedResponses: totalResponses - completedResponses,
            completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
            statusBreakdown: responses
        };

        // Try to get Meta metrics (if available)
        try {
            const vendor = await prisma.vendor.findUnique({
                where: { id: vendorId },
                select: { whatsappAccessToken: true }
            });

            const accessToken = decrypt(vendor.whatsappAccessToken);

            // const metaMetrics = await flowsService.getFlowMetrics(
            //     flow.metaFlowId,
            //     accessToken
            // );

            // if (metaMetrics) {
            //     metrics.meta = metaMetrics;
            // }
        } catch (error) {
            console.warn('Could not fetch Meta metrics:', error.message);
        }

        res.json({ success: true, metrics });
    } catch (error) {
        console.error('Error fetching Flow metrics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Flow responses (user submissions)
 */

/**
 * Setup Flow Encryption (Generate Keys and Upload to Meta)
 */
export const setupFlowsEncryption = async (req, res) => {
    try {
        const { vendorId } = req.user;

        // Get vendor credentials
        const vendor = await prisma.vendor.findUnique({
            where: { id: vendorId },
            select: {
                whatsappBusinessId: true,
                whatsappPhoneNumberId: true,
                whatsappAccessToken: true
            }
        });

        if (!vendor.whatsappBusinessId || !vendor.whatsappAccessToken || !vendor.whatsappPhoneNumberId) {
            return res.status(400).json({ success: false, message: 'WhatsApp not configured fully' });
        }

        const accessToken = decrypt(vendor.whatsappAccessToken);

        // 1. Generate RSA Key Pair (2048 bit)
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        // 2. Upload Public Key to Meta

        await flowsService.updatePublicKey(
            vendor.whatsappPhoneNumberId,
            publicKey,
            accessToken
        );

        // 3. Save to Database
        await prisma.vendor.update({
            where: { id: vendorId },
            data: {
                whatsappFlowsPublicKey: publicKey,
                whatsappFlowsPrivateKey: encrypt(privateKey)
            }
        });

        res.json({ success: true, message: 'Flow encryption keys generated and uploaded successfully' });
    } catch (error) {
        console.error('Error setting up Flow encryption:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

import { decryptRequest, encryptResponse } from '../utils/flowsCrypto.js';
import { sendMessage } from '../services/whatsappMessage.service.js';

export const handleFlowEndpoint = async (req, res) => {
    try {
        // Log all requests for health check debugging
        console.log(`🌐 [${req.method}] Flow Endpoint Hit: ${req.url}`);
        
        // Add ngrok bypass header to response
        res.setHeader("ngrok-skip-browser-warning", "true");

        // 0. Preliminary Health Checks (Unencrypted)
        if (req.method === 'GET' || (!req.body.encrypted_flow_data && !req.body.action)) {
            console.log("🔍 Health Check Probe Received (GET or Bodyless POST)");
            return res.status(200).send('Flow Endpoint Active');
        }

        if (req.body && req.body.action === 'ping') {
            console.log("🔍 Health Check Ping action Received (Unencrypted)");
            return res.json({ 
                version: req.body.version || '3.0',
                data: { status: 'active' } 
            });
        }

        const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;
        console.log("📨 ENCRYPTED FLOW REQUEST RECEIVED");

        if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
            return res.status(400).send('Missing required encrypted fields');
        }

        // 1. Get Vendor Private Key
        // In a multi-tenant system, the URL should ideally be /api/flows/:vendorId/endpoint
        // For now, we'll try to find the vendor who owns this Flow (if Flow ID is separate?) 
        // OR simply fetch the first vendor with a configured key (assuming single tenant context for now)
        const vendor = await prisma.vendor.findFirst({
            where: {
                whatsappFlowsPrivateKey: { not: null }
            }
        });

        if (!vendor) {
            console.error('No vendor found with configured Flow Private Key');
            return res.status(404).send('Flow configuration not found');
        }

        console.log(`🔐 Using vendor: ${vendor.id} for flow decryption`);

        // Check if key is configured
        if (!vendor.whatsappFlowsPrivateKey) {
            console.error('❌ Vendor has no flow private key configured. Run "Setup Security" first.');
            return res.status(400).send('Flow encryption not configured. Please run Setup Security.');
        }

        // 2. Decrypt Private Key (stored encrypted in DB)
        let privateKeyPem;
        try {
            privateKeyPem = decrypt(vendor.whatsappFlowsPrivateKey);
            console.log('✅ Private key decrypted successfully');
        } catch (keyError) {
            console.error('❌ Failed to decrypt stored private key:', keyError.message);
            return res.status(500).send('Failed to load encryption key');
        }

        // 3. Decrypt Request
        const { decryptedData, aesKey, iv } = decryptRequest(
            encrypted_aes_key,
            initial_vector,
            encrypted_flow_data,
            privateKeyPem
        );

        console.log('Flow Request:', decryptedData);

        const { action, screen, data } = decryptedData;
        let responsePayload = {};

        if (action === 'ping') {
            console.log("🔔 Responding to Encrypted Ping");
            responsePayload = {
                version: decryptedData.version || '3.0',
                data: {
                    status: 'active'
                }
            };
        } else if (action === 'INIT') {
            let startScreenId = "WELCOME"; // Fallback

            try {
                const flowToken = decryptedData.flow_token;
                if (flowToken) {
                    const parts = flowToken.split('_');
                    // Format: FLOWID_PHONE_TIMESTAMP
                    if (parts.length >= 1) {
                        const flowId = parts[0];
                        // Validate format (e.g., UUID-like or shorter ID)
                        if (flowId.length > 5) {
                            const flow = await prisma.whatsAppFlow.findUnique({
                                where: { id: flowId },
                                select: { flowJson: true }
                            });

                            if (flow && flow.flowJson) {
                                // Try to get start screen from preview or first screen in list
                                const json = typeof flow.flowJson === 'string' ? JSON.parse(flow.flowJson) : flow.flowJson;

                                if (json.screens && json.screens.length > 0) {
                                    // Default to first screen in the array
                                    startScreenId = json.screens[0].id;
                                    console.log(`✅ Dynamically resolved start screen: ${startScreenId} for Flow: ${flowId}`);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching start screen:", err);
            }

            responsePayload = {
                version: decryptedData.version || "3.0",
                screen: startScreenId,
                data: {
                    // Return any initial data needed by the form
                }
            };
        } else if (action === 'data_exchange') {
            console.log('📝 Flow Data Received:', JSON.stringify(decryptedData, null, 2));

            const submissionData = { ...(decryptedData.data || {}) };
            // Remove internal navigation fields from stored data
            delete submissionData.next_screen_id;

            let waId = decryptedData.user?.wa_id;
            const flowToken = decryptedData.flow_token;

            // Fallback: Extract waId from flow_token (Format: flowId_waId_timestamp)
            if (!waId && flowToken) {
                const parts = flowToken.split('_');
                if (parts.length >= 2) {
                    waId = parts[1];
                }
            }

            if (waId && vendor) {
                // Determine next screen EARLY to set status correctly
                const currentScreen = decryptedData.screen || "START";
                let nextScreen = "SUCCESS"; // Default fallback
                let status = "in_progress";

                // 1. Check if next_screen_id was sent in payload (Frontend override)
                if (decryptedData.data?.next_screen_id) {
                    nextScreen = decryptedData.data.next_screen_id;
                    console.log(`🧭 Using UI-defined next screen: ${nextScreen}`);
                }

                // 2. Dynamic Next Screen Resolution
                try {
                    const flowId = flowToken ? flowToken.split('_')[0] : null;
                    if (flowId) {
                        const flow = await prisma.whatsAppFlow.findUnique({
                            where: { id: flowId },
                            select: { flowJson: true, name: true, category: true }
                        });

                        if (flow && flow.flowJson) {
                            const json = typeof flow.flowJson === 'string' ? JSON.parse(flow.flowJson) : flow.flowJson;

                            // If dynamic resolution needed (not in payload)
                            if (!decryptedData.data?.next_screen_id && json.screens) {
                                const currIdx = json.screens.findIndex(s => s.id === currentScreen);
                                if (currIdx !== -1 && currIdx < json.screens.length - 1) {
                                    nextScreen = json.screens[currIdx + 1].id;
                                    console.log(`🧭 Dynamically resolved next screen: ${nextScreen}`);
                                } else {
                                    // Fallback for hardcoded legacy scenarios
                                    if (currentScreen === "START") nextScreen = "Q"; // Legacy support
                                    else if (currentScreen === "Q") nextScreen = "SUCCESS";
                                }
                            }

                            // Determine status based on the Resolved Next Screen
                            const targetScreenNode = json.screens?.find(s => s.id === nextScreen);
                            if (targetScreenNode?.terminal) {
                                status = "completed";
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error determining flow logic:", err);
                }

                // Global Fallback
                if (nextScreen === "SUCCESS") status = "completed";

                console.log(`📍 Current Screen: ${currentScreen} → Next Screen: ${nextScreen} [Status: ${status}]`);

                try {
                    // Normalize Phone Numbers (Check both + and non-+)
                    let lead = await prisma.lead.findFirst({
                        where: {
                            vendorId: vendor.id,
                            OR: [
                                { phoneNumber: waId },
                                { phoneNumber: `+${waId}` },
                                { phoneNumber: waId.replace('+', '') }
                            ]
                        }
                    });

                    // Log the attempt (Visible in Dashboard)
                    await prisma.activityLog.create({
                        data: {
                            vendorId: vendor.id,
                            type: 'flow_endpoint_hit',
                            status: 'received',
                            phoneNumber: waId,
                            event: 'data_exchange',
                            payload: { flowToken, ...submissionData },
                            whatsappBusinessId: vendor.whatsappBusinessId
                        }
                    });

                    if (lead) {
                        let conversation = await prisma.conversation.findFirst({
                            where: { vendorId: vendor.id, leadId: lead.id }
                        });

                        if (!conversation) {
                            conversation = await prisma.conversation.create({
                                data: { vendorId: vendor.id, leadId: lead.id, channel: 'whatsapp' }
                            });
                        }

                        // Save Response
                        let flowId = null;
                        if (flowToken) {
                            const parts = flowToken.split('_');
                            // If UUID format (simple check: length > 20)
                            if (parts[0] && parts[0].length > 10) {
                                flowId = parts[0];
                            }
                        }

                        // Check if response already exists for this token
                        const existingResponse = await prisma.flowResponse.findFirst({
                            where: { flowToken }
                        });

                        if (existingResponse) {
                            // Merge new data with existing data
                            const mergedData = {
                                ...(existingResponse.responseData || {}),
                                ...submissionData
                            };

                            await prisma.flowResponse.update({
                                where: { id: existingResponse.id },
                                data: {
                                    responseData: mergedData,
                                    status: status,
                                    // Set completedAt if finishing
                                    ...(status === 'completed' && { completedAt: new Date() })
                                }
                            });
                            console.log('✅ Flow Response UPDATED in DB');
                        } else {
                            // Create new response
                            await prisma.flowResponse.create({
                                data: {
                                    conversationId: conversation.id,
                                    responseData: submissionData,
                                    flowToken: flowToken,
                                    responseData: submissionData,
                                    flowToken: flowToken,
                                    status: status,
                                    ...(flowId && { flowId })
                                }
                            });
                            console.log('✅ Flow Response CREATED in DB');
                        }
                        console.log('✅ Flow Response Saved to DB');

                        // --- NEW: Send Confirmation Message on Completion ---
                        if (status === 'completed') {
                            try {
                                console.log("🎉 Flow Completed! Sending confirmation message...");
                                let confirmationText = "Thank you! Your form response has been received.";
                                
                                // Try to get flow details for a better message
                                if (flowId) {
                                    const flowDetails = await prisma.whatsAppFlow.findUnique({
                                        where: { id: flowId },
                                        select: { name: true, category: true }
                                    });
                                    if (flowDetails) {
                                        const niceCategory = flowDetails.category?.replace(/_/g, ' ').toLowerCase();
                                        confirmationText = `Thank you! Your ${niceCategory} response has been successfully submitted.`;
                                    }
                                }

                                await sendMessage(vendor.id, conversation.id, {
                                    type: 'text',
                                    text: confirmationText
                                });
                                console.log("✅ Confirmation message sent.");
                            } catch (msgError) {
                                console.error("⚠️ Failed to send flow confirmation message:", msgError.message);
                            }
                        }

                    } else {
                        console.warn(`⚠️ Lead not found for number: ${waId}. Flow data logged but not linked to lead.`);
                    }
                } catch (e) {
                    console.error("Save Error", e);
                }
                // Construct Response Payload utilizing the dynamically resolved nextScreen
                const responseData = {};
                if (nextScreen === "SUCCESS") {
                    responseData.extension_message_response = {
                        params: { flow_token: flowToken }
                    };
                }
                responsePayload = {
                    version: decryptedData.version || "3.0",
                    screen: nextScreen,
                    data: responseData
                };
            }
        } else if (action === 'navigate') {
            // Client error report or state change?
            // Meta sends this when an error occurs like 'invalid-screen-transition'
            // We should just acknowledge it to prevent 'Something went wrong' generic error
            console.warn('⚠️ Received client validation report:', decryptedData.data);
            
            try {
                const vendor = await prisma.vendor.findFirst({
                    where: { whatsappFlowsPrivateKey: { not: null } }
                });
                if (vendor) {
                    await prisma.activityLog.create({
                        data: {
                            vendorId: vendor.id,
                            type: 'flow_endpoint_hit',
                            status: 'failed',
                            event: 'client_validation_error',
                            payload: decryptedData.data,
                            whatsappBusinessId: vendor.whatsappBusinessId
                        }
                    });
                }
            } catch(e) { console.error("Could not log validation error", e); }

            // Return empty SUCCESS or similar to appease the client
            responsePayload = {
                version: decryptedData.version || "3.0",
                data: {
                    acknowledged: true
                }
            };
        } else {
            console.warn('Unknown Flow Action:', action);
            // Return fallback
            responsePayload = { 
                version: decryptedData.version || "3.0",
                data: {} 
            };
        }

        console.log("📤 Sending Response Payload:", JSON.stringify(responsePayload, null, 2));

        // 5. Encrypt Response
        const encryptedResponse = encryptResponse(responsePayload, aesKey, iv);

        // 6. Return Plain Text String (Base64) as Meta expects
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(encryptedResponse);
        console.log("✅ Flow Endpoint Response Sent Successfully");

    } catch (error) {
        console.error('❌ Flow Endpoint Error:', error.message);
        console.error(error.stack);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
};

export default {
    getFlows,
    getFlowById,
    createFlow,
    updateFlow,
    publishFlow,
    deprecateFlow,
    deleteFlow,
    getFlowMetrics,
    getFlowResponses,
    deleteFlowResponse,
    setupFlowsEncryption,
    handleFlowEndpoint
};

