import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string; // 最小可选日期
  placeholder?: string;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = '选择日期',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 当打开日历时，计算弹出框位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.date-picker-popover')
      ) {
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

  const isDateSelected = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    return dateStr === value;
  };

  const isDateDisabled = (year: number, month: number, day: number) => {
    if (!minDate) return false;
    const dateStr = formatDate(year, month, day);
    return dateStr < minDate;
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    if (isDateDisabled(year, month, day)) return;
    const dateStr = formatDate(year, month, day);
    onChange(dateStr);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // 添加空白单元格
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // 添加日期
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(currentYear, currentMonth, day);
      const isDisabled = isDateDisabled(currentYear, currentMonth, day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(currentYear, currentMonth, day)}
          disabled={isDisabled}
          className={`h-8 flex items-center justify-center text-sm rounded transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white font-medium'
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

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDisplayText = () => {
    if (value) {
      return value;
    }
    return placeholder;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2 text-left"
      >
        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {getDisplayText()}
        </span>
      </button>

      {isOpen && (
        <div
          className="date-picker-popover fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] p-4"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: '280px',
          }}
        >
          <div className="w-64">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
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
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium">
                  {currentYear}年 {months[currentMonth]}
                </span>
                <button
                  onClick={handleNextMonth}
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
              {renderCalendar()}
            </div>
          </div>

          {/* 底部快捷选择 */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => {
                const today = new Date();
                const dateStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
                if (!minDate || dateStr >= minDate) {
                  onChange(dateStr);
                  setIsOpen(false);
                }
              }}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              今天
            </button>
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              清除
            </button>
          </div>
        </div>
      )}
    </>
  );
}
