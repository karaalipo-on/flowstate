import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle, PlusCircle, CheckSquare, Square, FileText, GripVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, SubTask } from '../types';

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Work' | 'Personal' | 'Study' | 'General'>('all');
  
  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOverIndex, setIsOverIndex] = useState<number | null>(null);
  
  // Single Primary Session Goal
  const [primaryFocus, setPrimaryFocus] = useState(() => {
    try {
      return localStorage.getItem('flowstate_primary_focus') || '';
    } catch {
      return '';
    }
  });

  const [isPrimaryCompleted, setIsPrimaryCompleted] = useState(() => {
    try {
      return localStorage.getItem('flowstate_primary_completed') === 'true';
    } catch {
      return false;
    }
  });
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const togglePrimaryCompleted = () => {
    setIsPrimaryCompleted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('flowstate_primary_completed', String(next));
        window.dispatchEvent(new CustomEvent('zenspace_tasks_updated'));
      } catch {}
      return next;
    });
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      goal: primaryFocus,
      text: reflection.trim()
    };
    try {
      const stored = localStorage.getItem('flowstate_reflections') || '[]';
      const list = JSON.parse(stored);
      list.push(newEntry);
      localStorage.setItem('flowstate_reflections', JSON.stringify(list));
      setReflectionSaved(true);
      setReflection('');
      setTimeout(() => setReflectionSaved(false), 3000);
    } catch (err) {
      console.warn("Failed to save reflection:", err);
    }
  };
  
  // Controls for creating a new task
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState<'Work' | 'Personal' | 'Study' | 'General'>('General');
  const [newEstPomos, setNewEstPomos] = useState(1);
  
  // Expanded task ID for subtask modification and notes views
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Primary Focus sync
  useEffect(() => {
    try {
      localStorage.setItem('flowstate_primary_focus', primaryFocus);
    } catch (e) {
      console.warn("Could not save primary focus:", e);
    }
  }, [primaryFocus]);

  // First cycle sync: Load from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zenspace_tasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load tasks from localStorage:", e);
    }
  }, []);

  // Save changes to storage
  const saveTasks = (allTasks: Task[]) => {
    setTasks(allTasks);
    try {
      localStorage.setItem('zenspace_tasks', JSON.stringify(allTasks));
      window.dispatchEvent(new CustomEvent('zenspace_tasks_updated'));
    } catch (e) {
      console.warn("Could not save tasks to localStorage:", e);
    }
  };

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newText.trim(),
      completed: false,
      priority: newPriority,
      category: newCategory,
      estimatedPomodoros: newEstPomos,
      completedPomodoros: 0,
      subtasks: [],
      createdAt: Date.now(),
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    
    // Clear prompt inputs
    setNewText('');
    setNewPriority('medium');
    setNewCategory('General');
    setNewEstPomos(1);
    
    // Auto expand the new task to encourage immediate work flow
    setExpandedTaskId(newTask.id);
  };

  const handleDeleteTask = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    if (expandedTaskId === id) {
      setExpandedTaskId(null);
    }
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const completed = !t.completed;
        return { 
          ...t, 
          completed,
          completedAt: completed ? Date.now() : undefined
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskText.trim()) return;
    const newSub: SubTask = {
      id: Date.now().toString(),
      text: newSubtaskText.trim(),
      completed: false,
    };

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, subtasks: [...t.subtasks, newSub] };
      }
      return t;
    });
    saveTasks(updated);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)),
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteSubtask = (taskId: string, subId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.filter((s) => s.id !== subId),
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleUpdateNotes = (taskId: string, notes: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, notes };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleIncrementPomo = (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, completedPomodoros: t.completedPomodoros + 1 };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setIsOverIndex(index);
    if (draggedIndex === null || draggedIndex === index) return;

    const sourceTask = filteredTasks[draggedIndex];
    const targetTask = filteredTasks[index];

    if (!sourceTask || !targetTask) return;

    // Find indicators inside main array
    const sourcePos = tasks.findIndex((t) => t.id === sourceTask.id);
    const targetPos = tasks.findIndex((t) => t.id === targetTask.id);

    if (sourcePos !== -1 && targetPos !== -1) {
      const reordered = [...tasks];
      const [removed] = reordered.splice(sourcePos, 1);
      reordered.splice(targetPos, 0, removed);
      
      setTasks(reordered);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    saveTasks(tasks);
    setDraggedIndex(null);
    setIsOverIndex(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Completion filter
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const priorityLabels = {
    low: { bg: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50', label: 'Low Pr' },
    medium: { bg: 'bg-accent/10 text-accent border-accent/20', label: 'Medium' },
    high: { bg: 'bg-rose-950/40 text-rose-300 border-rose-900/30', label: 'Urgent' },
  };

  const categoryLabels: Record<string, { bg: string; label: string }> = {
    General: { bg: 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80', label: '📁 General' },
    Work: { bg: 'bg-blue-950/40 text-blue-300 border-blue-900/30', label: '💼 Work' },
    Personal: { bg: 'bg-purple-950/40 text-purple-300 border-purple-900/30', label: '🏠 Personal' },
    Study: { bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30', label: '📚 Study' },
  };

  // Productivity metrics for circular progress ring
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const percentageCompleted = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div id="todo_list_widget_container" className="bg-theme-panel border border-theme-border backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] shadow-accent/[0.05] w-full flex flex-col transition-all duration-500">
      
      {/* Title block */}
      <div className="flex justify-between items-center mb-3">
        <div id="todo_header_title_ring" className="flex items-center gap-2.5">
          {/* Circular Progress Ring */}
          <div 
            id="todo_circular_progress_container" 
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-zinc-950/50 border border-white/5 shadow-inner"
            title={`${percentageCompleted}% of daily tasks completed`}
          >
            <svg className="absolute w-8 h-8 -rotate-90">
              {/* Background circle track */}
              <circle
                cx="16"
                cy="16"
                r="13"
                className="stroke-zinc-800/50"
                strokeWidth="2"
                fill="transparent"
              />
              {/* Foreground interactive progress circle */}
              <circle
                cx="16"
                cy="16"
                r="13"
                className="stroke-accent transition-all duration-500 ease-out"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray="81.68"
                strokeDashoffset={81.68 - (81.68 * percentageCompleted) / 100}
                strokeLinecap="round"
              />
            </svg>
            <CheckSquare size={13} className="text-accent relative z-10 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <h3 className="text-xs uppercase font-bold tracking-widest font-mono text-zinc-300">
              Focus Backlog
            </h3>
            <span className="text-[9px] font-mono font-bold text-accent tracking-wide uppercase">
              {percentageCompleted}% Completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown filter for category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-black/40 border border-white/5 rounded-lg text-[10px] font-mono p-1.5 px-2 text-zinc-305 focus:outline-none focus:border-accent cursor-pointer select-none"
            title="Filter tasks by category"
          >
            <option value="all">📂 All Tags</option>
            <option value="General">General</option>
            <option value="Work">💼 Work</option>
            <option value="Personal">🏠 Personal</option>
            <option value="Study">📚 Study</option>
          </select>

          <span className="text-[10px] font-mono text-zinc-550 shrink-0">
             ({tasks.filter(t => !t.completed).length} left)
          </span>
        </div>
      </div>

      {/* Primary Session Goal Input Block */}
      <div id="primary_daily_focus_goal" className={`mb-4 p-3 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 shadow-inner ${
        isPrimaryCompleted
          ? 'bg-emerald-950/20 border-emerald-500/20'
          : 'bg-zinc-950/40 border-white/5'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" role="img" aria-label="Target">🎯</span>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${
              isPrimaryCompleted ? 'text-emerald-400 font-extrabold' : 'text-accent'
            }`}>
              {isPrimaryCompleted ? '✓ Primary Goal Completed' : 'Primary Session focus'}
            </span>
          </div>
          {primaryFocus && (
            <button
              type="button"
              onClick={togglePrimaryCompleted}
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded transition cursor-pointer select-none ${
                isPrimaryCompleted
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-accent/10 border border-accent/25 text-accent hover:bg-accent/20'
              }`}
            >
              {isPrimaryCompleted ? 'Reopen Goal' : 'Complete Goal'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {primaryFocus && (
            <button
              type="button"
              onClick={togglePrimaryCompleted}
              className={`text-zinc-500 transition hover:scale-105 cursor-pointer ${
                isPrimaryCompleted ? 'text-emerald-400' : 'text-zinc-500 hover:text-accent'
              }`}
              title={isPrimaryCompleted ? "Mark Uncompleted" : "Mark Goal Completed"}
            >
              {isPrimaryCompleted ? (
                <CheckCircle2 size={15} className="text-emerald-400" />
              ) : (
                <Circle size={15} />
              )}
            </button>
          )}
          <input
            type="text"
            placeholder="Set a single clear session goal..."
            value={primaryFocus}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPrimaryFocus(e.target.value);
              if (isPrimaryCompleted && !e.target.value) {
                setIsPrimaryCompleted(false);
                localStorage.setItem('flowstate_primary_completed', 'false');
              }
            }}
            disabled={isPrimaryCompleted}
            className={`w-full bg-transparent text-xs font-medium text-white placeholder-zinc-500 focus:outline-none transition-all ${
              isPrimaryCompleted ? 'line-through text-zinc-500 font-normal italic' : 'pb-0.5 focus:border-b focus:border-white/10'
            }`}
          />
          {primaryFocus && !isPrimaryCompleted && (
            <button
              type="button"
              onClick={() => {
                setPrimaryFocus('');
                setIsPrimaryCompleted(false);
                localStorage.setItem('flowstate_primary_completed', 'false');
              }}
              className="text-[11px] text-zinc-500 hover:text-white transition px-1 cursor-pointer"
              title="Clear primary focus"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Daily Reflection prompt card */}
      {isPrimaryCompleted && primaryFocus && (
        <div id="daily_reflection_prompt_card" className="mb-4 bg-gradient-to-br from-indigo-950/40 to-violet-950/20 p-4.5 rounded-xl border border-indigo-500/20 flex flex-col gap-3 shadow-[0_4px_24px_rgba(var(--accent-glow),0.02)] transition duration-305">
          <div className="flex items-center gap-2">
            <span className="text-xs">✨</span>
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-300 tracking-wider">
              ✦ Daily Reflection Card
            </span>
          </div>

          <h4 className="text-xs font-sans font-semibold text-zinc-200 leading-relaxed">
            Congratulations on completing your primary goal: "{primaryFocus}"! How did it go, and what was the main takeaway?
          </h4>

          {reflectionSaved ? (
            <div className="py-2.5 text-center text-xs font-semibold text-emerald-400 font-mono flex items-center justify-center gap-1.5 bg-emerald-950/15 border border-emerald-500/10 rounded-lg">
              <span>✦ Journal reflection saved securely!</span>
            </div>
          ) : (
            <form onSubmit={handleSaveReflection} className="flex flex-col gap-2.5">
              <textarea
                placeholder="Write a quick reflection entry..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/5 rounded-xl p-3 text-zinc-200 placeholder-zinc-600 min-h-20 focus:outline-none focus:border-indigo-500/45 resize-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-mono text-[9px] font-bold uppercase rounded-lg tracking-widest transition select-none cursor-pointer text-center"
              >
                Save Reflection Entry
              </button>
            </form>
          )}
        </div>
      )}

      {/* New Task creation form */}
      <form onSubmit={handleCreateTask} className="flex flex-col gap-2.5 mb-5 bg-black/20 p-3 rounded-xl border border-white/5">
        <input
          type="text"
          placeholder="What are we focusing on today?"
          value={newText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewText(e.target.value)}
          className="w-full bg-transparent text-xs text-white border-b border-zinc-800 py-1.5 focus:border-accent focus:outline-none placeholder-zinc-500"
        />

        {/* Category picker selection */}
        <div className="flex items-center gap-2 py-0.5">
          <span className="text-[8px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
            Tag:
          </span>
          <div className="flex gap-1">
            {(['General', 'Work', 'Personal', 'Study'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewCategory(cat)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider border transition cursor-pointer uppercase ${
                  newCategory === cat
                    ? cat === 'Work'
                      ? 'bg-blue-900/60 text-blue-200 border-blue-500/50'
                      : cat === 'Personal'
                        ? 'bg-purple-900/60 text-purple-200 border-purple-500/50'
                        : cat === 'Study'
                          ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/50'
                          : 'bg-zinc-700/80 text-white border-zinc-400/50'
                    : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Configurations layout */}
        <div className="flex flex-wrap items-center justify-between gap-y-2.5 gap-x-1.5 w-full">
          <div className="flex gap-1 flex-wrap">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setNewPriority(p)}
                className={`px-2 py-1 text-[9px] font-mono font-bold tracking-wider rounded border transition cursor-pointer uppercase ${
                  newPriority === p
                    ? 'bg-accent border-accent text-white'
                    : 'bg-zinc-900/60 border-zinc-700/40 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-400 whitespace-nowrap">
            <span>Est. Pomos:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={newEstPomos}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEstPomos(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 bg-zinc-800/40 text-center py-0.5 border border-white/5 rounded text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-1 bg-zinc-100 hover:bg-white text-black font-bold tracking-wider rounded-lg px-2.5 py-1 text-[9px] uppercase cursor-pointer transition shrink-0 ml-auto sm:ml-0"
          >
            <Plus size={12} strokeWidth={2.5} />
            <span>ADD</span>
          </button>
        </div>
      </form>

      {/* Task Filters tabs */}
      <div className="flex gap-1.5 bg-black/30 p-1 rounded-xl mb-4 text-[9px] uppercase font-mono font-bold tracking-wider">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 text-center py-1.5 rounded-lg transition overflow-hidden cursor-pointer ${
            filter === 'pending' ? 'bg-zinc-100 text-zinc-950 font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          Active ({tasks.filter((t) => !t.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 text-center py-1.5 rounded-lg transition overflow-hidden cursor-pointer ${
            filter === 'completed' ? 'bg-zinc-100 text-zinc-950 font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          Completed ({tasks.filter((t) => t.completed).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 text-center py-1.5 rounded-lg transition overflow-hidden cursor-pointer ${
            filter === 'all' ? 'bg-zinc-100 text-zinc-950 font-extrabold shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          All ({tasks.length})
        </button>
      </div>

      {/* Tasks stack list */}
      <div className="flex flex-col gap-2 max-h-76 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/5 rounded-xl bg-black/5">
            <p className="text-zinc-500 text-[10px] tracking-wide font-mono uppercase">
              No tasks matched selected scope
            </p>
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const isExpanded = expandedTaskId === task.id;
            const completedCount = task.subtasks.filter((s) => s.completed).length;
            const hasSubtasks = task.subtasks.length > 0;

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={() => setIsOverIndex(null)}
                className={`flex flex-col border rounded-xl overflow-hidden transition-all duration-200 bg-black/10 ${
                  draggedIndex === index
                    ? 'opacity-40 border-accent/40 scale-[0.98] bg-zinc-950/30'
                    : isOverIndex === index
                      ? 'border-accent bg-accent/5'
                      : task.completed
                        ? 'border-white/5 opacity-60'
                        : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Main clickable cell info */}
                <div
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="flex items-center justify-between gap-3 p-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Visual drag grip handle */}
                    <div 
                      className="text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-0.5 transition"
                      title="Drag to reorder and prioritize"
                    >
                      <GripVertical size={13} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id);
                      }}
                      className="text-zinc-400 hover:text-accent transition cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckSquare size={16} className="text-accent" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-medium leading-relaxed truncate ${
                          task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}>
                          {task.text}
                        </span>
                        {task.category && task.category !== 'General' && (
                          <span className={`px-1 rounded text-[7px] font-bold tracking-wide font-mono uppercase bg-accent/20 border border-accent/35 text-white`}>
                            {task.category}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {/* Priority Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider font-mono border uppercase ${priorityLabels[task.priority].bg}`}>
                          {priorityLabels[task.priority].label}
                        </span>

                        {/* Category Badge */}
                        {task.category && (
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider font-mono border uppercase ${categoryLabels[task.category]?.bg || 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'}`}>
                            {categoryLabels[task.category]?.label || task.category}
                          </span>
                        )}
                        
                        {/* Subtask micro indicator */}
                        {hasSubtasks && (
                          <span className="text-[8px] font-mono text-zinc-500">
                            {completedCount}/{task.subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right hand details: Pomodoro counter & delete */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleIncrementPomo(task.id, e)}
                      className="flex items-center gap-1 bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/5 px-2 py-0.5 rounded-lg text-zinc-400 hover:text-white transition text-[9px] font-mono tracking-wider cursor-pointer"
                      title="Completed 1 Pomodoro session for this task"
                    >
                      <span>🍅</span>
                      <span>{task.completedPomodoros}/{task.estimatedPomodoros}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="text-zinc-600 hover:text-[#ff4a4a] p-1.5 transition cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                    
                    <div>
                      {isExpanded ? <ChevronUp size={13} className="text-zinc-500" /> : <ChevronDown size={13} className="text-zinc-500" />}
                    </div>
                  </div>
                </div>

                {/* Expanded configuration elements (Subtasks, notes) */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5 bg-black/15 flex flex-col gap-3">
                    
                    {/* Subtasks listing */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[8px] font-bold font-mono tracking-widest text-zinc-500 uppercase">
                        Subtasks list
                      </span>

                      {task.subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between gap-2 pl-1.5">
                           <button
                            type="button"
                            onClick={() => handleToggleSubtask(task.id, sub.id)}
                            className="flex items-center gap-2 text-left text-[10px] text-zinc-400 hover:text-white flex-1 select-none cursor-pointer"
                          >
                            {sub.completed ? (
                              <CheckCircle2 size={13} className="text-accent" />
                            ) : (
                              <Circle size={13} className="text-zinc-600" />
                            )}
                            <span className={sub.completed ? 'line-through text-zinc-600' : ''}>
                              {sub.text}
                            </span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(task.id, sub.id)}
                            className="text-zinc-700 hover:text-[#ff4a4a] p-1 transition cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}

                      {/* Add subtask trigger prompt inline */}
                      <div className="flex items-center gap-1.5 pl-1.5">
                        <input
                          type="text"
                          placeholder="Add detail item..."
                          value={newSubtaskText}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtask(task.id);
                            }
                          }}
                          className="bg-transparent text-[10px] text-zinc-300 border-b border-zinc-800 py-1 flex-1 focus:border-accent focus:outline-none placeholder-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubtask(task.id)}
                          className="text-zinc-500 hover:text-white p-1 transition cursor-pointer"
                        >
                          <PlusCircle size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Quick Scratch notes field for the task */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-bold font-mono tracking-widest text-[#9ca3af] uppercase flex items-center gap-1">
                        <FileText size={10} />
                        Task Scratch Workspace
                      </span>
                      <textarea
                        placeholder="Key requirements, research links, or intermediate progress thoughts..."
                        value={task.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateNotes(task.id, e.target.value)}
                        className="w-full bg-zinc-950/40 text-[10px] text-zinc-300 border border-white/5 rounded-lg p-2 focus:border-accent focus:outline-none placeholder-zinc-600 h-16 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
