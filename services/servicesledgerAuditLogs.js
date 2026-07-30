const Ledger = require("../models/MSafeLedger");
const Wallet = require("../models/modelsMSafewallet");

exports.getLedgerAuditLogs = async (query) => {
  const {
    page = 1,
    limit = 50,
    type,
    userId,
    accountNumber,
    startDate,
    endDate,
    reference,
    status
  } = query;

  
  const filter = {};

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (reference) {
    filter.reference = {
      $regex: reference,
      $options: "i"
    };
  }

  if (userId) {
    filter.$or = [
      { fromUser: userId },
      { toUser: userId }
    ];
  }

  if (accountNumber) {
    const wallet = await Wallet.findOne({
      accountNumber
    });

    if (!wallet) {
      return {
        success: true,
        total: 0,
        page: Number(page),
        limit: Number(limit),
        data: []
      };
    }

    filter.$or = [
      { fromUser: wallet.user },
      { toUser: wallet.user }
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const total = await Ledger.countDocuments(filter);

  const data = await Ledger.find(filter)

    .populate({
      path: "fromUser",
      select: "firstName lastName email phone"
    })

    .populate({
      path: "toUser",
      select: "firstName lastName email phone"
    })

    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const enriched = await Promise.all(
    data.map(async (row) => {

      let fromWallet = null;
      let toWallet = null;

      if (row.fromUser?._id) {
        fromWallet = await Wallet.findOne({
          user: row.fromUser._id
        }).select(
          "accountNumber balance currency"
        );
      }

      if (row.toUser?._id) {
        toWallet = await Wallet.findOne({
          user: row.toUser._id
        }).select(
          "accountNumber balance currency"
        );
      }

      return {
        ...row,
        fromWallet,
        toWallet
      };
    })
  );

  return {
    success: true,
    total,
    page: Number(page),
    limit: Number(limit),
    data: enriched
  };
};

exports.getLedgerAuditLogById = async (id) => {

  const log = await Ledger.findById(id)

    .populate({
      path: "fromUser",
      select: "firstName lastName email phone"
    })

    .populate({
      path: "toUser",
      select: "firstName lastName email phone"
    })

    .lean();

  if (!log) {
    return null;
  }

  let fromWallet = null;
  let toWallet = null;

  if (log.fromUser?._id) {
    fromWallet = await Wallet.findOne({
      user: log.fromUser._id
    }).select(
      "accountNumber balance currency"
    );
  }

  if (log.toUser?._id) {
    toWallet = await Wallet.findOne({
      user: log.toUser._id
    }).select(
      "accountNumber balance currency"
    );
  }

  return {
    ...log,
    fromWallet,
    toWallet
  };
};