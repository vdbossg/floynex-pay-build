//backend\controllers\controllersledgerAuditLogs.js
const service = require("../services/servicesledgerAuditLogs");

exports.getAllLedgerAuditLogs = async (
  req,
  res
) => {

  try {

    const result =
      await service.getLedgerAuditLogs(
        req.query
      );

    return res.status(200).json(result);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.getLedgerAuditLogById = async (
  req,
  res
) => {

  try {

    const result =
      await service.getLedgerAuditLogById(
        req.params.id
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Ledger record not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};