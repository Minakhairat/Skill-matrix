import React from 'react';
import { 
  Table2, 
  BarChart3, 
  Users, 
  Printer, 
  FileSpreadsheet, 
  SlidersHorizontal, 
  UserPlus,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'matrix' | 'balancing' | 'workers' | 'print';
  setActiveTab: (tab: 'matrix' | 'balancing' | 'workers' | 'print') => void;
  onOpenSettings: () => void;
  onOpenImportExport: () => void;
  onOpenAddWorker: () => void;
  onResetSampleData: () => void;
  totalWorkersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenImportExport,
  onOpenAddWorker,
  onResetSampleData,
  totalWorkersCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand wordmark & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-xs">
              M
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                MatrixPro
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                سكيل ماتريكس وموازنة خطوط الإنتاج ({totalWorkersCount} عامل)
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Segmented Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-4 h-4 text-emerald-600" />
              المصفوفة الكاملة
            </button>

            <button
              onClick={() => setActiveTab('balancing')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'balancing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              تحليل الفجوات والموازنة
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'workers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              مرونة العمال (3 مراحل)
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'print'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-600" />
              تقرير الورديات
            </button>
          </nav>

          {/* Zone 3: Primary Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenSettings}
              title="تحديد الأهداف (5 عمال للمرحلة / 3 مراحل للعامل)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">تحديد الأهداف</span>
            </button>

            <button
              onClick={onOpenImportExport}
              title="استيراد وتصدير ملفات Excel"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>إكسيل Excel</span>
            </button>

            <button
              onClick={onOpenAddWorker}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إضافة عامل</span>
            </button>

            <button
              onClick={onResetSampleData}
              title="إعادة توليد الـ 400 عامل التجريبيين"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
