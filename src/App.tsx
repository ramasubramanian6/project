import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Mail, CheckCircle, XCircle, AlertCircle, Users, Clock, Zap } from 'lucide-react';

interface ProcessingStatus {
  total: number;
  success: number;
  failed: number;
  processing: boolean;
  currentIndex?: number;
  errors?: string[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(droppedFile);
      } else {
        alert('Please upload only .xlsx files');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProcessing(true);
    
    const formData = new FormData();
    formData.append('excel', file);

    try {
      // Use local Node.js server instead of Supabase
      const response = await fetch('http://localhost:5000/api/process-bulk-email', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setStatus({
        total: result.total,
        success: result.success,
        failed: result.failed,
        processing: false,
        errors: result.errors
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Show user-friendly error message
      if (error.message.includes('Failed to fetch')) {
        alert('Cannot connect to server. Please make sure the Node.js server is running on http://localhost:5000');
      } else {
        alert(`Upload failed: ${error.message}`);
      }
      
      setStatus(null);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setStatus(null);
    setProcessing(false);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Personalized Bulk Email System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your Excel file and automatically generate personalized investment cards 
            for each recipient with Gmail SMTP delivery.
          </p>
        </div>

        {/* Server Status Notice */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Make sure the Node.js server is running on http://localhost:5000 before uploading files.
              </span>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              <p>Run: <code className="bg-blue-100 px-2 py-1 rounded">cd server && npm run dev</code></p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-3 text-blue-500" />
              Upload Excel File
            </h2>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Required Excel Format:</h3>
                <div className="text-sm text-blue-700">
                  <p>Your Excel file should contain these columns:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Column A:</strong> Name</li>
                    <li><strong>Column B:</strong> Phone</li>
                    <li><strong>Column C:</strong> Email</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              
              {file ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">{file.name}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  
                  <div className="flex space-x-4 justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || processing}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Process File</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-gray-600">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-gray-500">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Processing Status */}
          {status && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-orange-500" />
                Processing Results
              </h2>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Records</p>
                      <p className="text-3xl font-bold text-blue-800">{status.total}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-500" />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Successful</p>
                      <p className="text-3xl font-bold text-green-800">{status.success}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Failed</p>
                      <p className="text-3xl font-bold text-red-800">{status.failed}</p>
                    </div>
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Completion Message */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-medium">Processing Complete!</span>
                </div>
                <p className="text-gray-600 mt-2">
                  {status.success} emails sent successfully via Gmail SMTP, {status.failed} failed.
                </p>
              </div>

              {/* Error Details */}
              {status.errors && status.errors.length > 0 && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {status.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>⚡ Powered by React, Node.js + Express, and Gmail SMTP</p>
        </div>
      </div>
    </div>
  );
}

export default App;