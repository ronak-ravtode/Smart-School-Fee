const prisma = require('../config/db');

// /api/dashboard/metrics
const getMetrics = async (req, res) => {
  try {
    // 1. Calculate bank_balance (sum of success transactions + reversed transactions)
    const successResult = await prisma.transaction.aggregate({
      where: {
        status: 'success',
        method: { in: ['UPI', 'CASH', 'CHEQUE'] }
      },
      _sum: { amount: true }
    });

    const reversedResult = await prisma.transaction.aggregate({
      where: { status: 'reversed' },
      _sum: { amount: true }
    });

    const bankBalance = Number(successResult._sum.amount || 0) + Number(reversedResult._sum.amount || 0);

    // 2. Calculate in_hand_cash (sum of CASH transactions where depositedAt IS NULL and status is success)
    const inHandResult = await prisma.transaction.aggregate({
      where: {
        method: 'CASH',
        depositedAt: null,
        status: 'success'
      },
      _sum: { amount: true }
    });
    const inHandCash = Number(inHandResult._sum.amount || 0);

    // 3. Calculate pending_fees (sum of fee_assignments where status = 'pending' or 'overdue')
    // Includes waiver and penalty adjustments
    const pendingAssignments = await prisma.feeAssignment.findMany({
      where: {
        status: { in: ['pending', 'overdue'] }
      },
      include: {
        feeStructure: true,
        waiverPenalties: { where: { status: 'approved' } }
      }
    });

    let pendingFees = 0;
    pendingAssignments.forEach(item => {
      let amt = Number(item.feeStructure.amount);
      item.waiverPenalties.forEach(wp => {
        if (wp.type === 'penalty') {
          amt += Number(wp.amount);
        } else if (wp.type === 'waiver') {
          amt -= Number(wp.amount);
        }
      });
      pendingFees += amt;
    });

    // 4. Calculate today_collections (sum of transactions where created_at = today in local/UTC date boundaries)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayResult = await prisma.transaction.aggregate({
      where: {
        status: 'success',
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    });
    const todayCollections = Number(todayResult._sum.amount || 0);

    return res.status(200).json({
      bank_balance: bankBalance,
      in_hand_cash: inHandCash,
      pending_fees: pendingFees,
      today_collections: todayCollections
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// /api/dashboard/revenue-breakdown
const getRevenueBreakdown = async (req, res) => {
  try {
    const { period = 'monthly', class: classFilter } = req.query;

    const where = { status: 'success' };
    if (classFilter) {
      where.student = { class: classFilter };
    }

    if (period === 'daily') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    } else if (period === 'weekly') {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: start };
    } else if (period === 'monthly') {
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: start };
    }

    const txs = await prisma.transaction.findMany({
      where,
      include: {
        feeAssignment: {
          include: { feeStructure: true }
        }
      }
    });

    const breakdown = {};
    txs.forEach(t => {
      const type = t.feeAssignment.feeStructure.type;
      breakdown[type] = (breakdown[type] || 0) + Number(t.amount);
    });

    // Clean outputs
    const labels = Object.keys(breakdown);
    const data = Object.values(breakdown);

    return res.status(200).json({ labels, data });
  } catch (error) {
    console.error('Get revenue breakdown error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// /api/dashboard/defaulters
const getDefaulters = async (req, res) => {
  try {
    const { sort_by = 'days', filter_class } = req.query;

    const where = {
      status: { in: ['pending', 'overdue'] }
    };
    if (filter_class) {
      where.student = { class: filter_class };
    }

    const assignments = await prisma.feeAssignment.findMany({
      where,
      include: {
        student: true,
        feeStructure: true,
        waiverPenalties: { where: { status: 'approved' } }
      }
    });

    const defaulters = assignments.map(item => {
      let overdueAmount = Number(item.feeStructure.amount);
      item.waiverPenalties.forEach(wp => {
        if (wp.type === 'penalty') {
          overdueAmount += Number(wp.amount);
        } else if (wp.type === 'waiver') {
          overdueAmount -= Number(wp.amount);
        }
      });

      const dueDate = new Date(item.dueDate);
      const today = new Date();
      const diffTime = Math.max(0, today - dueDate);
      const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return {
        student_id: item.studentId,
        name: item.student.name,
        class: item.student.class,
        overdue_days: overdueDays,
        overdue_amount: overdueAmount
      };
    });

    // Sort accordingly
    if (sort_by === 'days') {
      defaulters.sort((a, b) => b.overdue_days - a.overdue_days);
    } else {
      defaulters.sort((a, b) => b.overdue_amount - a.overdue_amount);
    }

    return res.status(200).json(defaulters);
  } catch (error) {
    console.error('Get defaulters list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// /api/dashboard/reports
const getReports = async (req, res) => {
  try {
    const { class: classFilter, start_date, end_date } = req.query;

    // Filter rules for transactions
    const txWhere = { status: 'success' };
    if (classFilter) {
      txWhere.student = { class: classFilter };
    }
    if (start_date && end_date) {
      txWhere.createdAt = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }

    const txs = await prisma.transaction.findMany({
      where: txWhere,
      include: {
        feeAssignment: {
          include: { feeStructure: true }
        }
      }
    });

    const totalCollected = txs.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Filter rules for pending fee assignments
    const pendingWhere = { status: { in: ['pending', 'overdue'] } };
    if (classFilter) {
      pendingWhere.student = { class: classFilter };
    }
    if (start_date && end_date) {
      pendingWhere.dueDate = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }

    const pendingAssignments = await prisma.feeAssignment.findMany({
      where: pendingWhere,
      include: {
        feeStructure: true,
        waiverPenalties: { where: { status: 'approved' } }
      }
    });

    const totalPending = pendingAssignments.reduce((acc, item) => {
      let amt = Number(item.feeStructure.amount);
      item.waiverPenalties.forEach(wp => {
        if (wp.type === 'penalty') amt += Number(wp.amount);
        else if (wp.type === 'waiver') amt -= Number(wp.amount);
      });
      return acc + amt;
    }, 0);

    const breakdownObj = {};
    txs.forEach(t => {
      const type = t.feeAssignment.feeStructure.type;
      breakdownObj[type] = (breakdownObj[type] || 0) + Number(t.amount);
    });

    const breakdown = Object.entries(breakdownObj).map(([type, total]) => ({
      type,
      total
    }));

    return res.status(200).json({
      total_collected: totalCollected,
      total_pending: totalPending,
      breakdown
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMetrics,
  getRevenueBreakdown,
  getDefaulters,
  getReports
};
