import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, FileDown, FileJson, Package, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { projectAPI, exportAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ExportPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [exportResult, setExportResult] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    includeJSON: true,
    createZip: true
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectAPI.getById(projectId);
      return response.data.data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['stats', projectId],
    queryFn: async () => {
      const response = await projectAPI.getStats(projectId);
      return response.data.data;
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: () => exportAPI.exportExcel(projectId),
    onSuccess: (response) => {
      setExportResult(response.data.data);
      toast.success('Excel file generated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Export failed');
    }
  });

  const exportPackageMutation = useMutation({
    mutationFn: (options) => exportAPI.exportPackage(projectId, options),
    onSuccess: (response) => {
      setExportResult(response.data.data);
      toast.success('Export package generated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Export failed');
    }
  });

  const handleExportExcel = () => {
    if (stats?.approvedItems === 0) {
      toast.error('No approved translations to export');
      return;
    }
    exportExcelMutation.mutate();
  };

  const handleExportPackage = () => {
    if (stats?.approvedItems === 0) {
      toast.error('No approved translations to export');
      return;
    }
    exportPackageMutation.mutate(exportOptions);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!project) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  const canExport = stats && stats.approvedItems > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Export Translations</h1>
            <p className="text-gray-500">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Export Readiness Check */}
      <div className={`card ${canExport ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-start space-x-4">
          {canExport ? (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold ${canExport ? 'text-green-900' : 'text-yellow-900'}`}>
              {canExport ? 'Ready to Export' : 'Not Ready to Export'}
            </h3>
            <p className={`text-sm mt-1 ${canExport ? 'text-green-700' : 'text-yellow-700'}`}>
              {canExport
                ? `You have ${stats.approvedItems} approved translation(s) ready for export.`
                : 'You need to approve at least one translation before exporting.'
              }
            </p>
            {!canExport && (
              <button
                onClick={() => navigate(`/projects/${projectId}/review`)}
                className="mt-3 btn btn-primary text-sm"
              >
                Go to Review Page
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Total Items</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalItems || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Approved for Export</div>
          <div className="text-3xl font-bold text-green-600">{stats?.approvedItems || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Pending Review</div>
          <div className="text-3xl font-bold text-yellow-600">{stats?.pendingItems || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Export Format</div>
          <div className="text-lg font-bold text-primary-600">Excel + JSON</div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Export Options</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Excel Export */}
            <div className="border rounded-lg p-4 hover:border-primary-500 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileDown className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Excel Only</h3>
                  <p className="text-xs text-gray-500">Recommended</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Export as Excel (.xlsx) file ready for WPML import
              </p>
              <button
                onClick={handleExportExcel}
                className="btn btn-success w-full"
                disabled={!canExport || exportExcelMutation.isPending}
              >
                {exportExcelMutation.isPending ? 'Generating...' : 'Export Excel'}
              </button>
            </div>

            {/* JSON Export */}
            <div className="border rounded-lg p-4 hover:border-primary-500 transition-colors opacity-60">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileJson className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">JSON Only</h3>
                  <p className="text-xs text-gray-500">For developers</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Structured JSON format for automation
              </p>
              <button
                className="btn btn-secondary w-full opacity-50 cursor-not-allowed"
                disabled
              >
                Coming Soon
              </button>
            </div>

            {/* Package Export */}
            <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Complete Package</h3>
                  <p className="text-xs text-primary-700">Best option</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                ZIP package with Excel, JSON, and README
              </p>
              <div className="space-y-2 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                    checked={exportOptions.includeJSON}
                    onChange={(e) => setExportOptions({ ...exportOptions, includeJSON: e.target.checked })}
                  />
                  <span className="ml-2 text-sm text-gray-700">Include JSON file</span>
                </label>
              </div>
              <button
                onClick={handleExportPackage}
                className="btn btn-primary w-full"
                disabled={!canExport || exportPackageMutation.isPending}
              >
                {exportPackageMutation.isPending ? 'Creating Package...' : 'Export Package'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Results */}
      {exportResult && (
        <div className="card bg-green-50 border-green-200">
          <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Export Successful!
          </h2>
          <div className="space-y-3">
            {exportResult.excel && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileDown className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">{exportResult.excel.filename}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(exportResult.excel.size)} • {exportResult.excel.itemCount || stats?.approvedItems} items
                    </div>
                  </div>
                </div>
                <a
                  href={exportResult.excel.downloadUrl}
                  download
                  className="btn btn-success flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {exportResult.json && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileJson className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{exportResult.json.filename}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(exportResult.json.size)}
                    </div>
                  </div>
                </div>
                <a
                  href={exportResult.json.downloadUrl}
                  download
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {exportResult.zip && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-primary-500">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-primary-600" />
                  <div>
                    <div className="font-medium text-gray-900">{exportResult.zip.filename}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(exportResult.zip.size)} • Complete package
                    </div>
                  </div>
                </div>
                <a
                  href={exportResult.zip.downloadUrl}
                  download
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Package</span>
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Download the exported file(s)</li>
              <li>Open the Excel file and review translations</li>
              <li>Follow instructions in the "Instructions" sheet</li>
              <li>Import into WordPress WPML plugin</li>
              <li>Contact weyxuan.chin@ytlcomms.my if you need help</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
