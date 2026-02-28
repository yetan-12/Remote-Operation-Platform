import { useState } from 'react';
import { Settings, Download, TrendingUp, Users, Database, Activity, HardDrive, Wifi, Upload, CheckCircle2, AlertCircle, Bell, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import type { User as UserType } from '../types';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import DeviceManagement from './DeviceManagement';
import OperationLog from './OperationLog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface PlatformDashboardProps {
  user: UserType;
}

export default function PlatformDashboard({ user }: PlatformDashboardProps) {
  const [chartTab, setChartTab] = useState<'week' | 'month' | 'year'>('week');
  const [statusTab, setStatusTab] = useState<'clip'>('clip');
  const [activeMenu, setActiveMenu] = useState('数据仪表盘');
  const [showExportReportModal, setShowExportReportModal] = useState(false);
  const [exportReportRange, setExportReportRange] = useState<'all' | 'selected' | 'filtered'>('filtered');
  const [exportReportFormat, setExportReportFormat] = useState<'pdf' | 'excel'>('pdf');

  // 数据采集趋势数据
  const weekData = [
    { name: '周一', session: 12, clip: 98 },
    { name: '周二', session: 19, clip: 156 },
    { name: '周三', session: 15, clip: 132 },
    { name: '周四', session: 22, clip: 178 },
    { name: '周五', session: 18, clip: 145 },
    { name: '周六', session: 8, clip: 65 },
    { name: '周日', session: 5, clip: 42 },
  ];

  const monthData = [
    { name: '第1周', session: 45, clip: 380 },
    { name: '第2周', session: 52, clip: 425 },
    { name: '第3周', session: 48, clip: 395 },
    { name: '第4周', session: 61, clip: 512 },
  ];

  const yearData = [
    { name: '1月', session: 156, clip: 1245 },
    { name: '2月', session: 142, clip: 1187 },
    { name: '3月', session: 178, clip: 1456 },
    { name: '4月', session: 165, clip: 1332 },
    { name: '5月', session: 189, clip: 1567 },
    { name: '6月', session: 201, clip: 1689 },
    { name: '7月', session: 195, clip: 1598 },
    { name: '8月', session: 210, clip: 1745 },
    { name: '9月', session: 198, clip: 1632 },
    { name: '10月', session: 215, clip: 1798 },
    { name: '11月', session: 205, clip: 1701 },
    { name: '12月', session: 198, clip: 1645 },
  ];

  const getChartData = () => {
    switch (chartTab) {
      case 'week':
        return weekData;
      case 'month':
        return monthData;
      case 'year':
        return yearData;
      default:
        return weekData;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧导航栏 */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="font-semibold text-gray-900">数据平台仪表盘</h1>
        </div>

        <nav className="flex-1 p-4">
          {/* 数据仪表盘 */}
          <div className="mb-6">
            <button
              onClick={() => setActiveMenu('数据仪表盘')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeMenu === '数据仪表盘'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Database size={18} />
              <span>数据仪表盘</span>
            </button>
          </div>

          {/* 系统管理 */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 font-medium mb-2 px-3">系统管理</div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveMenu('账户与权限管理')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeMenu === '账户与权限理'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users size={18} />
                <span>账户与权限管理</span>
              </button>
              <button
                onClick={() => setActiveMenu('设备管理')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeMenu === '设备管理'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings size={18} />
                <span>设备管理</span>
              </button>
            </div>
          </div>

          {/* 数据管理 */}
          <div>
            <div className="text-xs text-gray-500 font-medium mb-2 px-3">数据管理</div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveMenu('数据管理')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeMenu === '数据管理'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Database size={18} />
                <span>数据管理</span>
              </button>
              <button
                onClick={() => setActiveMenu('操作日志')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeMenu === '操作日志'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Activity size={18} />
                <span>操作日志</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* 内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 根据选择的菜单显示对应内容 */}
        {activeMenu === '数据管理' ? (
          <AdminDashboard user={user} onLogout={() => {}} />
        ) : activeMenu === '账户与权限管理' ? (
          <UserManagement user={user} onLogout={() => {}} />
        ) : activeMenu === '设备管理' ? (
          <DeviceManagement user={user} onLogout={() => {}} />
        ) : activeMenu === '操作日志' ? (
          <OperationLog user={user} onLogout={() => {}} />
        ) : (
          <>
            {/* 主内容 */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6">
                {/* 页面标题 */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">数据仪表盘</h2>
                    <p className="text-sm text-gray-500">平台运行状态与数据采集概况</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowExportReportModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <FileText size={16} />
                      导出报表
                    </Button>
                  </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* 累计采集数据 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">累计采集数据</span>
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Database size={16} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">12,846</div>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp size={12} className="text-green-600" />
                      <span className="text-green-600 font-medium">+12.5% 上升</span>
                    </div>
                  </div>

                  {/* 当前注册用户 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">当前注册用户</span>
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <Users size={16} className="text-green-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">16</div>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp size={12} className="text-green-600" />
                      <span className="text-green-600 font-medium">+4% 昨日</span>
                    </div>
                  </div>

                  {/* 存储空间使用 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">存储空间使用</span>
                      <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                        <HardDrive size={16} className="text-yellow-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">78%</div>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp size={12} className="text-red-600" />
                      <span className="text-red-600 font-medium">+5.2% 上涨</span>
                    </div>
                  </div>

                  {/* 在线设备数量 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">设备使用情况</span>
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Wifi size={16} className="text-gray-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">8/10</div>
                    <div className="text-xs text-gray-500">80%设备使用中</div>
                  </div>
                </div>

                {/* 图表区域 */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* 数据采集趋势 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-medium text-gray-900">数据采集趋势</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setChartTab('week')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            chartTab === 'week'
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          周
                        </button>
                        <button
                          onClick={() => setChartTab('month')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            chartTab === 'month'
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          月
                        </button>
                        <button
                          onClick={() => setChartTab('year')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            chartTab === 'year'
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          年
                        </button>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getChartData()}
                          margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 5,
                          }}
                        >
                          <defs>
                            <linearGradient id="colorSession" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorClip" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9ca3af"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            labelStyle={{ color: '#111827', fontWeight: 600 }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="line"
                            formatter={(value) => {
                              return value === 'session' ? 'Session数量' : 'Clip数量';
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="session" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fill="url(#colorSession)"
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#2563eb' }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="clip" 
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#colorClip)"
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#059669' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 数据状态分析 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-medium text-gray-900">数据状态分析</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatusTab('clip')}
                          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                            statusTab === 'clip'
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          Clip
                        </button>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '已分配', value: 30, color: '#3b82f6' },
                              { name: '待标注', value: 45, color: '#f59e0b' },
                              { name: '标注完成', value: 85, color: '#10b981' },
                              { name: '已禁用', value: 20, color: '#6b7280' },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: '已分配', value: 30, color: '#3b82f6' },
                              { name: '待标注', value: 45, color: '#f59e0b' },
                              { name: '标注完成', value: 85, color: '#10b981' },
                              { name: '已禁用', value: 20, color: '#6b7280' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 表格区域 */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* 设备使用统计 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-4">设备使用统计</h3>
                    <div className="overflow-y-auto max-h-80 overscroll-contain">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">设备名称</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">设备类型</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">状态</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">采集数据</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">使用率</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">FRANKA-01</td>
                            <td className="py-3 text-sm text-gray-600">机械臂</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">3,245 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">UR5-02</td>
                            <td className="py-3 text-sm text-gray-600">机械臂</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">2,876 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '72%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">GELLO-01</td>
                            <td className="py-3 text-sm text-gray-600">遥操设备</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">1,128 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">3DMouse-01</td>
                            <td className="py-3 text-sm text-gray-600">遥操作设备</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                空闲
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">1,987 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '38%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">FRANKA-02</td>
                            <td className="py-3 text-sm text-gray-600">机械臂</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">2,543 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">UR5-03</td>
                            <td className="py-3 text-sm text-gray-600">机械臂</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">3,156 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '79%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">GELLO-02</td>
                            <td className="py-3 text-sm text-gray-600">遥操设备</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                空闲
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">945 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '32%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">Camera-01</td>
                            <td className="py-3 text-sm text-gray-600">摄像头</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">4,782 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }}></div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 text-sm text-gray-900">Camera-02</td>
                            <td className="py-3 text-sm text-gray-600">摄像头</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                使用中
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">4,621 条</td>
                            <td className="py-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 用户活动统计 */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="font-medium text-gray-900 mb-4">用户活动统计</h3>
                    <div className="overflow-y-auto max-h-80 overscroll-contain">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">姓名</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">角色</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">状态</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">采集数据</th>
                            <th className="text-left text-xs text-gray-500 font-medium pb-3">最近活动</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">张研究员</td>
                            <td className="py-3 text-sm text-gray-600">遥操作操作员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                在线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">1,245 条</td>
                            <td className="py-3 text-sm text-gray-600">10分钟前</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">李标注员</td>
                            <td className="py-3 text-sm text-gray-600">数据标注员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                在线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">审核 876 条</td>
                            <td className="py-3 text-sm text-gray-600">5分钟前</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">王工程师</td>
                            <td className="py-3 text-sm text-gray-600">遥操作操作员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                离线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">987 条</td>
                            <td className="py-3 text-sm text-gray-600">昨天</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">系统管理员</td>
                            <td className="py-3 text-sm text-gray-600">系统管理员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                在线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">系统配置</td>
                            <td className="py-3 text-sm text-gray-600">刚刚</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">赵技术员</td>
                            <td className="py-3 text-sm text-gray-600">遥操作操作员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                在线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">1,532 条</td>
                            <td className="py-3 text-sm text-gray-600">15分钟前</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">刘审核员</td>
                            <td className="py-3 text-sm text-gray-600">数据审核员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                在线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">审核 654 条</td>
                            <td className="py-3 text-sm text-gray-600">20分钟前</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">陈研究员</td>
                            <td className="py-3 text-sm text-gray-600">遥操作操作员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                离线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">823 条</td>
                            <td className="py-3 text-sm text-gray-600">2小时前</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 text-sm text-gray-900">周工程师</td>
                            <td className="py-3 text-sm text-gray-600">遥操作操作员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                在线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">1,098 条</td>
                            <td className="py-3 text-sm text-gray-600">30分钟前</td>
                          </tr>
                          <tr>
                            <td className="py-3 text-sm text-gray-900">吴技术员</td>
                            <td className="py-3 text-sm text-gray-600">遥操作操作员</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                离线
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-900">765 条</td>
                            <td className="py-3 text-sm text-gray-600">昨天</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </>
        )}
      </div>

      {/* 导出报表模态对话框 */}
      {showExportReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">报表导出</h3>
              <button 
                onClick={() => setShowExportReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-5">
              {/* 说明文字 */}
              <p className="text-sm text-gray-600">
                请选择导出报表格式，报表包含统计图表和数据分析
              </p>

              {/* 导出范围 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">报表范围</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportReportRange"
                      checked={exportReportRange === 'all'}
                      onChange={() => setExportReportRange('all')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">完整报表（包含所有统计）</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportReportRange"
                      checked={exportReportRange === 'selected'}
                      onChange={() => setExportReportRange('selected')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">当前页面数据</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportReportRange"
                      checked={exportReportRange === 'filtered'}
                      onChange={() => setExportReportRange('filtered')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">自定义时间范围</span>
                  </label>
                </div>
              </div>

              {/* 导出格式 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">导出格式</h4>
                <div className="flex justify-center">
                  <button
                    className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 w-48"
                  >
                    <FileText size={24} className="text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900 text-center">PDF</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={() => setShowExportReportModal(false)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  alert(`导出${exportReportRange === 'all' ? '完整' : exportReportRange === 'selected' ? '当前页面' : '自定义'}报表为PDF格式`);
                  setShowExportReportModal(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                开始导出
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}