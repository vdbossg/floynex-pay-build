//backend\routes\subledger.js
const express = require("express");

const router = express.Router();

const {
  dashboard,
  addExpense,
  closeCurrentMonth,
  reports,
  expenseList
} = require("../controllers/subledgerController");

router.get(
    "/dashboard",
    dashboard
);
router.get(
  "/expenses",
  expenseList
);
router.post(
    "/expense",
    addExpense
);

router.post(
    "/close-month",
    closeCurrentMonth
);

router.get(
    "/reports",
    reports
);

module.exports = router;
