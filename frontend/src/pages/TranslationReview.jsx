import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Edit2, AlertCircle, ArrowLeft } from 'lucide-react';
import { translationAPI, projectAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function TranslationReview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editedContent, setEditedContent] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectAPI.getById(projectId);
      return response.data.data;
    }
  });

  const { data: translations } = useQuery({
    queryKey: ['translations', projectId, filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await translationAPI.getByProject(projectId, params);
      return response.data.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }) => translationAPI.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['translations', projectId]);
      toast.success('Translation updated');
      setEditingId(null);
      setEditedContent({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Update failed');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => translationAPI.approve(id, 'Marketing Team'),
    onSuccess: () => {
      queryClient.invalidateQueries(['translations', projectId]);
      queryClient.invalidateQueries(['stats', projectId]);
      toast.success('Translation approved');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Approval failed');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => translationAPI.reject(id, 'Needs revision'),
    onSuccess: () => {
      queryClient.invalidateQueries(['translations', projectId]);
      toast.success('Translation rejected');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Rejection failed');
    }
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (translationIds) => translationAPI.bulkApprove(translationIds, 'Marketing Team'),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['translations', projectId]);
      queryClient.invalidateQueries(['stats', projectId]);
      toast.success(response.data.message || 'Translations approved');
      setSelectedItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Bulk approval failed');
    }
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (translationIds) => translationAPI.bulkReject(translationIds, 'Needs revision'),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['translations', projectId]);
      queryClient.invalidateQueries(['stats', projectId]);
      toast.success(response.data.message || 'Translations rejected');
      setSelectedItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Bulk rejection failed');
    }
  });

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditedContent({
      bm: item.content.bm,
      zh: item.content.zh
    });
  };

  const handleSave = (id) => {
    updateMutation.mutate({ id, content: editedContent });
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === translations?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(translations?.map(t => t._id) || []);
    }
  };

  const handleBulkApprove = () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }
    bulkApproveMutation.mutate(selectedItems);
  };

  const handleBulkReject = () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }
    bulkRejectMutation.mutate(selectedItems);
  };

  const highlightGlossary = (text, terms) => {
    if (!terms || terms.length === 0) return text;

    let highlighted = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  };

  if (!project) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Translations</h1>
            <p className="text-gray-500">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Bulk Actions & Filters */}
      <div className="card">
        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkApprove}
                  className="btn btn-success flex items-center space-x-2"
                  disabled={bulkApproveMutation.isPending}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve All</span>
                </button>
                <button
                  onClick={handleBulkReject}
                  className="btn btn-danger flex items-center space-x-2"
                  disabled={bulkRejectMutation.isPending}
                >
                  <X className="w-4 h-4" />
                  <span>Reject All</span>
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="btn btn-secondary"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.length === translations?.length && translations?.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Select All</span>
            </label>
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Next Step Guidance */}
      {translations && translations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">Next Steps</h3>
              <p className="text-sm text-blue-700 mt-1">
                {translations.filter(t => t.status === 'pending').length > 0
                  ? `Review ${translations.filter(t => t.status === 'pending').length} pending translation(s). Approve or edit as needed, then export when ready.`
                  : 'All translations approved! Click the Export button to download your translations.'}
              </p>
            </div>
            {translations.filter(t => t.status === 'approved').length === translations.length && (
              <button
                onClick={() => navigate(`/projects/${projectId}/export`)}
                className="btn btn-primary whitespace-nowrap"
              >
                Export Now →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Translation Items */}
      <div className="space-y-4">
        {translations && translations.length > 0 ? (
          translations.map((item) => (
            <div key={item._id} className={`card ${selectedItems.includes(item._id) ? 'ring-2 ring-primary-500' : ''}`}>
              {/* Item Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={() => toggleSelectItem(item._id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">{item.page}</span>
                  <span className="text-xs text-gray-500">→ {item.section}</span>
                  <span className="text-xs text-gray-400">({item.elementType})</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.content.bm && item.content.zh && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      ✓ Translated
                    </span>
                  )}
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    item.status === 'approved' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status === 'approved' ? '✓ Approved' : item.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                  </span>
                </div>
              </div>

              {/* Translation Grid */}
              <div className="grid grid-cols-3 gap-6 mb-4">
                {/* English Source */}
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">English (Source)</div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{item.content.en}</p>
                  </div>
                  {item.glossaryTerms && item.glossaryTerms.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Glossary:</span> {item.glossaryTerms.join(', ')}
                    </div>
                  )}
                </div>

                {/* Malay Translation */}
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">Bahasa Malaysia</div>
                  {editingId === item._id ? (
                    <textarea
                      className="input w-full"
                      rows={4}
                      value={editedContent.bm || ''}
                      onChange={(e) => setEditedContent({ ...editedContent, bm: e.target.value })}
                    />
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p
                        className="text-gray-900"
                        dangerouslySetInnerHTML={{
                          __html: highlightGlossary(item.content.bm, item.glossaryTerms)
                        }}
                      />
                    </div>
                  )}
                  {item.warnings?.bm && (
                    <div className="mt-2 flex items-start space-x-2 text-xs text-amber-600">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{item.warnings.bm}</span>
                    </div>
                  )}
                </div>

                {/* Chinese Translation */}
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">中文 (Chinese)</div>
                  {editingId === item._id ? (
                    <textarea
                      className="input w-full"
                      rows={4}
                      value={editedContent.zh || ''}
                      onChange={(e) => setEditedContent({ ...editedContent, zh: e.target.value })}
                    />
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p
                        className="text-gray-900"
                        dangerouslySetInnerHTML={{
                          __html: highlightGlossary(item.content.zh, item.glossaryTerms)
                        }}
                      />
                    </div>
                  )}
                  {item.warnings?.zh && (
                    <div className="mt-2 flex items-start space-x-2 text-xs text-amber-600">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{item.warnings.zh}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  {item.sourceType === 'ocr' && (
                    <span className="mr-4">OCR Confidence: {item.ocrConfidence}%</span>
                  )}
                  {item.reviewer && (
                    <span>Reviewed by: {item.reviewer}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  {editingId === item._id ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditedContent({});
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(item._id)}
                        className="btn btn-primary"
                        disabled={updateMutation.isPending}
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      {item.status !== 'rejected' && (
                        <button
                          onClick={() => rejectMutation.mutate(item._id)}
                          className="btn btn-danger flex items-center space-x-2"
                          disabled={rejectMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      )}
                      {item.status !== 'approved' && (
                        <button
                          onClick={() => approveMutation.mutate(item._id)}
                          className="btn btn-success flex items-center space-x-2"
                          disabled={approveMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500">No translations to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
