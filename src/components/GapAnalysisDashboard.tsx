import React, { useState } from 'react';
import { Stage, Worker, SkillLevel } from '../types/matrix';
import { calculateStageMetric, calculateWorkerFlexibility, generateRebalancingSuggestions } from '../utils/matrixCalculations';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightLeft, 
  GraduationCap, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { exportGapReportToExcel } from '../utils/excelEngine';

interface GapAnalysisDashboardProps {
  stages: Stage[];
  lineWorkers: Worker[];
  allWorkers: Worker[];
  lineName: string;
  onUpdateWorkerSkill: (workerId: string, stageId: string, newLevel: SkillLevel) => void;
  onTransferWorkerLine: (workerId: string, targetLineId: string) => void;
  currentLineId: string;
}

export const GapAnalysisDashboard: React.FC<GapAnalysisDashboardProps> = ({
  stages,
  lineWorkers,
  allWorkers,
  lineName,
  onUpdateWorkerSkill,
  onTransferWorkerLine,
  currentLineId
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<'all' | 'shortage' | 'covered'>('all');
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  // Compute metrics for all stages
  const stageMetrics = stages.map(s => calculateStageMetric(s, lineWorkers));
  
  // Aggregate KPIs
  const totalStages = stageMetrics.length;
  const coveredStages = stageMetrics.filter(m => m.isCovered).length;
  const shortageStages = stageMetrics.filter(m => !m.isCovered).length;
  const criticalStages = stageMetrics.filter(m => m.isCriticalShortage).length;
  const overallCoverageRate = totalStages > 0 ? Math.round((coveredStages / totalStages) * 100) : 100;

  // Multi-skilled flexibility rate: percentage of workers who met the 3-stages target
  const multiSkilledWorkersCount = lineWorkers.filter(w => calculateWorkerFlexibility(w, stages).isTargetMet).length;
  const multiSkilledRate = lineWorkers.length > 0 ? Math.round((multiSkilledWorkersCount / lineWorkers.length) * 100) : 0;

  // Smart rebalancing suggestions
  const suggestions = generateRebalancingSuggestions(stages, lineWorkers, allWorkers);

  // Filtered stages for display
  const filteredMetrics = stageMetrics.filter(m => {
    if (selectedStageFilter === 'shortage') return !m.isCovered;
    if (selectedStageFilter === 'covered') return m.isCovered;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 4-KPI Executive Summary Strip (Anti-slop, clean single-elevation cards with quantitative precision) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Overall Line Coverage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">نسبة تغطية مراحل الخط</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              overallCoverageRate >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {coveredStages} من {totalStages} مراحل
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
              {overallCoverageRate}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            مراحل مستوفية للهدف ({stageMetrics[0]?.target || 5} عمال بمستوى ≥ 3)
          </div>
        </div>

        {/* KPI 2: Worker Multi-Skilling Flexibility Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">مرونة العمال (هدف 3 مراحل)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-indigo-900 tabular-nums">
              {multiSkilledRate}%
            </span>
            <span className="text-xs text-slate-500">
              ({multiSkilledWorkersCount} عامل محقق)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            عمال يتقنون 3 مراحل أو أكثر بمستوى كفاءة ≥ 3
          </div>
        </div>

        {/* KPI 3: Stages with Shortage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">مراحل بها عجز في التغطية</span>
            <AlertTriangle className={`w-4 h-4 ${shortageStages > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono tracking-tight tabular-nums ${
              shortageStages > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {shortageStages}
            </span>
            <span className="text-xs text-slate-500">مراحل</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            تحتاج زيادة عدد العمال المؤهلين لتحقيق الهدف
          </div>
        </div>

        {/* KPI 4: Critical Bottlenecks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">عجز حرج (نقص ≥ 2 عمال)</span>
            <ShieldAlert className={`w-4 h-4 ${criticalStages > 0 ? 'text-rose-600' : 'text-emerald-500'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono tracking-tight tabular-nums ${
              criticalStages > 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {criticalStages}
            </span>
            <span className="text-xs text-slate-500">مراحل حرجة</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            خطر توقف الخط عند غياب أحد العمال
          </div>
        </div>

      </div>

      {/* Smart Balancing Engine Callout (خوارزمية الموازنة الذكية وسد الفجوات) */}
      {suggestions.length > 0 && (
        <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-indigo-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-800 rounded-lg text-amber-300">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">
                  مقترحات الموازنة الذكية وسد الفجوات (Smart Line Balancing Engine)
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  تم اكتشاف {suggestions.length} مرحلة بها عجز، وتم تحديد عمال مناسبين مؤهلين لسد النقص فورياً.
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {suggestions.map((sug) => (
              <div key={sug.targetStageId} className="bg-indigo-950/70 rounded-lg p-3.5 border border-indigo-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{sug.targetStageName}</span>
                  <span className="bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                    مطلوب {sug.neededCount} عمال
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {sug.candidateWorkers.map((cand, idx) => (
                    <div 
                      key={`${cand.worker.id}-${idx}`}
                      className="bg-indigo-900/60 rounded p-2.5 flex items-center justify-between gap-3 text-xs border border-indigo-800/40"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{cand.worker.name}</span>
                          <span className="font-mono text-[11px] text-indigo-300">({cand.worker.empCode})</span>
                        </div>
                        <div className="text-[11px] text-indigo-200 mt-1 leading-snug">
                          {cand.reason}
                        </div>
                      </div>

                      {/* Direct Action Button */}
                      {cand.recommendedAction === 'accelerate_training' && (
                        <button
                          onClick={() => onUpdateWorkerSkill(cand.worker.id, sug.targetStageId, 3)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold whitespace-nowrap shadow-xs transition-colors shrink-0"
                          title="ترقية تقييم العامل إلى المستوى 3 (مستقل) فورياً بعد إتمام الاختبار"
                        >
                          ترقية للمستوى 3
                        </button>
                      )}

                      {cand.recommendedAction === 'transfer_line' && (
                        <button
                          onClick={() => onTransferWorkerLine(cand.worker.id, currentLineId)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold whitespace-nowrap shadow-xs transition-colors shrink-0 flex items-center gap-1"
                          title="نقل العامل إلى هذا الخط لسد العجز"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          نقل للخط
                        </button>
                      )}

                      {cand.recommendedAction === 'shift_workstation' && (
                        <button
                          onClick={() => onUpdateWorkerSkill(cand.worker.id, sug.targetStageId, 3)}
                          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold whitespace-nowrap shadow-xs transition-colors shrink-0"
                          title="توجيه العامل للمرحلة وترقيته"
                        >
                          توجيه وترقية
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage-by-Stage Detailed Balance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filter & Export Header */}
        <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">تصفية المراحل:</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setSelectedStageFilter('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedStageFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({totalStages})
              </button>
              <button
                onClick={() => setSelectedStageFilter('shortage')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedStageFilter === 'shortage' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بها عجز ({shortageStages})
              </button>
              <button
                onClick={() => setSelectedStageFilter('covered')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedStageFilter === 'covered' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مغطاة ({coveredStages})
              </button>
            </div>
          </div>

          <button
            onClick={() => exportGapReportToExcel(stages, lineWorkers, lineName)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            تصدير تقرير الفجوات (Excel)
          </button>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">المرحلة / المحطة</th>
                <th className="px-3 py-3">التصنيف</th>
                <th className="px-3 py-3 text-center">المستهدف</th>
                <th className="px-3 py-3 text-center">المتوفر حالياً (≥3)</th>
                <th className="px-3 py-3 text-center">المتدربون (1-2)</th>
                <th className="px-3 py-3 text-center">الفجوة</th>
                <th className="px-4 py-3">مستوى الجاهزية</th>
                <th className="px-3 py-3 text-center">الحالة</th>
                <th className="px-3 py-3 text-center">تفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMetrics.map((m) => {
                const isExpanded = expandedStageId === m.stage.id;
                const isShortage = m.gap > 0;

                return (
                  <React.Fragment key={m.stage.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{m.stage.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          كود: {m.stage.code} · الحد الأدنى: المستوى {m.stage.minRequiredLevel}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {m.stage.category}
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {m.target} عمال
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                        <span className={`px-2 py-0.5 rounded ${
                          m.qualifiedCount >= m.target ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                        }`}>
                          {m.qualifiedCount}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center font-mono text-slate-600 tabular-nums">
                        {m.traineeCount} عمال
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-bold tabular-nums">
                        {isShortage ? (
                          <span className="text-rose-600 font-bold">-{m.gap} (عجز)</span>
                        ) : m.gap === 0 ? (
                          <span className="text-emerald-600 font-bold">0 (مكتمل)</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">+{Math.abs(m.gap)} (فائض)</span>
                        )}
                      </td>

                      {/* Visual Readiness Progress Bar */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                m.coveragePercentage >= 100 
                                  ? 'bg-emerald-500' 
                                  : m.coveragePercentage >= 60 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, m.coveragePercentage)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums w-10 text-left">
                            {m.coveragePercentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        {isShortage ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            m.isCriticalShortage ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            {m.isCriticalShortage ? 'عجز حرج' : 'نقص تدريب'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            مكتمل
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => setExpandedStageId(isExpanded ? null : m.stage.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="عرض أسماء العمال المؤهلين والمرشحين"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Qualified Workers List */}
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                                <span>العمال المؤهلون حالياً ({m.qualifiedWorkers.length})</span>
                                <span className="text-[11px] text-emerald-600 font-normal">درجة التقييم ≥ 3</span>
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {m.qualifiedWorkers.length === 0 ? (
                                  <div className="text-slate-400 text-xs py-2 text-center">لا يوجد عمال مؤهلون بعد</div>
                                ) : (
                                  m.qualifiedWorkers.map(w => (
                                    <div key={w.id} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded">
                                      <span className="font-medium text-slate-900">{w.name} ({w.empCode})</span>
                                      <span className="font-mono text-emerald-700 font-bold">المستوى {w.skills[m.stage.id]}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Potential Candidates for Promotion (Level 2) */}
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                                <span>مرشحون للترقية السريعة ({m.potentialWorkers.length})</span>
                                <span className="text-[11px] text-sky-600 font-normal">المستوى 2 (تحت إشراف)</span>
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {m.potentialWorkers.length === 0 ? (
                                  <div className="text-slate-400 text-xs py-2 text-center">لا يوجد عمال بمستوى 2 حالياً</div>
                                ) : (
                                  m.potentialWorkers.map(w => (
                                    <div key={w.id} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded">
                                      <span className="font-medium text-slate-900">{w.name} ({w.empCode})</span>
                                      <button
                                        onClick={() => onUpdateWorkerSkill(w.id, m.stage.id, 3)}
                                        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors"
                                      >
                                        ترقية إلى المستوى 3
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
