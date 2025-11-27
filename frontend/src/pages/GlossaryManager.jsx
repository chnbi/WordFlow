import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Tag } from 'lucide-react';
import { glossaryAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function GlossaryManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    en: '',
    bm: '',
    zh: '',
    category: 'general',
    doNotTranslate: false,
    notes: ''
  });

  const { data: glossary } = useQuery({
    queryKey: ['glossary'],
    queryFn: async () => {
      const response = await glossaryAPI.getAll({ version: 'v1.0', active: 'true' });
      return response.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => glossaryAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['glossary']);
      toast.success('Glossary term added');
      setIsAdding(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add term');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => glossaryAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['glossary']);
      toast.success('Glossary term updated');
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update term');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => glossaryAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['glossary']);
      toast.success('Glossary term deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete term');
    }
  });

  const resetForm = () => {
    setFormData({
      en: '',
      bm: '',
      zh: '',
      category: 'general',
      doNotTranslate: false,
      notes: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.en || !formData.bm || !formData.zh) {
      toast.error('Please fill in all language fields');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate({ ...formData, version: 'v1.0' });
    }
  };

  const handleEdit = (term) => {
    setEditingId(term._id);
    setFormData({
      en: term.en,
      bm: term.bm,
      zh: term.zh,
      category: term.category,
      doNotTranslate: term.doNotTranslate,
      notes: term.notes || ''
    });
    setIsAdding(true);
  };

  const filteredGlossary = glossary?.filter(term => {
    const matchesSearch = !searchTerm ||
      term.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.bm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.zh.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || term.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(glossary?.map(t => t.category) || [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Glossary Manager</h1>
          <p className="text-gray-500 mt-1">Manage brand terminology and translations</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            resetForm();
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Term</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filterCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                  filterCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Term' : 'Add New Term'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">English *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.en}
                  onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                  placeholder="Yes"
                />
              </div>
              <div>
                <label className="label">Bahasa Malaysia *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.bm}
                  onChange={(e) => setFormData({ ...formData, bm: e.target.value })}
                  placeholder="Yes"
                />
              </div>
              <div>
                <label className="label">中文 (Chinese) *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.zh}
                  onChange={(e) => setFormData({ ...formData, zh: e.target.value })}
                  placeholder="Yes"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="brand">Brand</option>
                  <option value="technical">Technical</option>
                  <option value="product">Product</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="flex items-center pt-7">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    checked={formData.doNotTranslate}
                    onChange={(e) => setFormData({ ...formData, doNotTranslate: e.target.checked })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Do Not Translate (keep as-is)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or usage guidelines..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Update Term' : 'Add Term'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Glossary Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">English</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Bahasa Malaysia</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Chinese</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGlossary && filteredGlossary.length > 0 ? (
                filteredGlossary.map((term) => (
                  <tr key={term._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{term.en}</div>
                      {term.doNotTranslate && (
                        <span className="text-xs text-amber-600 font-medium">DO NOT TRANSLATE</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{term.bm}</td>
                    <td className="py-3 px-4 text-gray-700">{term.zh}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize bg-gray-100 text-gray-800">
                        <Tag className="w-3 h-3 mr-1" />
                        {term.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {term.notes || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(term)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete term "${term.en}"?`)) {
                              deleteMutation.mutate(term._id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No glossary terms found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredGlossary && filteredGlossary.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredGlossary.length} of {glossary?.length || 0} terms
        </div>
      )}
    </div>
  );
}
