import prisma from "../prisma.js";

export const createWorkflow = async (req, res) => {
  try {
    const { id, name, description, triggerKeyword, nodes, edges } = req.body;
    const vendorId = req.user.vendorId;

    if (!triggerKeyword) {
      return res.status(400).json({ error: "Trigger keyword is required" });
    }

    // 1. Update by ID if provided
    if (id) {
      const existing = await prisma.workflow.findUnique({ where: { id } });
      if (existing && existing.vendorId === vendorId) {
        const updated = await prisma.workflow.update({
          where: { id },
          data: {
            name,
            description,
            triggerKeyword,
            nodes,
            edges,
          },
        });
        return res.json(updated);
      }
    }

    // 2. Check if trigger keyword already exists (fallback for new workflows)
    const existingByKeyword = await prisma.workflow.findFirst({
      where: {
        vendorId,
        triggerKeyword: { equals: triggerKeyword, mode: "insensitive" },
      },
    });

    if (existingByKeyword) {
      // Update existing workflow if found
      const updated = await prisma.workflow.update({
        where: { id: existingByKeyword.id },
        data: {
          name,
          description,
          nodes,
          edges,
        },
      });
      return res.json(updated);
    }

    // 3. Create new
    const workflow = await prisma.workflow.create({
      data: {
        vendorId,
        name,
        description,
        triggerKeyword,
        nodes,
        edges,
        isActive: true,
      },
    });

    res.json(workflow);
  } catch (error) {
    console.error("Create Workflow Error:", error);
    res.status(500).json({ error: "Failed to save workflow" });
  }
};

export const getWorkflows = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const workflows = await prisma.workflow.findMany({
      where: { vendorId },
      orderBy: { updatedAt: "desc" },
    });
    res.json(workflows);
  } catch (error) {
    console.error("Get Workflows Error:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
};

export const getWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.vendorId;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow || workflow.vendorId !== vendorId) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Get Workflow Error:", error);
    res.status(500).json({ error: "Failed to fetch workflow" });
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.vendorId;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow || workflow.vendorId !== vendorId) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    await prisma.workflow.delete({ where: { id } });
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Delete Workflow Error:", error);
    res.status(500).json({ error: "Failed to delete workflow" });
  }
};
