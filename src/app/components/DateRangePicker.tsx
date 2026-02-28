import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth());
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [position, setPosition] = useState<{ top?: number; right?: number; left?: number; maxHeight?: string }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 计算弹出框位置 - 使用 fixed 定位以避免容器限制
  useEffect(() => {
    if (isOpen && containerRef.current && popoverRef.current) {
      const updatePosition = () => {
        if (!containerRef.current || !popoverRef.current) return;
        
        const buttonRect = containerRef.current.getBoundingClientRect();
        const popoverWidth = popoverRef.current.offsetWidth;
        const popoverHeight = popoverRef.current.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算垂直位置
        let top = buttonRect.bottom + 8; // 按钮下方 + 8px 间距
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        
        // 如果下方空间不足，尝试放在上方
        if (spaceBelow < popoverHeight + 16 && spaceAbove > popoverHeight + 16) {
          top = buttonRect.top - popoverHeight - 8;
        }
        
        // 计算水平位置 - 优先右对齐
        let right = viewportWidth - buttonRect.right;
        let left: number | undefined = undefined;
        
        // 如果右对齐后左侧超出视口，改为左对齐
        if (buttonRect.right - popoverWidth < 16) {
          left = Math.max(16, buttonRect.left);
          right = undefined;
        }
        
        // 限制最大高度，避免超出视口
        const maxHeight = Math.min(600, viewportHeight - top - 16);
        
        setPosition({
          top,
          right: right !== undefined ? right : undefined,
          left,
          maxHeight: `${maxHeight}px`
        });
      };
      
      // 使用 requestAnimationFrame 确保 DOM 已完全渲染
      const rafId = requestAnimationFrame(updatePosition);
      
      // 监听窗口滚动和大小变化
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };

  const isDateSelected = (year: number, month: number, day: number, type: 'start' | 'end') => {
    const dateStr = formatDate(year, month, day);
    return type === 'start' ? dateStr === startDate : dateStr === endDate;
  };

  const isDateInRange = (year: number, month: number, day: number) => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDate(year, month, day);
    return dateStr > startDate && dateStr < endDate;
  };

  const handleDateClick = (year: number, month: number, day: number, type: 'start' | 'end') => {
    const dateStr = formatDate(year, month, day);
    if (type === 'start') {
      onStartDateChange(dateStr);
      if (endDate && dateStr > endDate) {
        onEndDateChange('');
      }
    } else {
      if (!startDate || dateStr >= startDate) {
        onEndDateChange(dateStr);
      }
    }
  };

  const renderCalendar = (year: number, month: number, type: 'start' | 'end') => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 添加空白元格
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // 添加日期
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(year, month, day, type);
      const isInRange = isDateInRange(year, month, day);
      const isDisabled = type === 'end' && startDate && formatDate(year, month, day) < startDate;

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleDateClick(year, month, day, type)}
          disabled={isDisabled}
          className={`h-8 flex items-center justify-center text-sm rounded transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white font-medium'
              : isInRange
              ? 'bg-blue-100 text-blue-900'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handlePrevMonth = (type: 'start' | 'end') => {
    if (type === 'start') {
      if (startMonth === 0) {
        setStartMonth(11);
        setStartYear(startYear - 1);
      } else {
        setStartMonth(startMonth - 1);
      }
    } else {
      if (endMonth === 0) {
        setEndMonth(11);
        setEndYear(endYear - 1);
      } else {
        setEndMonth(endMonth - 1);
      }
    }
  };

  const handleNextMonth = (type: 'start' | 'end') => {
    if (type === 'start') {
      if (startMonth === 11) {
        setStartMonth(0);
        setStartYear(startYear + 1);
      } else {
        setStartMonth(startMonth + 1);
      }
    } else {
      if (endMonth === 11) {
        setEndMonth(0);
        setEndYear(endYear + 1);
      } else {
        setEndMonth(endMonth + 1);
      }
    }
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${startDate} 至 ${endDate}`;
    } else if (startDate) {
      return `从 ${startDate}`;
    } else if (endDate) {
      return `至 ${endDate}`;
    }
    return '选择日期范围';
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2 text-left"
      >
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
        <span className={startDate || endDate ? 'text-gray-900' : 'text-gray-400'}>
          {getDisplayText()}
        </span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 overflow-y-auto"
          style={position}
        >
          <div className="grid grid-cols-2 gap-8">
            {/* 开始日期日历 */}
            <div className="w-64">
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2">开始日期</div>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handlePrevMonth('start')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium">
                    {startYear}年 {months[startMonth]}
                  </span>
                  <button
                    onClick={() => handleNextMonth('start')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
                {renderCalendar(startYear, startMonth, 'start')}
              </div>
            </div>

            {/* 结束日期日历 */}
            <div className="w-64">
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2">结束日期</div>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(Number(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handlePrevMonth('end')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium">
                    {endYear}年 {months[endMonth]}
                  </span>
                  <button
                    onClick={() => handleNextMonth('end')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
                {renderCalendar(endYear, endMonth, 'end')}
              </div>
            </div>
          </div>

          {/* 底部快捷选择 */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  onStartDateChange(formatDate(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()));
                  onEndDateChange(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                最近7天
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setDate(monthAgo.getDate() - 30);
                  onStartDateChange(formatDate(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate()));
                  onEndDateChange(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                最近30天
              </button>
            </div>
            <button
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
                setIsOpen(false);
              }}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              清除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}