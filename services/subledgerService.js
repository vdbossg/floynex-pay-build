const SubLedger = require("../models/SubLedger");
const MonthlyReport = require("../models/MonthlyReport");

const createIncome = async ({
    amount,
    source,
    reference,
    subscriptionId
}) => {

    const now = new Date();

    return await SubLedger.create({
        type: "income",
        amount,
        source,
        reference,
        subscriptionId,
        month: now.getMonth() + 1,
        year: now.getFullYear()
    });
};

const createExpense = async ({
    amount,
    source,
    description
}) => {

    const now = new Date();

    return await SubLedger.create({
        type: "expense",
        amount,
        source,
        description,
        month: now.getMonth() + 1,
        year: now.getFullYear()
    });
};

const getMonthTotals = async (month, year) => {

    const income = await SubLedger.aggregate([
        {
            $match: {
                type: "income",
                month,
                year
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" }
            }
        }
    ]);

    const expenses = await SubLedger.aggregate([
        {
            $match: {
                type: "expense",
                month,
                year
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" }
            }
        }
    ]);

    return {
        revenue: income[0]?.total || 0,
        expenses: expenses[0]?.total || 0
    };
};

const closeMonth = async (month, year) => {

    const totals = await getMonthTotals(month, year);

    const profit =
        totals.revenue - totals.expenses;

    const previous = await MonthlyReport
        .findOne({
            status: "closed"
        })
        .sort({
            year: -1,
            month: -1
        });

    const carryForward =
        (previous?.carryForward || 0)
        + profit;

    return await MonthlyReport.create({
        month,
        year,
        revenue: totals.revenue,
        expenses: totals.expenses,
        profit,
        carryForward,
        status: "closed"
    });
};

module.exports = {
    createIncome,
    createExpense,
    getMonthTotals,
    closeMonth
};