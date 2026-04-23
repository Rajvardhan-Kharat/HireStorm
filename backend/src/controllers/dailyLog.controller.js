const Internship = require('../models/Internship');

exports.submitDailyLog = async (req, res) => {
  try {
    const { task, workDone, blockers = '', hoursWorked, date } = req.body;

    // Accept either 'task' (legacy) or 'workDone' (new frontend)
    const taskText = workDone || task;
    if (!taskText || !taskText.trim()) {
      return res.status(400).json({ success: false, message: '`workDone` or `task` field is required' });
    }

    // Find active internship by activeInternship ref OR by intern field
    let internship = null;
    if (req.user.activeInternship) {
      internship = await Internship.findOne({ _id: req.user.activeInternship, status: 'ACTIVE' });
    }
    if (!internship) {
      internship = await Internship.findOne({ intern: req.user._id, status: 'ACTIVE' });
    }

    if (!internship) {
      return res.status(404).json({ success: false, message: 'No active internship found. Please accept an offer first.' });
    }

    // Check if already submitted today
    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);
    const alreadySubmitted = internship.dailyLogs.some(log => {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === logDate.getTime();
    });

    if (alreadySubmitted) {
      return res.status(400).json({ success: false, message: 'You have already submitted a log for this date.' });
    }

    internship.dailyLogs.push({
      date:        logDate,
      task:        taskText,
      workDone:    taskText,
      blockers:    blockers || '',
      hoursWorked: hoursWorked || 8,
      status:      'SUBMITTED',
    });

    await internship.save();

    res.json({
      success: true,
      message: 'Daily log submitted successfully ✅',
      data: { logsTotal: internship.dailyLogs.length },
    });
  } catch (err) {
    console.error('[submitDailyLog]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
