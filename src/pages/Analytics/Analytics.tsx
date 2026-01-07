import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  sections: {
    section9: {
      flashPoint: string;
    };
  };
}

const Analytics = () => {
  const [sdsRecords, setSdsRecords] = useState<SDSRecord[]>([]);

  useEffect(() => {
    // Load from localStorage if available, otherwise use JSON file
    const savedRecords = localStorage.getItem('sdsRecords');
    if (savedRecords) {
      try {
        setSdsRecords(JSON.parse(savedRecords));
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setSdsRecords(sdsRecordsData as SDSRecord[]);
      }
    } else {
      setSdsRecords(sdsRecordsData as SDSRecord[]);
    }
  }, []);

  // Calculate KPI stats
  const kpiStats = useMemo(() => {
    const total = sdsRecords.length;
    const pending = sdsRecords.filter(record => record.status === 'Pending Review').length;
    const approved = sdsRecords.filter(record => record.status === 'Approved').length;
    const rejected = sdsRecords.filter(record => record.status === 'Rejected').length;

    return { total, pending, approved, rejected };
  }, [sdsRecords]);

  // Prepare data for bar chart (past 6 months with approvals and rejections)
  const barChartData = useMemo(() => {
    // Get the last 6 months from the data
    const monthMap = new Map<string, { approved: number; rejected: number; monthName: string }>();
    
    sdsRecords.forEach(record => {
      const date = new Date(record.uploadedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { approved: 0, rejected: 0, monthName });
      }
      
      const monthData = monthMap.get(monthKey);
      if (monthData) {
        if (record.status === 'Approved') {
          monthData.approved++;
        } else if (record.status === 'Rejected') {
          monthData.rejected++;
        }
      }
    });
    
    // Convert to array and sort by date
    const months = Array.from(monthMap.entries())
      .map(([key, data]) => ({
        month: data.monthName,
        monthKey: key,
        Approved: data.approved,
        Rejected: data.rejected,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6); // Get last 6 months
    
    return months;
  }, [sdsRecords]);

  // Prepare data for donut chart
  const donutChartData = useMemo(() => {
    return [
      { name: 'Approved', value: kpiStats.approved, color: '#10b981' },
      { name: 'Rejected', value: kpiStats.rejected, color: '#ef4444' },
      { name: 'Pending Review', value: kpiStats.pending, color: '#f59e0b' },
    ];
  }, [kpiStats]);

  // Calculate Classification Accuracy (based on approval rate)
  const classificationAccuracy = useMemo(() => {
    const totalReviewed = kpiStats.approved + kpiStats.rejected + kpiStats.pending;
    if (totalReviewed === 0) return 0;
    return Math.round((kpiStats.approved / totalReviewed) * 100);
  }, [kpiStats]);

  // Prepare data for Flashpoint Distribution
  const flashpointDistribution = useMemo(() => {
    const ranges = [
      { range: '< 0°C', min: -Infinity, max: 0, count: 0 },
      { range: '0-23°C', min: 0, max: 23, count: 0 },
      { range: '23-60°C', min: 23, max: 60, count: 0 },
      { range: '60-93°C', min: 60, max: 93, count: 0 },
      { range: '> 93°C', min: 93, max: Infinity, count: 0 },
    ];

    sdsRecords.forEach(record => {
      if (record.sections && record.sections.section9 && record.sections.section9.flashPoint) {
        const flashPointStr = record.sections.section9.flashPoint;
        
        // Skip if "Not applicable" or similar
        if (flashPointStr.toLowerCase().includes('not applicable') || 
            flashPointStr.toLowerCase().includes('n/a')) {
          return;
        }

        let celsiusValue: number | null = null;

        // Try multiple patterns to extract Celsius value
        // Pattern 1: (number °C) - e.g., "246 °F (119 °C)"
        let match = flashPointStr.match(/\(([\d.]+)\s*°C\)/);
        if (match && match[1]) {
          celsiusValue = parseFloat(match[1]);
        } else {
          // Pattern 2: number°C (without parentheses) - e.g., "240°C (464°F)"
          match = flashPointStr.match(/([\d.]+)\s*°C/);
          if (match && match[1]) {
            celsiusValue = parseFloat(match[1]);
          } else {
            // Pattern 3: number °C (with space, no parentheses) - e.g., "9.7 °C (closed cup)"
            match = flashPointStr.match(/([\d.]+)\s*°C/);
            if (match && match[1]) {
              celsiusValue = parseFloat(match[1]);
            }
          }
        }

        // If we found a valid Celsius value, categorize it
        if (celsiusValue !== null && !isNaN(celsiusValue)) {
          // Handle edge cases for range boundaries
          for (const range of ranges) {
            if (range.min === -Infinity) {
              // For < 0°C range
              if (celsiusValue < range.max) {
                range.count++;
                break;
              }
            } else if (range.max === Infinity) {
              // For > 93°C range
              if (celsiusValue >= range.min) {
                range.count++;
                break;
              }
            } else {
              // For ranges with both min and max
              if (celsiusValue >= range.min && celsiusValue < range.max) {
                range.count++;
                break;
              }
            }
          }
        }
      }
    });

    // Return all ranges to show complete distribution
    return ranges;
  }, [sdsRecords]);

  // Prepare data for GHS Class Frequency
  const ghsFrequency = useMemo(() => {
    const ghsMap = new Map<string, number>();
    
    sdsRecords.forEach(record => {
      record.ghsPictograms.forEach(ghsCode => {
        ghsMap.set(ghsCode, (ghsMap.get(ghsCode) || 0) + 1);
      });
    });

    return Array.from(ghsMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [sdsRecords]);

  // GHS Pictogram Summary (Top 5)
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

  // Prepare data for DG Class Frequency
  const dgClassFrequency = useMemo(() => {
    const classMap = new Map<string, number>();
    
    sdsRecords.forEach(record => {
      let dgClass = '';
      const dgCode = record.aiRecommendedDGCode || '';
      
      // Try to extract Class number (e.g., "Class 3", "Class 9")
      const classMatch = dgCode.match(/Class\s+([\d.]+)/);
      if (classMatch) {
        dgClass = `Class ${classMatch[1]}`;
      } else {
        // Handle other formats
        if (dgCode.toLowerCase().includes('not regulated') || 
            dgCode.toLowerCase().includes('not dangerous')) {
          dgClass = 'Not Regulated';
        } else if (dgCode.includes('NA1993') || 
                   dgCode.toLowerCase().includes('combustible liquid')) {
          dgClass = 'Combustible Liquid (NA1993)';
        } else if (dgCode.includes('UN') && dgCode.includes('Class')) {
          // Extract class from formats like "UN3082 - Class 9"
          const altMatch = dgCode.match(/Class\s+([\d.]+)/);
          if (altMatch) {
            dgClass = `Class ${altMatch[1]}`;
          } else {
            // If we have UN number but no class, use the UN number
            const unMatch = dgCode.match(/UN\d+/);
            dgClass = unMatch ? unMatch[0] : 'Other';
          }
        } else if (dgCode.trim() === '') {
          dgClass = 'Not Specified';
        } else {
          dgClass = 'Other';
        }
      }
      
      if (dgClass) {
        classMap.set(dgClass, (classMap.get(dgClass) || 0) + 1);
      }
    });
    
    return Array.from(classMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [sdsRecords]);
 
  
 


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
            <div className="flex items-center justify-center">
              {/* <div className="text-4xl">📊</div> */}
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.pending}</p>
              <p className={`text-sm text-green-600 mt-1`}>+3%</p>
            </div>
            <div className="flex items-center justify-center">
              {/* <div className="text-4xl">⏳</div> */}
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.approved}</p>
              <p className={`text-sm text-green-600 mt-1`}>+8%</p>
            </div>
            <div className="flex items-center justify-center">
              {/* <div className="text-4xl">✅</div> */}
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiStats.rejected}</p>
              <p className={`text-sm text-green-600 mt-1`}>+5%</p>
            </div>
            <div className="flex items-center justify-center">
              {/* <div className="text-4xl">❌</div> */}
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Classification Accuracy Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification Accuracy</h3>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-2">{classificationAccuracy}%</div>
            {/* <p className="text-sm text-gray-600">Based on {kpiStats.approved + kpiStats.rejected + kpiStats.pending} total classifications</p> */}
            <p className="text-sm text-gray-600">{kpiStats.approved} approved out of {kpiStats.approved + kpiStats.rejected + kpiStats.pending} total classifications</p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Approvals and Rejections Over Past 6 Months */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval vs Rejection Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Approved" fill="#10b981" name="Approved" />
              <Bar dataKey="Rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart - Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) => 
                  name && percent !== undefined ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {donutChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flashpoint Distribution and GHS/DG Class Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
        {/* DG Class Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">DG Class Frequency</h3>
             <ResponsiveContainer width="100%" height={300}>
             <BarChart data={dgClassFrequency} margin={{ bottom: 50 }}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis 
                   dataKey="name" 
                   angle={-45}
                   textAnchor="end"
                   
                   interval={0}
                   tick={{ fontSize: 11 }}
                   tickFormatter={(value) => {
                     // Truncate long text with ellipses
                     const maxLength = 15;
                     if (value.length > maxLength) {
                       return value.substring(0, maxLength) + '...';
                     }
                     return value;
                   }}
                 />
                 <YAxis />
                 <Tooltip 
                   formatter={(value: any) => value}
                   labelFormatter={(label) => {
                     // Show full text in tooltip
                     return label;
                   }}
                 />
                 <Bar dataKey="count" fill="#f59e0b" name="Frequency" />
             </BarChart>
             </ResponsiveContainer>
         </div>

        {/* GHS Class Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GHS Class Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ghsFrequency} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
              dataKey="code" 
                   angle={-45}
                   textAnchor="end"
                   
                   interval={0}
                   tick={{ fontSize: 11 }}
                   tickFormatter={(value) => {
                     // Truncate long text with ellipses
                     const maxLength = 15;
                     if (value.length > maxLength) {
                       return value.substring(0, maxLength) + '...';
                     }
                     return value;
                   }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Frequency" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Flashpoint Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flashpoint Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={flashpointDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="range" type="category" width={80} reversed />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Count" />
                    </BarChart>
                </ResponsiveContainer>
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
            
      </div>
    </div>
  );
};

export default Analytics;
