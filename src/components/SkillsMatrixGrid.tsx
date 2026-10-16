import React, { useState, useMemo } from 'react';
import { Worker, Stage, SkillLevel } from '../types/matrix';
import { SKILL_DEFINITIONS } from '../utils/constants';
import { calculateStageMetric, calculateWorkerFlexibility } from '../utils/matrixCalculations';
import { Check, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Info } from 'lucide-react';

interface SkillsMatrixGridProps {
  workers: Worker[];
  stages: Stage[];
  onUpdateWorkerSkill: (workerId: string, stageId: string, newLevel: SkillLevel) => void;
  onSelectWorkerDetails: (worker: Worker) => void;
}

export const SkillsMatrixGrid: React.FC<SkillsMatrixGridProps> = ({
  workers,
  stages,
  onUpdateWorkerSkill,
  onSelectWorkerDetails
}) => {
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hoveredCell, setHoveredCell] = useState<{ workerId: string; stageId: string } | null>(null);

  // Pagination calculation
  const totalPages = Math.ceil(workers.length / pageSize) || 1;
  const paginatedWorkers = useMemo(() => {
    if (pageSize === -1) return workers; // Show all
    const start = (currentPage - 1) * pageSize;
    return workers.slice(start, start + pageSize);
  }, [workers, currentPage, pageSize]);

  // Compute summary for bottom row
  const stageSummaries = useMemo(() => {
    return stages.map(stage => calculateStageMetric(stage, workers));
  }, [stages, workers]);

  // Cycle to next skill level: 0 -> 1 -> 2 -> 3 -> 4 -> 0
  const handleCellClick = (workerId: string, stageId: string, currentLevel: SkillLevel) => {
    const nextLevel = ((currentLevel + 1) % 5) as SkillLevel;
    onUpdateWorkerSkill(workerId, stageId, nextLevel);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Matrix Controls & Guide Bar */}
      <div className="p-3 sm:px-6 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Rating Scale Legend */}
        <div className="flex items-center flex-wrap gap-2 text-slate-600">
          <span className="font-semibold text-slate-700">دليل المستويات:</span>
          {([0, 1, 2, 3, 4] as SkillLevel[]).map(lvl => {
            const def = SKILL_DEFINITIONS[lvl];
            return (
              <span 
                key={lvl}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${def.bgClass} ${def.borderClass} ${def.textClass}`}
                title={def.descriptionAr}
              >
                <span className="font-mono">{lvl}</span>
                <span>{def.labelAr}</span>
              </span>
            );
          })}
        </div>

        {/* Quick hint & Page Selector */}
        <div className="flex items-center gap-4 text-slate-500">
          <div className="hidden md:flex items-center gap-1.5 text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>انقر على أي خلية لتغيير التقييم فورياً (0 إلى 4)</span>
          </div>

          <div className="flex items-center gap-2">
            <span>عرض:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-semibold focus:outline-none"
            >
              <option value={25}>25 عامل</option>
              <option value={50}>50 عامل</option>
              <option value={100}>100 عامل</option>
              <option value={-1}>الكل ({workers.length})</option>
            </select>
          </div>
        </div>

      </div>

      {/* High-Performance Matrix Table Container with Freeze Headers & Sticky Columns */}
      <div className="flex-1 overflow-auto matrix-scroll relative">
        <table className="w-full border-collapse text-right text-xs">
          
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-xs">
            <tr>
              {/* Sticky Col 1: Worker ID */}
              <th className="sticky right-0 z-30 bg-slate-900 px-3 py-3 font-semibold text-slate-300 w-24 border-b border-l border-slate-800 text-center">
                الكود
              </th>

              {/* Sticky Col 2: Worker Name */}
              <th className="sticky right-24 z-30 bg-slate-900 px-4 py-3 font-semibold text-white w-48 border-b border-l border-slate-800">
                اسم العامل
              </th>

              {/* Sticky Col 3: Shift */}
              <th className="px-2 py-3 font-semibold text-slate-300 w-16 text-center border-b border-l border-slate-800">
                الوردية
              </th>

              {/* Dynamic Stage Columns */}
              {stages.map((stage) => {
                const targetCount = stage.targetWorkersCount || 5;
                return (
                  <th
                    key={stage.id}
                    className="px-2.5 py-3 font-semibold text-white border-b border-l border-slate-800 min-w-[130px] max-w-[160px] text-center"
                  >
                    <div className="font-bold truncate text-slate-100" title={stage.name}>
                      {stage.name}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-400 font-normal">
                      <span className="font-mono text-emerald-400 font-semibold">مستهدف: {targetCount}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-400">كود: {stage.code}</span>
                    </div>
                  </th>
                );
              })}

              {/* Col: Worker Flexibility Goal (Target: 3 stages) */}
              <th className="px-3 py-3 font-bold text-amber-300 border-b border-slate-800 min-w-[120px] text-center bg-slate-950">
                المرونة (3 مراحل)
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {paginatedWorkers.length === 0 ? (
              <tr>
                <td colSpan={stages.length + 4} className="py-12 text-center text-slate-400 text-sm">
                  لا توجد نتائج مطابقة لبحثك أو الفلاتر المختارة.
                </td>
              </tr>
            ) : (
              paginatedWorkers.map((worker, rowIdx) => {
                const flex = calculateWorkerFlexibility(worker, stages);
                const isEven = rowIdx % 2 === 0;

                return (
                  <tr 
                    key={worker.id}
                    className={`transition-colors hover:bg-slate-50/80 ${isEven ? 'bg-white' : 'bg-slate-50/40'}`}
                  >
                    {/* Sticky Col 1: Worker ID */}
                    <td className="sticky right-0 z-10 px-3 py-2 text-center font-mono text-[11px] font-semibold text-slate-600 border-l border-slate-200 bg-inherit whitespace-nowrap">
                      {worker.empCode}
                    </td>

                    {/* Sticky Col 2: Worker Name with Click to View details */}
                    <td className="sticky right-24 z-10 px-4 py-2 font-medium text-slate-900 border-l border-slate-200 bg-inherit whitespace-nowrap">
                      <button
                        onClick={() => onSelectWorkerDetails(worker)}
                        className="text-right hover:text-emerald-700 hover:underline transition-colors block font-semibold truncate max-w-[170px]"
                        title="انقر لعرض ملف العامل ومسار التدريب"
                      >
                        {worker.name}
                      </button>
                    </td>

                    {/* Col 3: Shift */}
                    <td className="px-2 py-2 text-center font-mono text-xs text-slate-500 border-l border-slate-200 whitespace-nowrap">
                      {worker.shift}
                    </td>

                    {/* Interactive Stage Cells */}
                    {stages.map((stage) => {
                      const level = (worker.skills[stage.id] ?? 0) as SkillLevel;
                      const def = SKILL_DEFINITIONS[level];
                      const isHovered = hoveredCell?.workerId === worker.id && hoveredCell?.stageId === stage.id;

                      return (
                        <td
                          key={stage.id}
                          className="px-1 py-1.5 border-l border-slate-200 text-center select-none"
                          onMouseEnter={() => setHoveredCell({ workerId: worker.id, stageId: stage.id })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <button
                            onClick={() => handleCellClick(worker.id, stage.id, level)}
                            title={`${stage.name} - المستوى ${level}: ${def.labelAr} (انقر للترقية)`}
                            className={`w-full py-1.5 px-2 rounded-md border text-center transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-1 ${def.bgClass} ${def.borderClass} ${def.textClass} ${
                              isHovered ? 'ring-2 ring-slate-900/30 scale-102' : ''
                            }`}
                          >
                            <span className="font-mono text-xs">{level}</span>
                            <span className="hidden xl:inline text-[10px] font-medium truncate max-w-[70px]">
                              {level === 0 ? '-' : def.labelAr.split('/')[0]}
                            </span>
                          </button>
                        </td>
                      );
                    })}

                    {/* Worker Flexibility Progress (Target: 3 stages >= 3) */}
                    <td className="px-3 py-1.5 text-center border-l border-slate-200 bg-slate-50/50 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-mono text-xs font-bold tabular-nums ${
                          flex.isTargetMet ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {flex.qualifiedStagesCount} / {worker.targetStagesCount}
                        </span>

                        {flex.isTargetMet ? (
                          <span className="inline-flex items-center text-emerald-600" title="محقق لهدف الـ 3 مراحل">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-500" title="يحتاج تدريب لتحقيق هدف الـ 3 مراحل">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Summary Bottom Row: Target vs Actual Coverage */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white shadow-lg font-semibold">
            <tr>
              <td colSpan={3} className="sticky right-0 z-30 bg-slate-900 px-4 py-2.5 text-right font-bold text-white border-t border-l border-slate-800">
                <div className="flex items-center justify-between">
                  <span>إجمالي المؤهلين (≥3) / المستهدف:</span>
                </div>
              </td>

              {stageSummaries.map((metric) => {
                const target = metric.target || 5;
                const isShortage = metric.gap > 0;
                const isBalanced = metric.gap === 0;

                return (
                  <td 
                    key={metric.stage.id}
                    className={`px-2 py-2 text-center border-t border-l border-slate-800 font-mono text-xs ${
                      isShortage ? 'bg-rose-950/90 text-rose-200' : 'bg-emerald-950/80 text-emerald-200'
                    }`}
                  >
                    <div className="font-bold text-sm">
                      {metric.qualifiedCount} / {target}
                    </div>
                    <div className="text-[10px] opacity-90 mt-0.5">
                      {isShortage ? (
                        <span className="text-rose-300 font-bold">عجز (-{metric.gap})</span>
                      ) : isBalanced ? (
                        <span className="text-emerald-300">مكتمل (0)</span>
                      ) : (
                        <span className="text-emerald-300">فائض (+{Math.abs(metric.gap)})</span>
                      )}
                    </div>
                  </td>
                );
              })}

              {/* Overall Multi-Skilled Rate */}
              <td className="px-3 py-2.5 text-center border-t border-slate-800 bg-slate-950 text-amber-300 font-mono text-xs font-bold">
                {Math.round((workers.filter(w => calculateWorkerFlexibility(w, stages).isTargetMet).length / (workers.length || 1)) * 100)}% محقق
              </td>
            </tr>
          </tfoot>

        </table>
      </div>

      {/* Pagination Footer */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            عرض الصفحة <strong className="font-mono text-slate-900 tabular-nums">{currentPage}</strong> من أصل{' '}
            <strong className="font-mono text-slate-900 tabular-nums">{totalPages}</strong> صفحة
            (إجمالي <strong className="font-mono text-slate-900 tabular-nums">{workers.length}</strong> عامل)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono font-semibold text-slate-800">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
