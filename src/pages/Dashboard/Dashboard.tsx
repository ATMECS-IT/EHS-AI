import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import sdsRecordsData from '../../data/sdsRecords.json';
import { GHS_PICTOGRAMS } from '../../components/GHSInfo/GHSInfo';

interface SDSRecord {
  id: number;
  materialId: string;
  materialName: string;
  source: string;
  aiRecommendedDGCode: string;
  rationaleSummary: string;
  ghsPictograms: string[];
  status: string;
  uploadedDate: string;
}

const Dashboard = () => {
  const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);

  useEffect(() => {
    // Load from localStorage if available, otherwise use JSON file
    const savedRecords = localStorage.getItem('sdsRecords');
    let records: SDSRecord[] = [];
    
    if (savedRecords) {
      try {
        records = JSON.parse(savedRecords);
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        records = sdsRecordsData as SDSRecord[];
      }
    } else {
      records = sdsRecordsData as SDSRecord[];
    }
    
    // Deduplicate records by ID to prevent duplicates
    const uniqueRecords = new Map<number, SDSRecord>();
    records.forEach(record => {
      if (!uniqueRecords.has(record.id)) {
        uniqueRecords.set(record.id, record);
      }
    });
    
    setSdsRecords(Array.from(uniqueRecords.values()));
  }, []);

  // Calculate KPI stats
  const kpiStats = useMemo(() => {
    const total = sdsRecords.length;
    const pending = sdsRecords.filter(record => record.status === 'Pending Review').length;
    const approved = sdsRecords.filter(record => record.status === 'Approved').length;
    const rejected = sdsRecords.filter(record => record.status === 'Rejected').length;

    return { total, pending, approved, rejected };
  }, [sdsRecords]);
 
 

  // Get recent classifications (first 4 records in order from JSON)
  const recentClassifications = useMemo(() => {
    // Create a copy to avoid mutating the original array
    return [...sdsRecords].slice(0, 4);
  }, [sdsRecords]);

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Extract UN number from aiRecommendedDGCode
  const getUNNumber = (dgCode: string) => {
    const match = dgCode.match(/UN\d+/);
    return match ? match[0] : '';
  };

  // Prepare data for DG Class Distribution
//   const dgClassDistribution = useMemo(() => {
//     const classMap = new Map<string, number>();
    
//     sdsRecords.forEach(record => {
//       const match = record.aiRecommendedDGCode.match(/Class\s+[\d.]+/);
//       if (match) {
//         const dgClass = match[0];
//         classMap.set(dgClass, (classMap.get(dgClass) || 0) + 1);
//       }
//     });
    
//     return Array.from(classMap.entries())
//       .map(([name, value]) => ({ name, value }))
//       .sort((a, b) => b.value - a.value);
//   }, [sdsRecords]);

  // Review Queue - Pending materials
//   const reviewQueue = useMemo(() => {
//     return sdsRecords
//       .filter(record => record.status === 'Pending Review')
//       .slice(0, 5);
//   }, [sdsRecords]);

  // High Priority Materials - Materials with multiple GHS pictograms or specific hazard codes
  const highPriorityMaterials = useMemo(() => {
    // Use a Map to store unique records by materialName + UN number combination
    const uniqueRecords = new Map<string, SDSRecord>();
    
    sdsRecords.forEach(record => {
      // High priority: 3+ GHS pictograms, or contains GHS06 (Acute Toxicity), or GHS08 (Health Hazard)
      if (record.ghsPictograms.length >= 3 || 
          record.ghsPictograms.includes('GHS06') || 
          record.ghsPictograms.includes('GHS08')) {
        // Extract UN number from aiRecommendedDGCode
        const unNumber = getUNNumber(record.aiRecommendedDGCode);
        // Create a unique key from materialName and UN number
        const uniqueKey = `${record.materialName}-${unNumber}`.toLowerCase().trim();
        
        // Only add if we haven't seen this materialName + UN number combination before
        if (!uniqueRecords.has(uniqueKey)) {
          uniqueRecords.set(uniqueKey, record);
        }
      }
    });
    
    // Convert Map values to array and take first 5
    return Array.from(uniqueRecords.values()).slice(0, 5);
  }, [sdsRecords]);

  // GHS Pictogram Summary
  const ghsPictogramSummary = useMemo(() => {
    const pictogramMap = new Map<string, number>();
    sdsRecords.forEach(record => {
      record.ghsPictograms.forEach(ghs => {
        pictogramMap.set(ghs, (pictogramMap.get(ghs) || 0) + 1);
      });
    });
    return Array.from(pictogramMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sdsRecords]);

  // Material Categories Summary
//   const materialCategories = useMemo(() => {
//     const sourceMap = new Map<string, number>();
//     sdsRecords.forEach(record => {
//       sourceMap.set(record.source, (sourceMap.get(record.source) || 0) + 1);
//     });
//     return Array.from(sourceMap.entries())
//       .map(([source, count]) => ({ source, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [sdsRecords]);

  // Compliance Status
  const complianceStatus = useMemo(() => {
    const total = sdsRecords.length;
    const approved = sdsRecords.filter(r => r.status === 'Approved').length;
    const complianceRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    let status = 'Good';
    let statusColor = 'text-green-600';
    let bgColor = 'bg-green-100';
    
    if (complianceRate < 50) {
      status = 'Critical';
      statusColor = 'text-red-600';
      bgColor = 'bg-red-100';
    } else if (complianceRate < 75) {
      status = 'Warning';
      statusColor = 'text-yellow-600';
      bgColor = 'bg-yellow-100';
    }
    
    return { complianceRate, status, statusColor, bgColor };
  }, [sdsRecords]);

  // Quick Stats
//   const quickStats = useMemo(() => {
//     const totalHazards = sdsRecords.reduce((sum, r) => sum + r.ghsPictograms.length, 0);
    
//     const materialsWithMultipleHazards = sdsRecords.filter(r => r.ghsPictograms.length >= 3).length;
    
//     const pendingReviewRate = kpiStats.total > 0 
//       ? Math.round((kpiStats.pending / kpiStats.total) * 100) 
//       : 0;
    
//     return { totalHazards, materialsWithMultipleHazards, pendingReviewRate };
//   }, [sdsRecords, kpiStats]);

  // System Status
  const systemStatus = useMemo(() => {
    const recentActivity = sdsRecords.filter(r => {
      const date = new Date(r.uploadedDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    
    return {
      isActive: true,
      recentActivity,
      lastUpdate: sdsRecords.length > 0 ? getTimeAgo(sdsRecords[0].uploadedDate) : 'N/A'
    };
  }, [sdsRecords]);

  const navigate = useNavigate();

  // Action Items
  const actionItems = useMemo(() => {
    const items = [];
    if (kpiStats.pending > 0) {
      items.push({
        id: 1,
        title: `${kpiStats.pending} materials pending review`,
        priority: 'high',
        action: () => navigate('/raw-materials?status=Pending Review')
      });
    }
    if (highPriorityMaterials.length > 0) {
      items.push({
        id: 2,
        title: `${highPriorityMaterials.length} high priority materials`,
        priority: 'medium',
        action: () => navigate('/raw-materials')
      });
    }
    if (kpiStats.rejected > 0) {
      items.push({
        id: 3,
        title: `${kpiStats.rejected} rejected classifications need attention`,
        priority: 'medium',
        action: () => navigate('/raw-materials?status=Rejected')
      });
    }
    return items;
  }, [kpiStats, highPriorityMaterials, navigate]);

  // Alerts & Notifications
//   const alerts = useMemo(() => {
//     const alertList = [];
    
//     if (kpiStats.pending > 10) {
//       alertList.push({
//         id: 1,
//         type: 'warning',
//         message: `${kpiStats.pending} materials are awaiting review`,
//         icon: '⚠️'
//       });
//     }
    
//     if (complianceStatus.complianceRate < 75) {
//       alertList.push({
//         id: 2,
//         type: 'error',
//         message: `Compliance rate is below 75% (${complianceStatus.complianceRate}%)`,
//         icon: '🚨'
//       });
//     }
    
//     const highRiskCount = sdsRecords.filter(r => 
//       r.ghsPictograms.includes('GHS06') || r.ghsPictograms.includes('GHS08')
//     ).length;
    
//     if (highRiskCount > 0) {
//       alertList.push({
//         id: 3,
//         type: 'info',
//         message: `${highRiskCount} materials have high-risk hazards (Toxicity/Health)`,
//         icon: 'ℹ️'
//       });
//     }
    
//     return alertList;
//   }, [kpiStats, complianceStatus, sdsRecords]);


  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.total}</p>
              <p className={`text-sm text-green-600 mt-1`}>+12%</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.pending}</p>
              <p className={`text-sm text-yellow-600 mt-1`}>+3%</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.approved}</p>
              <p className={`text-sm text-green-600 mt-1`}>+8%</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.rejected}</p>
              <p className={`text-sm text-red-600 mt-1`}>+5%</p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </div>
      </div>
 
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg text-left font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/raw-materials?status=Pending Review')}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Review Pending</span>
          </button>
          <button
            onClick={() => navigate('/raw-materials?create=true')}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Manual Raw Material</span>
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">View Analytics</span>
          </button>
          <button
            onClick={() => {/* Export functionality */}}
            data-tooltip-id="export-tooltip"
            data-tooltip-content="Export raw materials data as Excel or PDF format"
            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Export Raw Materials Data</span>
          </button>
          <Tooltip
            id="export-tooltip"
            place="top"
            offset={10}
            delayShow={200}
            delayHide={0}
          />
        </div>
      </div>

      {/* Alerts & Notifications */}
      {/* {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg text-left font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{alert.icon}</span>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Compliance Status & System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">{complianceStatus.complianceRate}%</div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${complianceStatus.bgColor} ${complianceStatus.statusColor}`}>
                {complianceStatus.status}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Approved Materials</span>
                <span className="font-medium">{kpiStats.approved} / {kpiStats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${complianceStatus.complianceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Review Time</span>
              <span className="text-sm font-medium text-gray-900">2.5 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent Activity (7 days)</span>
              <span className="text-sm font-medium text-gray-900">{systemStatus.recentActivity} materials</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Update</span>
              <span className="text-sm font-medium text-gray-900">{systemStatus.lastUpdate}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Processing Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {kpiStats.total > 0 ? Math.round((kpiStats.approved / kpiStats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg text-left font-semibold text-gray-900 mb-4">Action Items</h3>
          <div className="space-y-3">
            {actionItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Classifications and DG Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Classifications</h3>
            <button
              onClick={() => navigate('/raw-materials')}
              className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {recentClassifications.map((record) => {
              const unNumber = getUNNumber(record.aiRecommendedDGCode);
              const timeAgo = getTimeAgo(record.uploadedDate);
              const visiblePictograms = record.ghsPictograms.slice(0, 3);
              const remainingCount = record.ghsPictograms.length - 3;
              
              return (
                <div key={record.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Document Icon */}
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    {/* Material Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-left text-gray-900 text-sm">{record.materialName}</h4>
                      <p className="text-xs text-left text-gray-600 mt-0.5">
                        {unNumber} {timeAgo}
                      </p>
                    </div>
                  </div>
                  
                  {/* GHS Pictograms and Status */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* GHS Pictograms */}
                    <div className="flex items-center gap-1">
                      {visiblePictograms.map((ghsCode) => {
                        const ghsData = GHS_PICTOGRAMS[ghsCode];
                        if (!ghsData) return null;
                        
                        return (
                          <div
                            key={ghsCode}
                            className={`w-6 h-6  rounded flex items-center justify-center text-white text-s`}
                            title={ghsData.name}
                          >
                            {ghsData.icon}
                          </div>
                        );
                      })}
                      {remainingCount > 0 && (
                        <div className="w-6 h-6  rounded flex items-center justify-center text-gray-700 text-s font-medium">
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <button className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      record.status === 'Pending Review' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : record.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status === 'Pending Review' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {record.status}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* GHS Pictogram Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GHS Pictogram Summary</h3>
          <div className="space-y-3">
            {ghsPictogramSummary.map((item) => {
              const ghsData = GHS_PICTOGRAMS[item.code];
              if (!ghsData) return null;
              return (
                <div key={item.code} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white">
                      {ghsData.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{ghsData.shortName}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
    
        {/* High Priority Materials */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">High Priority Materials</h3>
            <button
              onClick={() => navigate('/raw-materials')}
              className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {highPriorityMaterials.length > 0 ? (
              (() => {
                // Final deduplication by materialName + UN number before rendering
                const seenCombinations = new Set<string>();
                const uniqueMaterials = highPriorityMaterials.filter(record => {
                  const unNumber = getUNNumber(record.aiRecommendedDGCode);
                  const uniqueKey = `${record.materialName}-${unNumber}`.toLowerCase().trim();
                  
                  if (seenCombinations.has(uniqueKey)) {
                    return false; // Skip duplicate
                  }
                  seenCombinations.add(uniqueKey);
                  return true;
                });

                return uniqueMaterials.map((record) => {
                  const unNumber = getUNNumber(record.aiRecommendedDGCode);
                  const hazardCount = record.ghsPictograms.length;
                  return (
                    <div key={`${record.materialName}-${unNumber}`} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-sm text-gray-900">{record.materialName}</h4>
                        <p className="text-xs text-gray-600 mt-1">{unNumber} • {hazardCount} hazards</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {record.ghsPictograms.slice(0, 2).map((ghsCode) => {
                          const ghsData = GHS_PICTOGRAMS[ghsCode];
                          if (!ghsData) return null;
                          return (
                            <div
                              key={ghsCode}
                              className="w-5 h-5 rounded flex items-center justify-center text-white text-xs"
                              title={ghsData.name}
                            >
                              {ghsData.icon}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No high priority materials</p>
            )}
          </div>
        </div> */}
      </div>

    
      {/* GHS Pictogram Summary & Material Categories & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        

        {/* Material Categories */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Categories</h3>
          <div className="space-y-3">
            {materialCategories.map((category) => (
              <div key={category.source} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{category.source}</span>
                <span className="text-sm font-bold text-gray-700">{category.count}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Quick Stats */}
        {/* <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Hazards Identified</p>
              <p className="text-2xl font-bold text-blue-600">{quickStats.totalHazards}</p>
              <p className="text-xs text-gray-500 mt-1">across all materials</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Multiple Hazards</p>
              <p className="text-2xl font-bold text-orange-600">{quickStats.materialsWithMultipleHazards}</p>
              <p className="text-xs text-gray-500 mt-1">materials with 3+ hazards</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Classification Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {kpiStats.total > 0 ? Math.round((kpiStats.approved / kpiStats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
