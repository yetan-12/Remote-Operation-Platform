import { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronUp, Edit2, Power, CheckCircle2, XCircle, X, Settings, Activity, Trash2, Usb, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import type { User, DeviceRecord, DeviceConnection } from '../types';
import { useDevices } from '../contexts/DevicesContext';
import {
  DEVICE_CATEGORIES,
  ROBOT_SUBTYPE_OPTIONS,
  CONTROLLER_SUBTYPE_OPTIONS,
  CONNECTION_TYPES,
} from '../constants';

const TEST_API_BASE = import.meta.env.VITE_TEST_API_URL || 'http://localhost:8000';
import DateRangePicker from './DateRangePicker';

interface DeviceManagementProps {
  user: User;
  onLogout: () => void;
}

type ModalType = 'create' | 'edit' | 'disable' | 'enable' | null;

export default function DeviceManagement({ user, onLogout }: DeviceManagementProps) {
  const { devices, addDevice, updateDevice, updateDeviceStatus, deleteDevice } = useDevices();
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createError, setCreateError] = useState('');

  // Add device: 1) category 2) subType 3) name 4) optional pairing with connected device
  const [formData, setFormData] = useState({
    category: '' as DeviceRecord['category'] | '',
    subType: '',
    customSubTypeName: '',
    name: '',
    connectionType: 'usb' as DeviceConnection['type'],
    connectionAddress: '', // selected from scan or manual
    pairedConnection: null as DeviceConnection | null,
  });
  const [scannedPorts, setScannedPorts] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const getStatusBadge = (status: DeviceRecord['status']) => {
    if (status === 'in-use') {
      return { style: 'bg-yellow-100 text-yellow-700', label: '使用中', icon: Activity };
    }
    if (status === 'disabled') {
      return { style: 'bg-gray-100 text-gray-500', label: '已禁用', icon: XCircle };
    }
    return { style: 'bg-green-100 text-green-700', label: '空闲', icon: CheckCircle2 };
  };

  const subTypeDisplayName = (category: DeviceRecord['category'], subType: string) => {
    if (category === 'robot') {
      const opt = ROBOT_SUBTYPE_OPTIONS.find((o) => o.id === subType);
      return opt ? opt.name : subType;
    }
    const opt = CONTROLLER_SUBTYPE_OPTIONS.find((o) => o.id === subType);
    return opt ? opt.name : subType;
  };

  const handleOpenModal = (type: ModalType, device?: DeviceRecord) => {
    setActiveModal(type);
    setCreateError('');
    setShowDeleteConfirm(false);
    if (device) {
      setSelectedDevice(device);
      if (type === 'edit') {
        const opts = device.category === 'robot' ? ROBOT_SUBTYPE_OPTIONS : CONTROLLER_SUBTYPE_OPTIONS;
        const inPreset = opts.some((o) => o.id === device.subType);
        setFormData({
          category: device.category,
          subType: inPreset ? device.subType : '__new__',
          customSubTypeName: inPreset ? '' : device.subType,
          name: device.name,
        });
      }
    } else {
      setFormData({
        category: '',
        subType: '',
        customSubTypeName: '',
        name: '',
        connectionType: 'usb',
        connectionAddress: '',
        pairedConnection: null,
      });
      setScannedPorts([]);
      setScanError('');
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedDevice(null);
    setShowDeleteConfirm(false);
    setCreateError('');
    setScanError('');
    setScannedPorts([]);
    setFormData({
      category: '',
      subType: '',
      customSubTypeName: '',
      name: '',
      connectionType: 'usb',
      connectionAddress: '',
      pairedConnection: null,
    });
  };

  const handleScanConnected = async () => {
    setScanning(true);
    setScanError('');
    setScannedPorts([]);
    if (formData.connectionType === 'usb') {
      try {
        const res = await fetch(`${TEST_API_BASE}/api/test/gello/ports`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.ports)) {
          setScannedPorts(data.ports);
          if (data.ports.length === 0) setScanError('未检测到 USB 设备，请确认已连接');
        } else {
          setScanError(data.error || '扫描失败');
        }
      } catch {
        setScanError('无法连接扫描服务，请确认测试后端已启动 (npm run dev:all)');
      }
    }
    // Future: formData.connectionType === 'network' -> scan ZMQ / TCP; bluetooth -> scan BLE
    setScanning(false);
  };

  const handleSelectPaired = (type: DeviceConnection['type'], address: string) => {
    setFormData((prev) => ({
      ...prev,
      connectionAddress: address,
      pairedConnection: { type, address },
    }));
  };

  const handleConfirmDelete = () => {
    if (selectedDevice) {
      deleteDevice(selectedDevice.id);
      handleCloseModal();
    }
  };

  const handleSubmit = () => {
    setCreateError('');
    if (activeModal === 'create') {
      if (!formData.category) {
        setCreateError('请选择添加类型（机械臂或控制器）');
        return;
      }
      const subType =
        formData.subType === '__new__'
          ? formData.customSubTypeName.trim()
          : formData.subType;
      if (!subType) {
        setCreateError(
          formData.subType === '__new__'
            ? '请输入新的类型名称'
            : '请选择或输入类型'
        );
        return;
      }
      const name = formData.name.trim();
      if (!name) {
        setCreateError('请输入设备名称');
        return;
      }
      const exists = devices.some(
        (d) => d.category === formData.category && d.subType === subType && d.name === name
      );
      if (exists) {
        setCreateError('该类型下已存在同名设备');
        return;
      }
      addDevice({
        category: formData.category,
        subType,
        name,
        ...(formData.pairedConnection && { connection: formData.pairedConnection }),
      });
      handleCloseModal();
    } else if (activeModal === 'edit' && selectedDevice) {
      const name = formData.name.trim();
      if (!name) {
        setCreateError('请输入设备名称');
        return;
      }
      const subType =
        formData.subType === '__new__'
          ? formData.customSubTypeName.trim()
          : formData.subType;
      if (!subType) {
        setCreateError(
          formData.subType === '__new__' ? '请输入类型名称' : '请选择类型'
        );
        return;
      }
      updateDevice(selectedDevice.id, {
        name,
        category: formData.category,
        subType,
      });
      handleCloseModal();
    }
  };

  const handleStatusChange = () => {
    if (selectedDevice) {
      const newStatus = activeModal === 'disable' ? 'disabled' : 'available';
      updateDeviceStatus(selectedDevice.id, newStatus);
      handleCloseModal();
    }
  };

  const categoryName = (c: DeviceRecord['category']) =>
    DEVICE_CATEGORIES.find((x) => x.id === c)?.name ?? c;

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">设备管理</h1>
              <p className="text-sm text-gray-500">设备逐个添加，与数据采集选设备同步</p>
            </div>
            <Button
              onClick={() => handleOpenModal('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus size={18} />
              添加设备
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">设备总数</span>
                <Settings size={16} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">使用中</span>
                <Activity size={16} className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {devices.filter((d) => d.status === 'in-use').length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">空闲</span>
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {devices.filter((d) => d.status === 'available').length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">已禁用</span>
                <XCircle size={16} className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {devices.filter((d) => d.status === 'disabled').length}
              </div>
            </div>
          </div>

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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">添加时间</label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="搜索设备名称..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <Search size={18} />
                  应用筛选
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">设备列表</h3>
              <span className="text-sm text-gray-600">共 {devices.length} 台设备</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">子类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">设备名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">配对</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">添加时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {devices.map((device) => {
                    const statusBadge = getStatusBadge(device.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-700">{categoryName(device.category)}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {subTypeDisplayName(device.category, device.subType)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{device.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {device.connection ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Usb size={12} />
                              {device.connection.type === 'usb' ? device.connection.address : `${device.connection.type}: ${device.connection.address}`}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusBadge.style}`}
                          >
                            <StatusIcon size={12} />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{device.createdAt}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenModal('edit', device)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="编辑设备"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleOpenModal(device.status === 'disabled' ? 'enable' : 'disable', device)
                              }
                              className={`p-1.5 rounded ${
                                device.status === 'disabled'
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title={device.status === 'disabled' ? '启用设备' : '禁用设备'}
                            >
                              <Power size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                显示第 1 到 {devices.length} 条，共 {devices.length} 条记录
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add device: 1) 类型 2) 子类型（或添加新类型） 3) 设备名称 */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">添加设备</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {createError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加什么类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as DeviceRecord['category'],
                      subType: '',
                      customSubTypeName: '',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {DEVICE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.category === 'robot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择机械臂子类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subType}
                    onChange={(e) =>
                      setFormData({ ...formData, subType: e.target.value, customSubTypeName: '' })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择</option>
                    {ROBOT_SUBTYPE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {formData.subType === '__new__' && (
                    <input
                      type="text"
                      value={formData.customSubTypeName}
                      onChange={(e) => setFormData({ ...formData, customSubTypeName: e.target.value })}
                      placeholder="输入新的机械臂类型名称，如：Kinova"
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}

              {formData.category === 'controller' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择控制器类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subType}
                    onChange={(e) =>
                      setFormData({ ...formData, subType: e.target.value, customSubTypeName: '' })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择</option>
                    {CONTROLLER_SUBTYPE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {formData.subType === '__new__' && (
                    <input
                      type="text"
                      value={formData.customSubTypeName}
                      onChange={(e) => setFormData({ ...formData, customSubTypeName: e.target.value })}
                      placeholder="输入新的控制器类型名称"
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}

              {(formData.category === 'robot' && formData.subType) ||
                (formData.category === 'controller' && formData.subType) ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      设备名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={
                        formData.category === 'robot'
                          ? '如：FRANKA-01、双臂系统-01'
                          : '如：GELLOW-01、手柄-01'
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-700">与已连接设备配对（可选）</p>
                    <p className="text-xs text-gray-500">
                      选择连接方式后点击「扫描已连接设备」，从列表中选择要绑定的设备。当前支持 USB，后续将支持网络、蓝牙等。
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">连接类型</label>
                      <select
                        value={formData.connectionType}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            connectionType: e.target.value as DeviceConnection['type'],
                            connectionAddress: '',
                            pairedConnection: null,
                          });
                          setScannedPorts([]);
                          setScanError('');
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CONNECTION_TYPES.map((c) => (
                          <option key={c.id} value={c.id} disabled={!c.available}>
                            {c.name}{!c.available ? ' (即将支持)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleScanConnected}
                        disabled={scanning}
                      >
                        {scanning ? <Loader2 size={14} className="animate-spin" /> : <Usb size={14} />}
                        <span className="ml-1">扫描已连接设备</span>
                      </Button>
                      {scanError && <span className="text-xs text-red-600">{scanError}</span>}
                    </div>
                    {scannedPorts.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">选择要配对的设备</label>
                        <div className="flex flex-wrap gap-2">
                          {scannedPorts.map((port) => (
                            <button
                              key={port}
                              type="button"
                              onClick={() => handleSelectPaired('usb', port)}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${
                                formData.pairedConnection?.address === port
                                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {port}
                            </button>
                          ))}
                        </div>
                        {formData.pairedConnection?.address && (
                          <p className="text-xs text-green-600 mt-1">已选: {formData.pairedConnection.address}</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">添加后该设备将在数据采集端对应选择中可用。</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                添加设备
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit device - type, subType, name + delete */}
      {activeModal === 'edit' && selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">编辑设备</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {createError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</div>
              )}
              {!showDeleteConfirm ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as DeviceRecord['category'],
                          subType: '',
                          customSubTypeName: '',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DEVICE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.category === 'robot' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">机械臂子类型</label>
                      <select
                        value={formData.subType}
                        onChange={(e) =>
                          setFormData({ ...formData, subType: e.target.value, customSubTypeName: '' })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ROBOT_SUBTYPE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      {formData.subType === '__new__' && (
                        <input
                          type="text"
                          value={formData.customSubTypeName}
                          onChange={(e) => setFormData({ ...formData, customSubTypeName: e.target.value })}
                          placeholder="输入新的机械臂类型名称"
                          className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  )}
                  {formData.category === 'controller' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">控制器类型</label>
                      <select
                        value={formData.subType}
                        onChange={(e) =>
                          setFormData({ ...formData, subType: e.target.value, customSubTypeName: '' })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CONTROLLER_SUBTYPE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      {formData.subType === '__new__' && (
                        <input
                          type="text"
                          value={formData.customSubTypeName}
                          onChange={(e) => setFormData({ ...formData, customSubTypeName: e.target.value })}
                          placeholder="输入新的控制器类型名称"
                          className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">设备名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {selectedDevice.connection && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-gray-700">当前配对：</span>
                      {selectedDevice.connection.type} — {selectedDevice.connection.address}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => updateDevice(selectedDevice.id, { connection: undefined })}
                      >
                        清除配对
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4">
                  <p className="text-sm text-gray-700 mb-2">
                    确定要删除设备 <span className="font-medium text-gray-900">{selectedDevice.name}</span> 吗？删除后无法恢复。
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <>
                  <Button
                    onClick={handleCloseModal}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                  >
                    取消
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    保存修改
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} className="mr-1" />
                    删除设备
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    确认删除
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disable / Enable modals - same as before, use selectedDevice.name */}
      {activeModal === 'disable' && selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">禁用设备</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="text-red-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    确定要禁用设备 <span className="font-medium text-gray-900">{selectedDevice.name}</span> 吗？
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button onClick={handleStatusChange} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                确认禁用
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'enable' && selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">启用设备</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    确定要启用设备 <span className="font-medium text-gray-900">{selectedDevice.name}</span> 吗？
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button onClick={handleStatusChange} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                确认启用
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
