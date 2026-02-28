import { useMemo, useState } from 'react';
import { Search, Download, ChevronDown, ChevronUp, Info, CheckCircle2, XCircle, AlertTriangle, X, FileText, Users, Database, Settings, Key, Power, Upload, Eye } from 'lucide-react';
import { Button } from './ui/button';
import type { User } from '../types';
import DateRangePicker from './DateRangePicker';
import { useOperationLogs, type OperationLogEntry } from '../contexts/OperationLogContext';

interface OperationLogProps {
  user: User;
  onLogout: () => void;
}

export default function OperationLog({ user, onLogout }: OperationLogProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperationLogEntry | null>(null);
  const [exportRange, setExportRange] = useState<'all' | 'selected' | 'filtered'>('filtered');
  const { logs, clearLogs } = useOperationLogs();
  
  // 日期筛选状态
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const successRate = useMemo(() => {
    if (logs.length === 0) return 0;
    return Math.round((logs.filter((l) => l.status === 'Success').length / logs.length) * 100);
  }, [logs]);

  const getOperationTypeBadge = (type: string) => {
    const styles = {
      Login: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Key },
      DataCollection: { bg: 'bg-green-100', text: 'text-green-700', icon: Upload },
      DataReview: { bg: 'bg-purple-100', text: 'text-purple-700', icon: CheckCircle2 },
      DeviceManagement: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Settings },
      UserManagement: { bg: 'bg-pink-100', text: 'text-pink-700', icon: Users },
      SystemConfig: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Settings },
      Export: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Download },
    };
    const labels = {
      Login: '登录',
      DataCollection: '数据采集',
      DataReview: '数据标注',
      DeviceManagement: '设备管理',
      UserManagement: '用户管理',
      SystemConfig: '系统配置',
      Export: '数据导出',
    };
    const config = styles[type as keyof typeof styles];
    return { 
      bg: config.bg, 
      text: config.text, 
      label: labels[type as keyof typeof labels],
      icon: config.icon
    };
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      Admin: 'bg-purple-100 text-purple-700',
      Reviewer: 'bg-blue-100 text-blue-700',
      Collector: 'bg-green-100 text-green-700',
    };
    const labels = {
      Admin: '管理员',
      Reviewer: '标注员',
      Collector: '采集员',
    };
    return { style: styles[role as keyof typeof styles], label: labels[role as keyof typeof labels] };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Success') {
      return { style: 'bg-green-100 text-green-700', label: '成功', icon: CheckCircle2 };
    }
    return { style: 'bg-red-100 text-red-700', label: '失败', icon: XCircle };
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">操作日志</h1>
              <p className="text-sm text-gray-500">记录系统所有用户操作及活动轨迹</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={clearLogs}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 flex items-center gap-2"
              >
                <X size={18} />
                清空日志
              </Button>
              <Button 
                onClick={() => setShowExportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Download size={18} />
                导出日志
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">今日总操作</span>
                <Info size={16} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
              <div className="text-xs text-gray-500 mt-1">操作记录</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">成功操作</span>
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.status === 'Success').length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                成功率 {successRate}%
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">失败操作</span>
                <XCircle size={16} className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.status === 'Failed').length}
              </div>
              <div className="text-xs text-gray-500 mt-1">需要处理</div>
            </div>
          </div>

          {/* 筛选条件区域 */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {isFilterExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                <span className="font-medium text-gray-900">筛选条件</span>
              </div>
              <span className="text-sm text-blue-600 hover:underline">重置条件</span>
            </button>

            {isFilterExpanded && (
              <div className="px-4 pb-4 space-y-4">
                {/* 第一行筛选 */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">操作用户</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option>全部用户</option>
                      <option>张研究员</option>
                      <option>范标注员</option>
                      <option>王管理员</option>
                      <option>吕采集员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">用户角色</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option>全部色</option>
                      <option>管理员</option>
                      <option>标注员</option>
                      <option>采集员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">操作类型</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option>全部类型</option>
                      <option>登录</option>
                      <option>数据采集</option>
                      <option>数据标注</option>
                      <option>设备管理</option>
                      <option>用户管理</option>
                      <option>系统配置</option>
                      <option>数据导出</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">操作结果</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option>全部状态</option>
                      <option>成功</option>
                      <option>失败</option>
                    </select>
                  </div>
                </div>

                {/* 第二行筛选 */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">时间范围</label>
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </div>

                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="搜索操作描述、用户名或详细信息..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 应用筛选按钮 */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <Search size={18} />
                  应用筛选
                </Button>
              </div>
            )}
          </div>

          {/* 日志列表表格 */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 表格头部 */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">操作记录</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>共 {logs.length} 条记录</span>
              </div>
            </div>

            {/* 表格内容 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作用户</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">用户角色</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作描述</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => {
                    const operationType = getOperationTypeBadge(log.operationType);
                    const roleBadge = getRoleBadge(log.role);
                    const statusBadge = getStatusBadge(log.status);
                    const OperationIcon = operationType.icon;
                    const StatusIcon = statusBadge.icon;

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900 font-mono whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="font-medium text-gray-900">{log.fullName}</div>
                          <div className="text-xs text-gray-500">{log.username}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${roleBadge.style}`}>
                            {roleBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${operationType.bg} ${operationType.text}`}>
                            <OperationIcon size={12} />
                            {operationType.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                          {log.description}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusBadge.style}`}>
                            <StatusIcon size={12} />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            查看
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                显示第 1 到 {logs.length} 条，共 {logs.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">2</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">3</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 导出日志模态对话框 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">导出操作日志</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-5">
              {/* 说明文字 */}
              <p className="text-sm text-gray-600">
                请选择导出范围和格式，导出的日志可用于审计和分析
              </p>

              {/* 导出范围 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">导出范围</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportRange"
                      checked={exportRange === 'all'}
                      onChange={() => setExportRange('all')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">全部日志（包含历史记录）</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportRange"
                      checked={exportRange === 'selected'}
                      onChange={() => setExportRange('selected')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">当前页面显示的日志</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportRange"
                      checked={exportRange === 'filtered'}
                      onChange={() => setExportRange('filtered')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">符合筛选条件的日志</span>
                  </label>
                </div>
              </div>

              {/* 导出格式 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">导出格式</h4>
                <div className="flex justify-center">
                  <button className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 w-48">
                    <FileText size={24} className="text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900 text-center">Excel</div>
                    <div className="text-xs text-gray-500 text-center mt-1">.xlsx格式</div>
                  </button>
                </div>
              </div>

              {/* 提示信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ⓘ 导出的Excel文件将包含所有字段信息，便于数据分析和归档。
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  alert(`导出${exportRange === 'all' ? '全部' : exportRange === 'selected' ? '当前页面' : '筛选条件'}日志为Excel格式`);
                  setShowExportModal(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                开始导出
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 查看详情模态对话框 */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">操作详情</h3>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-5">
              {/* 基本信息 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">操作时间</div>
                      <div className="text-sm text-gray-900 font-mono">{selectedLog.timestamp}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">IP地址</div>
                      <div className="text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">操作用户</div>
                      <div className="text-sm text-gray-900">{selectedLog.fullName} ({selectedLog.username})</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">用户角色</div>
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getRoleBadge(selectedLog.role).style}`}>
                          {getRoleBadge(selectedLog.role).label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">操作类型</div>
                      <div>
                        {(() => {
                          const badge = getOperationTypeBadge(selectedLog.operationType);
                          const Icon = badge.icon;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>
                              <Icon size={12} />
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">操作状态</div>
                      <div>
                        {(() => {
                          const badge = getStatusBadge(selectedLog.status);
                          const Icon = badge.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.style}`}>
                              <Icon size={12} />
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作描述 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">操作描述</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedLog.description}</p>
                </div>
              </div>

              {/* 详细信息 */}
              {selectedLog.details && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">详细信息</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLog.details}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end p-5 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}