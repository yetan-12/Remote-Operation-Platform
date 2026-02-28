import { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 表单验证
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    
    setIsLoading(true);
    
    // 模拟网络延迟
    setTimeout(() => {
      const success = login(username, password);
      if (!success) {
        setError('用户名或密码错误，请重试');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧蓝色区域 */}
      <div className="w-1/2 bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] text-white p-16 flex flex-col relative overflow-hidden">
        {/* 背装饰圆圈 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Logo 和品牌名 */}
        <div className="flex items-center gap-3 mb-16 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-semibold">RoboData</span>
        </div>

        {/* 主标题 */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            机械臂遥操采集平台
          </h1>
          <p className="text-blue-100 text-lg mb-12 max-w-md">
            统一采集、同步记录、集中管理多模态机械臂操作数据
          </p>

          {/* 特性标签 */}
          <div className="flex gap-3 mb-8">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
              高效采集
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
              同步标注
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
              安全管理
            </span>
          </div>

          {/* 装饰图片 */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm max-h-[280px]">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1728724654223-ae890fc31f1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdCUyMGFybSUyMGluZHVzdHJpYWx8ZW58MXx8fHwxNzY2NDI2NTM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Robotic arm control" 
              className="w-full h-full object-cover"
            />
            {/* 图片底部渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 text-blue-100 text-sm relative z-10 flex items-center justify-between">
          <span>© 2025 The University of Sydney. All rights reserved.</span>
        </div>
      </div>

      {/* 右侧白色登录表单区域 */}
      <div className="w-1/2 bg-white flex items-center justify-center p-16">
        <div className="w-full max-w-md">
          {/* 标题 */}
          <h2 className="text-3xl font-bold mb-2 text-gray-900">账号登录</h2>
          <p className="text-gray-500 mb-8">请输入账号信息登录系统</p>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名输入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* 密码输入框 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <button
                  type="button"
                  className="text-sm text-[#2563eb] hover:underline"
                >
                  忘记密码?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            {/* 登录按钮 */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录系统'}
            </Button>

            {/* 提示信息 */}
            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
              <p className="mb-1">测试账户：</p>
              <p>• Lyu (吕) - 管理员/标注员/采集员，密码为空</p>
            </div>

            {/* 其他登录方式提示 */}
            <div className="text-center text-sm text-gray-400 mt-4">
              其他登录方式
            </div>

            {/* 社交登录图标 */}
            <div className="flex justify-center gap-6 mt-4">
              <button
                type="button"
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#666"/>
                </svg>
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}