import React, { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import { Calendar, CheckCircle2, Clock, Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkBreakdown() {
  const [internship, setInternship] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);

  const fetchWBS = () => {
    api.get('/ilm/my')
      .then(r => { setInternship(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(fetchWBS, []);

  const markTaskDone = async (weekIndex, taskIndex) => {
    // Optimistic UI update
    setInternship(prev => {
      const wbs = prev.wbs.map((w, wi) => {
        if (wi !== weekIndex) return w;
        return {
          ...w,
          tasks: w.tasks.map((t, ti) =>
            ti === taskIndex ? { ...t, status: 'DONE' } : t
          ),
        };
      });
      return { ...prev, wbs };
    });
    toast.success('Task marked complete! ✅');
  };

  if (loading) return (
    <StudentLayout>
      <div className="page" style={{ maxWidth: 760, margin: '0 auto' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--r-sm)', marginBottom: 16 }} />)}
      </div>
    </StudentLayout>
  );

  if (!internship) return (
    <StudentLayout>
      <div className="empty-state" style={{ marginTop: 80 }}>
        <Lock size={48} style={{ color: 'var(--clr-text-3)', marginBottom: 16 }} />
        <h3>No Active Internship</h3>
        <p className="text-muted">You don't have an active internship. Accept an offer to unlock your Work Breakdown Structure.</p>
      </div>
    </StudentLayout>
  );

  const wbs = internship.wbs || [];
  const totalTasks     = wbs.reduce((s, w) => s + (w.tasks?.length || 0), 0);
  const completedTasks = wbs.reduce((s, w) => s + (w.tasks?.filter(t => t.status === 'DONE').length || 0), 0);
  const completedWeeks = wbs.filter(w => w.tasks?.every(t => t.status === 'DONE')).length;
  const overallPct     = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const progressDays = internship.startDate
    ? Math.floor((new Date() - new Date(internship.startDate)) / (24 * 60 * 60 * 1000))
    : 0;
  const currentWeek = Math.ceil(progressDays / 7) || 1;

  return (
    <StudentLayout>
      <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="page-header">
          <h1>Work Breakdown Structure</h1>
          <p className="text-muted">Your 13-week roadmap for the 90-day internship.</p>
        </div>

        {/* Overall Progress */}
        <div className="card" style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700 }}>Overall WBS Progress</span>
            <span className="text-sm text-muted">{completedTasks}/{totalTasks} tasks · {completedWeeks}/{wbs.length} weeks done</span>
          </div>
          <div style={{ height: 10, background: 'var(--clr-surface-2)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', width: `${overallPct}%`,
              background: 'linear-gradient(90deg, var(--clr-primary), var(--clr-accent))',
              borderRadius: 10, transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>
            <span>Week 1</span>
            <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>{overallPct}% Complete</span>
            <span>Week 13</span>
          </div>
        </div>

        {wbs.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} style={{ marginBottom: 16, color: 'var(--clr-text-3)' }} />
            <h3>WBS Not Generated Yet</h3>
            <p className="text-muted">Your mentor hasn't generated your work plan yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wbs.map((week, wIndex) => {
              const doneTasks  = week.tasks?.filter(t => t.status === 'DONE').length || 0;
              const totalW     = week.tasks?.length || 0;
              const allDone    = doneTasks === totalW && totalW > 0;
              const isCurrent  = week.week === currentWeek;
              const isLocked   = week.week > currentWeek + 1; // allow 1 week ahead

              return (
                <div
                  key={week.week}
                  className="card"
                  style={{
                    border: allDone
                      ? '1px solid rgba(52,211,153,0.4)'
                      : isCurrent
                      ? '1px solid rgba(79,126,248,0.4)'
                      : '1px solid var(--clr-border)',
                    opacity: isLocked ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isLocked ? 'default' : 'pointer' }}
                    onClick={() => !isLocked && setExpanded(expanded === wIndex ? null : wIndex)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                        background: allDone ? 'rgba(52,211,153,0.12)' : isCurrent ? 'rgba(79,126,248,0.12)' : 'var(--clr-surface-2)',
                        color: allDone ? 'var(--clr-success)' : isCurrent ? 'var(--clr-primary)' : 'var(--clr-text-3)',
                        fontSize: '0.85rem',
                      }}>
                        {isLocked ? <Lock size={16} /> : allDone ? <CheckCircle2 size={20} /> : `W${week.week}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          Week {week.week}: {week.topic}
                          {isCurrent && <span className="badge badge-blue" style={{ marginLeft: 8, fontSize: '0.7rem' }}>Current</span>}
                        </div>
                        <div className="text-xs text-muted">{doneTasks}/{totalW} tasks completed</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 80, height: 6, background: 'var(--clr-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${totalW ? (doneTasks / totalW) * 100 : 0}%`,
                          background: allDone ? 'var(--clr-success)' : 'var(--clr-primary)',
                          transition: 'width 0.4s',
                        }} />
                      </div>
                      {!isLocked && (expanded === wIndex ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </div>
                  </div>

                  {expanded === wIndex && !isLocked && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--clr-border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {week.tasks?.map((task, tIndex) => (
                          <div
                            key={tIndex}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                              background: task.status === 'DONE' ? 'rgba(52,211,153,0.06)' : 'var(--clr-surface-2)',
                              borderRadius: 8, transition: 'background 0.2s',
                            }}
                          >
                            <button
                              onClick={() => task.status !== 'DONE' && markTaskDone(wIndex, tIndex)}
                              disabled={task.status === 'DONE'}
                              style={{
                                width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: task.status === 'DONE' ? 'default' : 'pointer',
                                background: task.status === 'DONE' ? 'var(--clr-success)' : 'var(--clr-surface)',
                                color: task.status === 'DONE' ? '#fff' : 'var(--clr-text-3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                outline: task.status !== 'DONE' ? '2px solid var(--clr-border)' : 'none',
                                flexShrink: 0,
                              }}
                            >
                              <Check size={13} />
                            </button>
                            <span style={{
                              flex: 1, fontSize: '0.9rem', fontWeight: 500,
                              textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                              color: task.status === 'DONE' ? 'var(--clr-text-3)' : 'var(--clr-text)',
                            }}>
                              {task.task}
                            </span>
                            {task.status === 'DONE' && <CheckCircle2 size={15} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
