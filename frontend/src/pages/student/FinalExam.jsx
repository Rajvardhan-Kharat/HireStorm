import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ShareLinkedInButton from '../../components/ShareLinkedInButton';

// Seamlessly wrapping Prompt 7 Frontend endpoints explicitly natively
export default function FinalExam() {
  const [loading, setLoading] = useState(false);
  const [examState, setExamState] = useState('idle'); // Tracking: idle, active, passed, failed
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [certUrl, setCertUrl] = useState(null);

  const startExam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Bounding Gemini AI strictly mapped string generation endpoint!
      const res = await fetch('/api/v1/ilm/exam/generate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.questions);
        setSessionId(data.sessionId);
        setUserAnswers(new Array(data.questions.length).fill(null));
        setExamState('active');
        toast.success("AI Model securely mapped 10 strict daily log internship questions!");
      } else {
        toast.error(data.message || 'Logic error actively returning Gemini map.');
      }
    } catch (err) {
      toast.error('Network block resolving internal AI pipelines.');
    }
    setLoading(false);
  };

  const handleSelect = (qIndex, optionText) => {
    const updated = [...userAnswers];
    updated[qIndex] = optionText;
    setUserAnswers(updated);
  };

  const submitExam = async () => {
    if (userAnswers.includes(null)) return toast.error("You must map every array question logic structure completely.");
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/ilm/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId, userAnswers })
      });
      
      const data = await res.json();
      if (data.success && data.passed) {
        setCertUrl(data.certificateUrl);
        setExamState('passed');
        toast.success(data.message, { duration: 5000, icon: '🏆' });
      } else {
        setExamState('failed');
        toast.error(data.message);
      }
    } catch {
      toast.error('Execution schema blocked fetching map grading.');
    }
    setLoading(false);
  };

  if (examState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 px-2 tracking-tight">AI Final Component Assessment</h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8 leading-relaxed">
          The internal Gemini AI engine exactly generated 10 specific strict questions tracking the Daily Logs you formally mapped over 90 days. You must structurally output a passing <span className="font-bold text-red-600">40% logical boundary</span> to synthesize your PDF Certificates mapping natively!
        </p>
        <button onClick={startExam} disabled={loading} className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-xl">
          {loading ? 'Compiling Gemini Prompts Maps...' : 'Begin Logical AI Engine Mapping'}
        </button>
      </div>
    );
  }

  if (examState === 'passed') {
    return (
      <div className="flex flex-col items-center mt-12 space-y-8 animate-fade-in p-8 bg-green-50 rounded-2xl shadow-sm border border-green-100 max-w-3xl mx-auto">
        <div className="text-7xl shadow-green flex items-center justify-center w-32 h-32 bg-white rounded-full">🏆</div>
        <h2 className="text-4xl font-black text-green-800 text-center tracking-tight">AI Tracking Assessment Validated!</h2>
        <p className="text-lg text-green-700 max-w-lg text-center font-medium">Your formal dynamic PDF mapping has been uploaded to Cloudinary mapping successfully explicitly.</p>
        
        {/* Natively embedding the required button strictly from Prompt 7 */}
        <ShareLinkedInButton certificateUrl={certUrl} />
      </div>
    );
  }

  if (examState === 'failed') {
    return (
      <div className="flex flex-col items-center mt-12 space-y-6 animate-fade-in p-8 bg-red-50 rounded-2xl shadow-sm border border-red-100 max-w-2xl mx-auto text-center">
         <div className="text-7xl">⚠️</div>
         <h2 className="text-3xl font-bold text-red-700">Assessment Execution Failed Logically</h2>
         <p className="text-red-600">Your specific numeric arrays fell below the required explicit 40% boundaries internally validated! Please recheck logic.</p>
         <button onClick={() => setExamState('idle')} className="mt-4 border-2 border-red-600 text-red-700 hover:bg-red-600 hover:text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-all focus:outline-none">Retake Engine Exam</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white shadow-xl rounded-2xl border border-gray-100 my-8">
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
        <h2 className="text-2xl font-black text-gray-800">Final Gemini System Assessment Tracking</h2>
        <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-bold text-sm tracking-wide">AI Target &gt; 40% Logic</div>
      </div>
      
      <div className="space-y-12">
        {questions.map((q, i) => (
          <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-200 transition-all hover:border-blue-400 hover:shadow-md">
            <h4 className="text-lg font-bold text-gray-800 mb-4">{i + 1}. {q.question}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelect(i, opt)}
                  className={`p-4 text-left rounded-lg text-[15px] font-medium border-2 transition-all ${
                    userAnswers[i] === opt 
                      ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-inner' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-end border-t border-gray-200 pt-8">
        <button onClick={submitExam} disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white font-black py-4 px-12 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] text-lg outline-none">
          {loading ? 'Evaluating Array Logic...' : 'Submit AI Internal Arrays'}
        </button>
      </div>
    </div>
  );
}
