import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function AITestPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 min
  const timerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/college/test/${token}`)
      .then(r => {
        setTestData(r.data);
        setLoading(false);
        // Start timer
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
            return t - 1;
          });
        }, 1000);
      })
      .catch(e => {
        setError(e.response?.data?.message || 'Test not found or already submitted.');
        setLoading(false);
      });
    return () => clearInterval(timerRef.current);
  }, [token]);

  const handleAnswer = (qIndex, option) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = async (auto = false) => {
    clearInterval(timerRef.current);
    if (!auto) {
      const unanswered = testData.questions.length - Object.keys(answers).length;
      if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      const r = await axios.post(`${API}/college/test/${token}/submit`, { answers });
      setResult(r.data);
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="ai-test-page">
      <div className="ai-test-loading">
        <div className="ai-test-spinner" />
        <p>Loading your assessment…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="ai-test-page">
      <div className="ai-test-error-card">
        <div className="ai-test-error-icon">⚠️</div>
        <h2>Test Unavailable</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  if (result) return (
    <div className="ai-test-page">
      <div className={`ai-test-result-card ${result.passed ? 'passed' : 'failed'}`}>
        <div className="ai-test-result-icon">{result.passed ? '🎉' : '📊'}</div>
        <h2>{result.passed ? 'Congratulations!' : 'Assessment Complete'}</h2>
        <div className="ai-test-score-circle">
          <span className="ai-test-score-num">{result.score}%</span>
          <span className="ai-test-score-lbl">Score</span>
        </div>
        <p className="ai-test-score-detail">{result.correct} / {result.total} correct</p>
        <p className="ai-test-result-msg">{result.message}</p>
        {result.passed && (
          <div className="ai-test-passed-note">
            ✅ You will be notified about next steps via email.
          </div>
        )}
      </div>
    </div>
  );

  const q = testData.questions[current];
  const answered = Object.keys(answers).length;
  const progress = (answered / testData.questions.length) * 100;
  const isWarning = timeLeft < 120;

  return (
    <div className="ai-test-page">
      {/* Header */}
      <div className="ai-test-header">
        <div className="ai-test-brand">⚡ HireStorm <span>AI Assessment</span></div>
        <div className={`ai-test-timer ${isWarning ? 'warning' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Info bar */}
      <div className="ai-test-info">
        <div>
          <span className="ai-test-label">Candidate</span>
          <span className="ai-test-value">{testData.studentName}</span>
        </div>
        <div>
          <span className="ai-test-label">Role</span>
          <span className="ai-test-value">{testData.role}</span>
        </div>
        <div>
          <span className="ai-test-label">Drive</span>
          <span className="ai-test-value">{testData.driveTitle}</span>
        </div>
        <div>
          <span className="ai-test-label">Answered</span>
          <span className="ai-test-value">{answered} / {testData.questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="ai-test-progress-bar">
        <div className="ai-test-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question navigation dots */}
      <div className="ai-test-nav-dots">
        {testData.questions.map((_, i) => (
          <button
            key={i}
            className={`ai-test-dot ${i === current ? 'active' : answers[i] ? 'answered' : ''}`}
            onClick={() => setCurrent(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="ai-test-question-card">
        <div className="ai-test-q-header">
          <span className="ai-test-q-num">Question {current + 1} of {testData.questions.length}</span>
        </div>
        <h3 className="ai-test-q-text">{q.q}</h3>
        <div className="ai-test-options">
          {q.options.map((opt, oi) => {
            const letter = opt.charAt(0).toUpperCase();
            const selected = answers[current] === letter;
            return (
              <button
                key={oi}
                className={`ai-test-option ${selected ? 'selected' : ''}`}
                onClick={() => handleAnswer(current, letter)}
              >
                <span className="ai-test-opt-badge">{letter}</span>
                <span className="ai-test-opt-text">{opt.substring(2).trim()}</span>
              </button>
            );
          })}
        </div>

        <div className="ai-test-nav-btns">
          <button
            className="btn btn-outline"
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
          >
            ← Previous
          </button>
          {current < testData.questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary ai-test-submit-btn"
              onClick={() => handleSubmit()}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : '✅ Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
