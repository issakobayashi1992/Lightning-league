import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../services/firestore';
import { Question } from '../types/firebase';
import { Settings } from 'lucide-react';

interface QuestionEditorProps {
  onBack: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ onBack }) => {
  const { userData } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importedQuestions, setImportedQuestions] = useState<Omit<Question, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [previewingQuestions, setPreviewingQuestions] = useState(false);
  const [filters, setFilters] = useState({
    isPublic: undefined as boolean | undefined,
    subjectArea: '',
    minYear: '',
    maxYear: '',
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, filters]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const allQuestions = await getQuestions({
        coachId: userData?.role === 'coach' ? userData.uid : undefined,
        teamId: userData?.teamId,
        isPublic: filters.isPublic,
      });
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    if (filters.subjectArea) {
      filtered = filtered.filter((q) => q.subjectArea === filters.subjectArea);
    }
    if (filters.minYear) {
      filtered = filtered.filter((q) => q.importYear >= parseInt(filters.minYear));
    }
    if (filters.maxYear) {
      filtered = filtered.filter((q) => q.importYear <= parseInt(filters.maxYear));
    }

    setFilteredQuestions(filtered);
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteQuestion(questionId);
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const handleSave = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
      } else {
        await createQuestion({
          ...questionData,
          createdBy: userData!.uid,
          teamId: questionData.isPublic ? undefined : userData?.teamId,
          importDate: new Date(),
          importYear: new Date().getFullYear(),
        });
      }
      setShowForm(false);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question');
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        const parsed: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>[] = [];

        // Skip header row, start from line 1
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());

          // Validate minimum columns: SubjectArea, Question, CorrectAnswer, Distractor1, Distractor2, Distractor3
          if (values.length >= 6) {
            parsed.push({
              subjectArea: values[0] || 'GK',
              questionText: values[1] || '',
              correctAnswer: values[2] || '',
              distractors: [values[3] || '', values[4] || '', values[5] || ''],
              level: 'MS',
              isPublic: true,
              createdBy: userData!.uid,
              teamId: userData?.teamId,
              importDate: new Date(),
              importYear: new Date().getFullYear(),
            });
          }
        }

        if (parsed.length === 0) {
          alert('No valid questions found in CSV. Please check format.');
          return;
        }

        setImportedQuestions(parsed);
        setPreviewingQuestions(true);
      } catch (error) {
        console.error('Error parsing CSV file:', error);
        alert('Error parsing CSV file: ' + (error as Error).message);
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (importedQuestions.length === 0) {
      alert('No questions to import.');
      return;
    }

    try {
      const questionCount = importedQuestions.length;
      for (const question of importedQuestions) {
        await createQuestion(question);
      }

      setImportedQuestions([]);
      setPreviewingQuestions(false);
      await loadQuestions();

      alert(
        `Import Complete!\n\n${questionCount} question${questionCount !== 1 ? 's' : ''} successfully added to database.`
      );
    } catch (error) {
      console.error('Error importing questions:', error);
      alert('Failed to import some questions. Please check the console for details.');
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url(/Environments/Coach%20Panel.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-white text-2xl drop-shadow-lg">Loading questions...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <QuestionForm
        question={editingQuestion}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingQuestion(null);
        }}
      />
    );
  }

  if (previewingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="bg-purple-900 border-4 border-purple-500 rounded-3xl p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center mb-8 border-b border-purple-500/30 pb-6">
            <Settings className="text-purple-400 mr-4" size={48} />
            <h1 className="text-4xl font-black text-white">PREVIEW QUESTIONS</h1>
            <span className="ml-auto text-purple-400 font-bold">{importedQuestions.length} Questions</span>
          </div>

          <div className="space-y-4 mb-8">
            {importedQuestions.map((q, idx) => (
              <div key={idx} className="bg-purple-950 rounded-xl p-6 border-2 border-purple-800">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded font-bold text-sm">
                    {q.subjectArea}
                  </span>
                  <span className="text-white/50 text-sm">Question {idx + 1}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{q.questionText}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-900/30 border border-green-500 rounded p-2">
                    <span className="text-green-400 text-xs font-bold">CORRECT: </span>
                    <span className="text-white">{q.correctAnswer}</span>
                  </div>
                  {q.distractors.map((d, i) => (
                    <div key={i} className="bg-red-900/20 border border-red-500/30 rounded p-2">
                      <span className="text-red-400 text-xs font-bold">DISTRACTOR {i + 1}: </span>
                      <span className="text-white">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t-2 border-purple-500/30">
            <button
              onClick={() => {
                setPreviewingQuestions(false);
                setImportedQuestions([]);
              }}
              className="flex-1 bg-purple-950 text-white/70 hover:text-white font-bold py-4 rounded-xl border-2 border-white/20"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importedQuestions.length === 0}
              className="flex-1 bg-purple-500 hover:bg-purple-400 text-white font-black py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CONFIRM IMPORT ({importedQuestions.length} QUESTION{importedQuestions.length !== 1 ? 'S' : ''})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Coach%20Panel.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-8 overflow-auto">
        <div className="bg-purple-900 border-4 border-purple-500 rounded-3xl p-12 max-w-6xl w-full">
        <div className="flex items-center mb-8 border-b border-purple-500/30 pb-6">
          <Settings className="text-purple-400 mr-4" size={48} />
          <h1 className="text-4xl font-black text-white">QUESTION EDITOR</h1>
        </div>

        <div className="bg-purple-950 rounded-xl p-6 mb-6">
          <h3 className="text-purple-400 font-bold mb-4 uppercase">Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-white text-sm font-bold mb-2">Visibility</label>
              <select
                value={filters.isPublic === undefined ? 'all' : filters.isPublic ? 'public' : 'private'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    isPublic: e.target.value === 'all' ? undefined : e.target.value === 'public',
                  })
                }
                className="w-full bg-purple-900 text-white p-2 rounded border border-purple-500/30"
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-bold mb-2">Subject</label>
              <select
                value={filters.subjectArea}
                onChange={(e) => setFilters({ ...filters, subjectArea: e.target.value })}
                className="w-full bg-purple-900 text-white p-2 rounded border border-purple-500/30"
              >
                <option value="">All</option>
                <option value="SS">Social Studies</option>
                <option value="SC">Science</option>
                <option value="LA">Language Arts</option>
                <option value="MA">Math</option>
                <option value="AH">Arts & Humanities</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm font-bold mb-2">Min Year</label>
              <input
                type="number"
                value={filters.minYear}
                onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
                className="w-full bg-purple-900 text-white p-2 rounded border border-purple-500/30"
                placeholder="2020"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-bold mb-2">Max Year</label>
              <input
                type="number"
                value={filters.maxYear}
                onChange={(e) => setFilters({ ...filters, maxYear: e.target.value })}
                className="w-full bg-purple-900 text-white p-2 rounded border border-purple-500/30"
                placeholder="2025"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-white font-bold">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
          <div className="flex gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
              id="csv-import"
            />
            <label
              htmlFor="csv-import"
              className="bg-purple-500 hover:bg-purple-400 text-white font-black py-3 px-6 rounded-xl cursor-pointer"
            >
              IMPORT CSV
            </label>
            <button
              onClick={handleCreate}
              className="bg-purple-500 hover:bg-purple-400 text-white font-black py-3 px-6 rounded-xl"
            >
              + CREATE QUESTION
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="bg-purple-950 rounded-xl p-6 border-2 border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-3">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded font-bold text-sm">
                    {q.subjectArea}
                  </span>
                  <span className="bg-cyan-600 text-white px-3 py-1 rounded font-bold text-sm">
                    {q.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className="text-white/50 text-sm">Year: {q.importYear}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(q)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded font-bold text-sm"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded font-bold text-sm"
                  >
                    DELETE
                  </button>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-3">{q.questionText}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-900/30 border border-green-500 rounded p-2">
                  <span className="text-green-400 text-xs font-bold">CORRECT: </span>
                  <span className="text-white">{q.correctAnswer}</span>
                </div>
                {q.distractors.map((d, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-500/30 rounded p-2">
                    <span className="text-red-400 text-xs font-bold">DISTRACTOR {i + 1}: </span>
                    <span className="text-white">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onBack} className="w-full mt-6 bg-purple-950 text-white/70 hover:text-white font-bold py-3 rounded-xl border-2 border-white/20">
          BACK TO DASHBOARD
        </button>
      </div>
      </div>
    </div>
  );
};

const QuestionForm: React.FC<{
  question: Question | null;
  onSave: (data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}> = ({ question, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    subjectArea: question?.subjectArea || 'SS',
    questionText: question?.questionText || '',
    correctAnswer: question?.correctAnswer || '',
    distractors: question?.distractors || ['', '', ''],
    level: question?.level || 'MS',
    isPublic: question?.isPublic ?? true,
    importYear: question?.importYear || new Date().getFullYear(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div 
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Coach%20Panel.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 overflow-auto">
        <div className="bg-purple-900 border-4 border-purple-500 rounded-3xl p-12 max-w-2xl w-full">
        <h2 className="text-3xl font-black text-white mb-6">
          {question ? 'EDIT QUESTION' : 'CREATE QUESTION'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Subject Area</label>
            <select
              value={formData.subjectArea}
              onChange={(e) => setFormData({ ...formData, subjectArea: e.target.value })}
              className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-cyan-400/30"
              required
            >
              <option value="SS">Social Studies</option>
              <option value="SC">Science</option>
              <option value="LA">Language Arts</option>
              <option value="MA">Math</option>
              <option value="AH">Arts & Humanities</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Question Text</label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-cyan-400/30"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-green-400 text-sm font-bold uppercase mb-2">Correct Answer</label>
            <input
              type="text"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-green-400/30"
              required
            />
          </div>
          {formData.distractors.map((distractor, i) => (
            <div key={i}>
              <label className="block text-red-400 text-sm font-bold uppercase mb-2">
                Distractor {i + 1}
              </label>
              <input
                type="text"
                value={distractor}
                onChange={(e) => {
                  const newDistractors = [...formData.distractors];
                  newDistractors[i] = e.target.value;
                  setFormData({ ...formData, distractors: newDistractors });
                }}
                className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-red-400/30"
                required
              />
            </div>
          ))}
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as 'MS' | 'HS' })}
              className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-cyan-400/30"
            >
              <option value="MS">Middle School</option>
              <option value="HS">High School</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Import Year</label>
            <input
              type="number"
              value={formData.importYear}
              onChange={(e) => setFormData({ ...formData, importYear: parseInt(e.target.value) })}
              className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-cyan-400/30"
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-cyan-400 text-sm font-bold uppercase">Public (available to all teams)</span>
            </label>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-purple-950 text-white font-bold py-3 rounded-xl border-2 border-white/20"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 hover:bg-purple-400 text-white font-black py-3 rounded-xl"
            >
              SAVE
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};


