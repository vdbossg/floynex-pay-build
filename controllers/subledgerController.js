//backend\controllers\subledgerController.js
const SubLedger = require("../models/SubLedger");
const MonthlyReport = require("../models/MonthlyReport");

const {
    createExpense,
    getMonthTotals,
    closeMonth
} = require("../services/subledgerService");

const dashboard = async (req, res) => {

    try {

        const now = new Date();

        const month =
            now.getMonth() + 1;

        const year =
            now.getFullYear();

        const totals =
            await getMonthTotals(
                month,
                year
            );

        const previous =
            await MonthlyReport
                .findOne({
                    status: "closed"
                })
                .sort({
                    year: -1,
                    month: -1
                });

        res.json({
            month,
            year,
            revenue:
                totals.revenue,
            expenses:
                totals.expenses,
            profit:
                totals.revenue -
                totals.expenses,
            carryForward:
                previous?.carryForward || 0
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};

const addExpense = async (req, res) => {

    try {

        const {
            amount,
            source,
            description
        } = req.body;

        const expense =
            await createExpense({
                amount,
                source,
                description
            });

        res.json(expense);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
};

const closeCurrentMonth = async (req, res) => {
    try {
        const now = new Date();
        
        // 1. Force calculation based explicitly on East Africa Time (EAT)
        const eatDateStr = now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
        const eatDate = new Date(eatDateStr);
        
        const currentDay = eatDate.getDate();
        const currentMonth = eatDate.getMonth() + 1; // 1 - 12 range
        const currentYear = eatDate.getFullYear();

        // 2. Gatekeeper Constraint Rule 1: Validate Calendar Date Window (28th - 3rd)
        if (currentDay > 3 && currentDay < 28) {
            return res.status(403).json({
                error: `Bookkeeping close window is currently locked. Action can only be executed between the 28th and the 3rd. Current EAT day is: ${currentDay}`
            });
        }

        // 3. Gatekeeper Constraint Rule 2: Enforce Single Execution per Period
        const existingReport = await MonthlyReport.findOne({
            month: currentMonth,
            year: currentYear,
            status: "closed"
        });

        if (existingReport) {
            return res.status(400).json({
                error: `Accounting period for ${currentMonth}/${currentYear} has already been permanently frozen and closed.`
            });
        }

        // 4. Safe to proceed with calculations and creation pipeline execution
        const report = await closeMonth(currentMonth, currentYear);
        res.json(report);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

const reports = async (req, res) => {

    const data =
        await MonthlyReport.find()
            .sort({
                year: -1,
                month: -1
            });

    res.json(data);
};
const expenseList = async (req, res) => {
  try {

    const { from, to } = req.query;

    let filter = {
      type: "expense"
    };

    if (from || to) {
      filter.createdAt = {};

      if (from)
        filter.createdAt.$gte = new Date(from);

      if (to)
        filter.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    const expenses = await SubLedger
      .find(filter)
      .sort({ createdAt: -1 });

    const total = expenses.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    res.json({
      total,
      count: expenses.length,
      expenses
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};
module.exports = {
  dashboard,
  addExpense,
  closeCurrentMonth,
  reports,
  expenseList
};
