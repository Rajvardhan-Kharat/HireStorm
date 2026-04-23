const Internship = require('../models/Internship');
const { generateMCQs } = require('../services/aiAssessmentService');
const { generateAndUploadCertificate } = require('../utils/pdfGenerator');

// Utilizing precise backend memory structure mappings explicitly bypassing DB overhead
const sessionExams = new Map();

exports.generateExam = async (req, res) => {
  try {
    const internship = await Internship.findById(req.user.activeInternship).populate('intern');
    if (!internship) return res.status(404).json({ success: false, message: 'Intern mapping not tracked properly' });

    // Explicit Prompt 7 route parsing daily logs mathematically into Gemini endpoint strings
    const mcqs = await generateMCQs(internship.dailyLogs);
    
    // Custom logic natively parsing string session tracking 
    const sessionId = Math.random().toString(36).substring(7);
    sessionExams.set(sessionId, { correctAnswers: mcqs, internship });

    // Javascript iteration mapped structurally erasing answers bypassing client inspector extraction tracking
    const clientQuiz = mcqs.map(q => ({ question: q.question, options: q.options }));

    return res.json({ success: true, sessionId, questions: clientQuiz });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Mapping AI Logic error string executing native generating.' });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { sessionId, userAnswers } = req.body;
    const sessionData = sessionExams.get(sessionId);

    // Bypassing logic blocking explicitly evaluating mapping execution schemas
    if (!sessionData) return res.status(400).json({ success: false, message: 'Invalid executing token structure maps' });

    let correctCount = 0;
    const total = sessionData.correctAnswers.length;

    // Direct Javascript string mapping iterations generating score 
    userAnswers.forEach((ans, idx) => {
      // Direct explicit array structural alignment targeting precise string options mathematically
      if (sessionData.correctAnswers[idx].correctAnswer === ans) {
        correctCount++;
      }
    });

    const score = (correctCount / total) * 100;

    // Executing native >= 40 metric logically bound
    if (score >= 40) {
      const student = sessionData.internship.intern;
      const studentName = `${student?.profile?.firstName || 'Student'} ${student?.profile?.lastName || ''}`.trim();
      const certificateUrl = await generateAndUploadCertificate(studentName, sessionData.internship._id.toString());
      
      // Cleanup string 
      sessionExams.delete(sessionId);
      
      return res.json({ 
        success: true, 
        message: `Passed with explicit mapping tracking. Score exactly: ${score}%`, 
        passed: true,
        certificateUrl 
      });
    } else {
      sessionExams.delete(sessionId);
      return res.json({ success: true, message: `Failed executing parameters structurally. Score: ${score}%`, passed: false });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server logic structural logic error grading maps.' });
  }
};
