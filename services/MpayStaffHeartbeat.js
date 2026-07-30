const MpayStaffHeartbeat = require("../models/MpayStaffHeartbeat");

const recordHeartbeat = async (staffId, isWorking) => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // Pulls format: "YYYY-MM-DD"
  const intervalSeconds = 60; // 1 minute pings

  let record = await MpayStaffHeartbeat.findOne({ staffId, date: todayStr });

  if (!record) {
    record = new MpayStaffHeartbeat({
      staffId,
      date: todayStr,
      firstLogin: now,
      lastSeen: now,
      totalOnlineSeconds: intervalSeconds,
      totalWorkingSeconds: isWorking ? intervalSeconds : 0
    });
  } else {
    const timePassedMs = now - new Date(record.lastSeen);
    
    // Safety check: prevents artificial timing inflation if they lose connection or sleep their laptop
    if (timePassedMs < 120000) { 
      record.totalOnlineSeconds += intervalSeconds;
      if (isWorking) {
        record.totalWorkingSeconds += intervalSeconds;
      }
    }
    record.lastSeen = now;
  }

  return await record.save();
};

const getMonthToDateSummary = async (staffId, year, month) => {
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`; // e.g., "2026-06"

  const records = await MpayStaffHeartbeat.find({
    staffId,
    date: { $regex: `^${prefix}` }
  }).sort({ date: 1 });

  let cumulativeOnlineSec = 0;
  let cumulativeWorkingSec = 0;

  const dailyGraphData = records.map(r => {
    cumulativeOnlineSec += r.totalOnlineSeconds;
    cumulativeWorkingSec += r.totalWorkingSeconds;

    return {
      date: r.date,
      onlineHours: parseFloat((r.totalOnlineSeconds / 3600).toFixed(2)),
      workingHours: parseFloat((r.totalWorkingSeconds / 3600).toFixed(2))
    };
  });

  return {
    staffId,
    month: prefix,
    summary: {
      totalOnline: formatHHMMSS(cumulativeOnlineSec),
      totalWorking: formatHHMMSS(cumulativeWorkingSec),
      efficiencyRate: cumulativeOnlineSec > 0 
        ? `${((cumulativeWorkingSec / cumulativeOnlineSec) * 100).toFixed(1)}%` 
        : "0%"
    },
    graphData: dailyGraphData
  };
};

function formatHHMMSS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(v => String(v).padStart(2, "0")).join(":");
}

module.exports = {
  recordHeartbeat,
  getMonthToDateSummary
};