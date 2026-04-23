const cron = require('node-cron');
const Internship = require('../models/Internship');
const { getWorkingDaysElapsed } = require('../utils/workingDaysCalculator');
const { sendEmail } = require('../services/emailService');

// Natively mapping `node-cron` exactly executing every week day at UTC 09:00 strictly
cron.schedule('0 9 * * 1-5', async () => {
  try {
    console.log('[CRON] Executing active 30-Day Working Rubric Job logic map.');
    
    const activeInterns = await Internship.find({ status: 'ACTIVE' }).populate('mentorId userId');
    
    for (const internship of activeInterns) {
      // Evaluate strictly explicit Javascript Working Days ignoring weekends
      const workingDays = getWorkingDaysElapsed(internship.startDate);
      
      // Prompt exactly demands pings actively bounding modulus 30 days
      if (workingDays > 0 && workingDays % 30 === 0 && workingDays <= 90) {
        console.log(`[CRON] Exact interval explicitly registered: ${workingDays} mapped elapsed mapped for ${internship.userId.name}. Pinging Mentor.`);
        
        const mentorEmail = internship.mentorId?.email;
        if (mentorEmail) {
          const rubricMonth = workingDays / 30; // Maps gracefully tracking Month 1, 2, or 3 logic
          
          await sendEmail(
            mentorEmail,
            `Required Admin Action: Month ${rubricMonth} Rubric for ${internship.userId.name}`,
            `This is an automated request tracking ILM Logic. Intern ${internship.userId.name} has officially completed precisely ${workingDays} working days. Please login to HireStorm and submit their Monthly Rubric Assessment.`
          );
        }
      }
    }
  } catch (error) {
    console.error('[CRON] Engine failed resolving interval execution maps', error.message);
  }
});

console.log('[ILM Scheduler] Prompt 6 strict Cron explicitly instantiated!');
