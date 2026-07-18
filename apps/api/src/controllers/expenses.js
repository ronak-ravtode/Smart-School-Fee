const prisma = require('../config/db');

// Predefined categories constraint
const ALLOWED_CATEGORIES = ['watchman', 'cleaning', 'utilities', 'repairs', 'other'];

const createExpense = async (req, res) => {
  try {
    const { description, amount, date, category } = req.body;
    const adminId = req.user.id;

    if (!description || !amount || !date || !category) {
      return res.status(400).json({ error: 'All fields are required: description, amount, date, category' });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
    }

    const expense = await prisma.maintenanceExpense.create({
      data: {
        description,
        amount: Number(amount),
        date: new Date(date),
        category,
        createdById: adminId
      }
    });

    // Log to Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: req.user.role,
        action: 'create_expense',
        entity: 'maintenance_expense',
        entityId: expense.id,
        before: null,
        after: expense
      }
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.maintenanceExpense.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return res.status(200).json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createExpense,
  getExpenses
};
