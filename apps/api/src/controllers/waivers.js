const prisma = require('../config/db');

// Create a pending waiver or penalty
const createWaiverPenalty = async (req, res) => {
  try {
    const { student_id, fee_assignment_id, amount, type, reason } = req.body;

    if (!student_id || !fee_assignment_id || !amount || !type || !reason) {
      return res.status(400).json({ error: 'All fields are required: student_id, fee_assignment_id, amount, type, reason' });
    }

    if (!['waiver', 'penalty'].includes(type)) {
      return res.status(400).json({ error: "Type must be either 'waiver' or 'penalty'" });
    }

    const waiverPenalty = await prisma.waiverPenalty.create({
      data: {
        studentId: Number(student_id),
        feeAssignmentId: Number(fee_assignment_id),
        amount: Number(amount),
        type,
        reason,
        status: 'pending'
      },
      include: {
        student: true,
        feeAssignment: true
      }
    });

    return res.status(201).json(waiverPenalty);
  } catch (error) {
    console.error('Create waiver error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve a waiver or penalty
const approveWaiverPenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const record = await prisma.waiverPenalty.findUnique({
      where: { id: Number(id) },
      include: { feeAssignment: { include: { feeStructure: true } } }
    });

    if (!record) {
      return res.status(404).json({ error: 'Waiver/penalty record not found' });
    }

    if (record.status !== 'pending') {
      return res.status(400).json({ error: `Record is already ${record.status}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Waiver/Penalty status
      const updatedRecord = await tx.waiverPenalty.update({
        where: { id: Number(id) },
        data: {
          status: 'approved',
          approvedById: adminId,
          approvedAt: new Date()
        }
      });

      // 2. Apply business rules to FeeAssignment if it is a Waiver
      if (record.type === 'waiver') {
        const assignment = record.feeAssignment;
        const totalAmount = Number(assignment.feeStructure.amount);
        const waivedAmount = Number(record.amount);

        // If the waiver covers the entire amount, mark it waived
        if (waivedAmount >= totalAmount) {
          await tx.feeAssignment.update({
            where: { id: assignment.id },
            data: { status: 'waived' }
          });
        }
      }

      return updatedRecord;
    });

    // 3. Generate Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: req.user.role,
        action: 'approve_waiver_penalty',
        entity: 'waiver_penalty',
        entityId: result.id,
        before: record,
        after: result
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Approve waiver error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject a waiver or penalty
const rejectWaiverPenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const record = await prisma.waiverPenalty.findUnique({
      where: { id: Number(id) }
    });

    if (!record) {
      return res.status(404).json({ error: 'Waiver/penalty record not found' });
    }

    if (record.status !== 'pending') {
      return res.status(400).json({ error: `Record is already ${record.status}` });
    }

    const result = await prisma.waiverPenalty.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        rejectionReason: reason
      }
    });

    // Generate Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: req.user.role,
        action: 'reject_waiver_penalty',
        entity: 'waiver_penalty',
        entityId: result.id,
        before: record,
        after: result
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Reject waiver error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// List waivers/penalties (pending or all)
const getWaiversPenalties = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }

    const records = await prisma.waiverPenalty.findMany({
      where,
      include: {
        student: true,
        feeAssignment: { include: { feeStructure: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(records);
  } catch (error) {
    console.error('Get waivers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createWaiverPenalty,
  approveWaiverPenalty,
  rejectWaiverPenalty,
  getWaiversPenalties
};
