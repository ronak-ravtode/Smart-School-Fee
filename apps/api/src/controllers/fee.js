const prisma = require('../config/db');
const { logAudit } = require('../middlewares/audit');

// Fetch all fee structures with academic year details
const getFeeStructures = async (req, res) => {
  try {
    const structures = await prisma.feeStructure.findMany({
      include: {
        academicYear: true
      },
      orderBy: [
        { name: 'asc' },
        { version: 'desc' }
      ]
    });
    return res.status(200).json(structures);
  } catch (error) {
    console.error('Get fee structures error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new fee structure
const createFeeStructure = async (req, res) => {
  try {
    const { name, amount, type, appliesTo, academicYearId } = req.body;

    if (!name || amount === undefined || !type || !appliesTo || !academicYearId) {
      return res.status(400).json({ error: 'Name, amount, type, appliesTo, and academicYearId are required' });
    }

    const allowedTypes = ['tuition', 'transport', 'late_fee', 'other'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid fee type specified' });
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        amount: Number(amount),
        type,
        appliesTo,
        academicYearId: Number(academicYearId),
        version: 1
      },
      include: {
        academicYear: true
      }
    });

    // Log Audit
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'create_fee_structure',
      entity: 'fee_structure',
      entityId: feeStructure.id,
      before: null,
      after: feeStructure
    });

    return res.status(201).json(feeStructure);
  } catch (error) {
    console.error('Create fee structure error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Versioned Fee Structure Update
// Instead of mutating, this creates a new row with version incremented
const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, appliesTo } = req.body;

    const currentStructure = await prisma.feeStructure.findUnique({
      where: { id: Number(id) }
    });

    if (!currentStructure) {
      return res.status(404).json({ error: 'Fee structure not found' });
    }

    // Create a new version
    const newVersionStructure = await prisma.feeStructure.create({
      data: {
        name: name || currentStructure.name,
        amount: amount !== undefined ? Number(amount) : currentStructure.amount,
        appliesTo: appliesTo || currentStructure.appliesTo,
        type: currentStructure.type,
        academicYearId: currentStructure.academicYearId,
        version: currentStructure.version + 1
      },
      include: {
        academicYear: true
      }
    });

    // Log Audit
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'update_fee_structure',
      entity: 'fee_structure',
      entityId: newVersionStructure.id,
      before: currentStructure,
      after: newVersionStructure
    });

    return res.status(200).json(newVersionStructure);
  } catch (error) {
    console.error('Update fee structure error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign a fee structure to a student
const assignFee = async (req, res) => {
  try {
    const { studentId, feeStructureId, dueDate } = req.body;

    if (!studentId || !feeStructureId || !dueDate) {
      return res.status(400).json({ error: 'studentId, feeStructureId, and dueDate are required' });
    }

    const student = await prisma.student.findUnique({
      where: { id: Number(studentId) }
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: Number(feeStructureId) }
    });
    if (!feeStructure) {
      return res.status(404).json({ error: 'Fee structure not found' });
    }

    const assignment = await prisma.feeAssignment.create({
      data: {
        studentId: Number(studentId),
        feeStructureId: Number(feeStructureId),
        dueDate: new Date(dueDate),
        status: 'pending'
      },
      include: {
        student: true,
        feeStructure: true
      }
    });

    // Log Audit
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'assign_fee',
      entity: 'fee_assignment',
      entityId: assignment.id,
      before: null,
      after: assignment
    });

    return res.status(201).json(assignment);
  } catch (error) {
    console.error('Assign fee error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAcademicYears = async (req, res) => {
  try {
    let count = await prisma.academicYear.count();
    if (count === 0) {
      await prisma.academicYear.create({
        data: {
          label: '2026-27',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-04-30'),
          isActive: true
        }
      });
    }
    const years = await prisma.academicYear.findMany({
      orderBy: { label: 'desc' }
    });
    return res.status(200).json(years);
  } catch (error) {
    console.error('Get academic years error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getFeeAssignments = async (req, res) => {
  try {
    const { studentId } = req.query;
    const role = req.user.role;
    let whereClause = {};

    if (studentId) {
      whereClause.studentId = Number(studentId);
    }

    if (role === 'guardian') {
      whereClause.student = { guardianId: req.user.id };
    }

    const assignments = await prisma.feeAssignment.findMany({
      where: whereClause,
      include: {
        student: true,
        feeStructure: {
          include: { academicYear: true }
        },
        waiverPenalties: true
      },
      orderBy: { dueDate: 'asc' }
    });

    // Check for overdue assignments and apply late payment penalty dynamically
    const now = new Date();
    const checkedAssignments = [];

    for (const assignment of assignments) {
      if (
        (assignment.status === 'pending' || assignment.status === 'overdue') &&
        now > new Date(assignment.dueDate)
      ) {
        // Check if a late payment penalty is already applied to this assignment
        const hasLatePenalty = assignment.waiverPenalties.some(
          wp => wp.type === 'penalty' && wp.reason.includes('Late payment charge')
        );

        if (!hasLatePenalty) {
          // Apply ₹500 late payment penalty
          await prisma.waiverPenalty.create({
            data: {
              feeAssignmentId: assignment.id,
              amount: 500.00,
              type: 'penalty',
              reason: 'Late payment charge (Overdue 30 days limit)'
            }
          });
          
          // Update assignment status to overdue
          const updated = await prisma.feeAssignment.update({
            where: { id: assignment.id },
            data: { status: 'overdue' },
            include: {
              student: true,
              feeStructure: {
                include: { academicYear: true }
              },
              waiverPenalties: true
            }
          });
          
          checkedAssignments.push(updated);
          continue;
        }
      }
      checkedAssignments.push(assignment);
    }

    return res.status(200).json(checkedAssignments);
  } catch (error) {
    console.error('Get fee assignments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  assignFee,
  getAcademicYears,
  getFeeAssignments
};
