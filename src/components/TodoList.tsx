import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle, PlusCircle, CheckSquare, Square, FileText } from 'lucide-react';
import { Task, SubTask } from '../types';

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Controls for creating a new task
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newEstPomos, setNewEstPomos] = useState(1);
  
  // Expanded task ID for subtask modification and notes views
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');

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
        return { ...t, completed: !t.completed };
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

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const priorityLabels = {
    low: { bg: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50', label: 'Low Pr' },
    medium: { bg: 'bg-accent/10 text-accent border-accent/20', label: 'Medium' },
    high: { bg: 'bg-rose-950/40 text-rose-300 border-rose-900/30', label: 'Urgent' },
  };

  return (
    <div id="todo_list_widget_container" className="bg-theme-panel border border-theme-border backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] shadow-accent/[0.05] w-full flex flex-col transition-all duration-500">
      
      {/* Title block */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs uppercase font-bold tracking-widest font-mono text-zinc-300 flex items-center gap-2">
          <CheckSquare size={15} className="text-accent" />
          Focus Backlog
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">
          {tasks.filter(t => !t.completed).length} items remaining
        </span>
      </div>

      {/* New Task creation form */}
      <form onSubmit={handleCreateTask} className="flex flex-col gap-2.5 mb-5 bg-black/20 p-3 rounded-xl border border-white/5">
        <input
          type="text"
          placeholder="What are we focusing on today?"
          value={newText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewText(e.target.value)}
          className="w-full bg-transparent text-xs text-white border-b border-zinc-800 py-1.5 focus:border-accent focus:outline-none placeholder-zinc-500"
        />

        {/* Configurations layout */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex gap-1">
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

          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-400">
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
            className="flex items-center gap-1 bg-zinc-100 hover:bg-white text-black font-bold tracking-wider rounded-lg px-2.5 py-1 text-[9px] uppercase cursor-pointer transition"
          >
            <Plus size={12} />
            <span>ADD</span>
          </button>
        </div>
      </form>

      {/* Task Filters tabs */}
      <div className="flex gap-1.5 bg-black/20 p-1 rounded-xl mb-4 text-[9px] uppercase font-mono font-bold tracking-wider">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 text-center py-1 rounded-lg transition overflow-hidden cursor-pointer ${
            filter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 text-center py-1 rounded-lg transition overflow-hidden cursor-pointer ${
            filter === 'pending' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Active ({tasks.filter((t) => !t.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 text-center py-1 rounded-lg transition overflow-hidden cursor-pointer ${
            filter === 'completed' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Completed ({tasks.filter((t) => t.completed).length})
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
          filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const completedCount = task.subtasks.filter((s) => s.completed).length;
            const hasSubtasks = task.subtasks.length > 0;

            return (
              <div
                key={task.id}
                className={`flex flex-col border rounded-xl overflow-hidden transition duration-300 bg-black/10 ${
                  task.completed
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
                      <span className={`text-[11px] font-medium leading-relaxed truncate ${
                        task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                      }`}>
                        {task.text}
                      </span>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {/* Priority Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider font-mono border uppercase ${priorityLabels[task.priority].bg}`}>
                          {priorityLabels[task.priority].label}
                        </span>
                        
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
