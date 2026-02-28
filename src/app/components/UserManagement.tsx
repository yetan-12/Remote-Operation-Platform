import { useState, useMemo } from 'react';
import { Search, UserPlus, ChevronDown, ChevronUp, Edit2, Power, Key, CheckCircle2, XCircle, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import type { User } from '../types';
import type { UserRole } from '../types';
import { useAccounts } from '../contexts/AccountsContext';
import { appEventBus } from '../core/events/AppEventBus';
import DateRangePicker from './DateRangePicker';

const ROLE_LABELS: Record<'Admin' | 'Reviewer' | 'Collector', string> = {
  Admin: '管理员',
  Reviewer: '标注员',
  Collector: '采集员',
};

interface UserManagementProps {
  user: User;
  onLogout: () => void;
}

interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  roles: ('Collector' | 'Reviewer' | 'Admin')[]; // 改为数组支持多职业
  status: 'Active' | 'Disabled';
  lastLogin: string;
  createdAt: string;
}

type ModalType = 'create' | 'edit' | 'disable' | 'enable' | 'reset' | null;

const ROLE_UI_TO_API: Record<'Admin' | 'Reviewer' | 'Collector', UserRole> = { Admin: 'admin', Reviewer: 'reviewer', Collector: 'collector' };
const ROLE_API_TO_UI: Record<UserRole, 'Admin' | 'Reviewer' | 'Collector'> = { admin: 'Admin', reviewer: 'Reviewer', collector: 'Collector' };

export default function UserManagement({ user, onLogout }: UserManagementProps) {
  const { accounts, addAccount, updateAccount } = useAccounts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'reviewer' | 'collector'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'username' | 'role' | 'lastLogin' | 'status'>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [createError, setCreateError] = useState('');

  // 创建/编辑用户表单状态
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    roles: [] as ('Collector' | 'Reviewer' | 'Admin')[],
    password: '',
    confirmPassword: '',
  });

  // Derive user list from accounts (single source of truth; new users can login)
  const users: UserAccount[] = useMemo(
    () =>
      accounts.map((acc) => ({
        id: acc.username,
        username: acc.username,
        fullName: acc.name,
        roles: acc.roles.map((r) => ROLE_API_TO_UI[r]),
        status: 'Active' as const,
        lastLogin: '-',
        createdAt: '-',
      })),
    [accounts]
  );

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
    if (status === 'Active') {
      return { style: 'bg-green-100 text-green-700', label: '启用', icon: CheckCircle2 };
    }
    return { style: 'bg-gray-100 text-gray-500', label: '停用', icon: XCircle };
  };

  const handleOpenModal = (type: ModalType, userAccount?: UserAccount) => {
    setActiveModal(type);
    if (userAccount) {
      setSelectedUser(userAccount);
      if (type === 'edit') {
        setFormData({
          username: userAccount.username,
          fullName: userAccount.fullName,
          roles: userAccount.roles, // 取所有角色
          password: '',
          confirmPassword: '',
        });
      }
    } else {
      setFormData({
        username: '',
        fullName: '',
        roles: ['Collector'],
        password: '',
        confirmPassword: '',
      });
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setCreateError('');
    setFormData({
      username: '',
      fullName: '',
      roles: ['Collector'],
      password: '',
      confirmPassword: '',
    });
  };

  const handleSubmit = () => {
    setCreateError('');
    if (activeModal === 'create') {
      const username = formData.username.trim();
      const fullName = formData.fullName.trim();
      if (!username) {
        setCreateError('请输入用户名');
        return;
      }
      if (!fullName) {
        setCreateError('请输入姓名');
        return;
      }
      if (formData.roles.length === 0) {
        setCreateError('请至少选择一个角色');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setCreateError('两次输入的密码不一致');
        return;
      }
      if (accounts.some((a) => a.username === username)) {
        setCreateError('该用户名已存在');
        return;
      }
      const roles: UserRole[] = formData.roles.map((r) => ROLE_UI_TO_API[r]);
      addAccount({
        username,
        password: formData.password,
        name: fullName,
        roles,
      });
      appEventBus.publish('USER_CREATED', {
        createdBy: user.name || user.username,
        newUsername: username,
        newName: fullName,
        roles: formData.roles.map((r) => ROLE_LABELS[r]),
      });
      handleCloseModal();
    } else if (activeModal === 'edit' && selectedUser) {
      const roles: UserRole[] = formData.roles.map((r) => ROLE_UI_TO_API[r]);
      if (roles.length === 0) {
        setCreateError('请至少选择一个角色');
        return;
      }
      updateAccount(selectedUser.username, { roles, name: formData.fullName.trim() });
      appEventBus.publish('USER_ROLES_UPDATED', {
        operator: user.name || user.username,
        targetUsername: selectedUser.username,
        targetName: formData.fullName.trim() || selectedUser.fullName,
        newRoles: formData.roles.map((r) => ROLE_LABELS[r]),
      });
      handleCloseModal();
    }
  };

  const handleStatusChange = () => {
    if (selectedUser) {
      const action = activeModal === 'disable' ? '停用' : '启用';
      alert(`${action}用户：${selectedUser.fullName} (${selectedUser.username})`);
      handleCloseModal();
    }
  };

  const handleResetPassword = () => {
    if (selectedUser) {
      alert(`重置用户 ${selectedUser.fullName} (${selectedUser.username}) 的密码`);
      handleCloseModal();
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">账号与权限管理</h1>
              <p className="text-sm text-gray-500">管理系统用户账号及其访问权限</p>
            </div>
            <Button 
              onClick={() => handleOpenModal('create')}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <UserPlus size={18} />
              创建用户
            </Button>
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
              <button className="text-sm text-blue-600 hover:underline">重置条件</button>
            </button>

            {isFilterExpanded && (
              <div className="px-4 pb-4 space-y-4">
                {/* 第一行筛选 */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">用户角色</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option>全部角色</option>
                      <option>管理员</option>
                      <option>标注员</option>
                      <option>采集员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">账号状态</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option>全部状态</option>
                      <option>启用</option>
                      <option>停用</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">创建时间</label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                    />
                  </div>
                </div>

                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="搜索用户名或姓名..."
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

          {/* 用户列表表格 */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 表格头部 */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">用户列表</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>共 {users.length} 个用户</span>
              </div>
            </div>

            {/* 表格内容 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">用户名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">角色</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">最后登录</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">创建时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((userAccount) => {
                    const statusBadge = getStatusBadge(userAccount.status);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <tr key={userAccount.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{userAccount.username}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{userAccount.fullName}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {userAccount.roles.map((role) => {
                              const roleBadge = getRoleBadge(role);
                              return (
                                <span key={role} className={`inline-block px-2 py-1 text-xs rounded-full ${roleBadge.style}`}>
                                  {roleBadge.label}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusBadge.style}`}>
                            <StatusIcon size={12} />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{userAccount.lastLogin}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{userAccount.createdAt}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenModal('edit', userAccount)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="编辑权限"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenModal(userAccount.status === 'Active' ? 'disable' : 'enable', userAccount)}
                              className={`p-1.5 rounded ${
                                userAccount.status === 'Active'
                                  ? 'text-gray-600 hover:bg-gray-100'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={userAccount.status === 'Active' ? '停用账号' : '启用账号'}
                            >
                              <Power size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenModal('reset', userAccount)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title="重置密码"
                            >
                              <Key size={16} />
                            </button>
                          </div>
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
                显示第 1 到 {users.length} 条，共 {users.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 创建用户模态对话框 */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">创建用户</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              {createError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="输入拼音用户名，如：Zhang"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="输入真实姓名"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  用户角色 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {(['Collector', 'Reviewer', 'Admin'] as const).map((role) => {
                    const isChecked = formData.roles.includes(role);
                    const roleInfo = {
                      Collector: { label: '采集员', desc: '可进行数据采集操作' },
                      Reviewer: { label: '标注员', desc: '可标注和管理采集的数据' },
                      Admin: { label: '管理员', desc: '完整系统管理权限，包括用户管理、数据管理等' },
                    };
                    
                    return (
                      <label
                        key={role}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, roles: [...formData.roles, role] });
                            } else {
                              setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                            }
                          }}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{roleInfo[role].label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{roleInfo[role].desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  ⓘ 可以为用户分配多个角色，用户可在登录后切换使用
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  初始密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="留空则默认无密码"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="再次输入密码"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                创建用户
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑权限模态对话框 */}
      {activeModal === 'edit' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">编辑用户权限</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">当前用户</div>
                <div className="font-medium text-gray-900">{selectedUser.fullName} ({selectedUser.username})</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  用户角色 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {(['Collector', 'Reviewer', 'Admin'] as const).map((role) => {
                    const isChecked = formData.roles.includes(role);
                    const roleInfo = {
                      Collector: { label: '采集员', desc: '可进行数据采集操作' },
                      Reviewer: { label: '标注员', desc: '可标注和管理采集的数据' },
                      Admin: { label: '管理员', desc: '完整系统管理权限，包括用户管理、数据管理等' },
                    };
                    
                    return (
                      <label
                        key={role}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, roles: [...formData.roles, role] });
                            } else {
                              setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                            }
                          }}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{roleInfo[role].label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{roleInfo[role].desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  ⓘ 可以为用户分配多个角色，用户可在登录后切换使用
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ⓘ 修改用户角色将立即生效，该用户下次登录时将具有新角色的权限。
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                保存修改
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 停用账号确认对话框 */}
      {activeModal === 'disable' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">停用账号</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="text-red-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    确定要停用用户 <span className="font-medium text-gray-900">{selectedUser.fullName} ({selectedUser.username})</span> 吗？
                  </p>
                  <p className="text-sm text-gray-600">
                    停用后，该用户将无法登录系统。您可以随时重新启用该账号。
                  </p>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={handleStatusChange}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                确认停用
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 启用账号确认对话框 */}
      {activeModal === 'enable' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">启用账号</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">
                    确定要启用用户 <span className="font-medium text-gray-900">{selectedUser.fullName} ({selectedUser.username})</span> 吗？
                  </p>
                  <p className="text-sm text-gray-600">
                    启用后，该用户将可以正常登录并使用系统。
                  </p>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={handleStatusChange}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                确认启用
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码对话框 */}
      {activeModal === 'reset' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">重置密码</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">当前用户</div>
                <div className="font-medium text-gray-900">{selectedUser.fullName} ({selectedUser.username})</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="输入新密码，留空则设为无密码"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="再次输入新密码"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  ⓘ 重置密码后将立即生效，用户需要使用新密码登录。
                </p>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={handleCloseModal}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={handleResetPassword}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                确认重置
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}