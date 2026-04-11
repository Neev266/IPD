import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FileText, Clock, AlertTriangle, CheckCircle, ArrowUpRight, Scale, ShieldCheck, BookOpen } from 'lucide-react';

const stats = [
  { 
    label: 'Total Matters', 
    sub: 'Active contracts under management',
    value: '1,248', 
    icon: FileText, 
    change: '+12 this month', 
    color: 'text-legal-navy',
    bg: 'bg-legal-navy/8 border-legal-navy/20',
  },
  { 
    label: 'Pending Review', 
    sub: 'Awaiting counsel sign-off',
    value: '34', 
    icon: Clock, 
    change: '2 urgent today', 
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  { 
    label: 'High-Risk Flags', 
    sub: 'Requires immediate attention',
    value: '7', 
    icon: AlertTriangle, 
    change: '+3 since last review', 
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
  { 
    label: 'Executed This Month', 
    sub: 'Fully approved & signed',
    value: '89', 
    icon: CheckCircle, 
    change: '+24% vs prior month', 
    color: 'text-legal-emerald',
    bg: 'bg-emerald-50 border-emerald-200',
  },
];

const recentActivity = [
  { id: 1, action: 'Liability Clause Modified', document: 'NDA — TechCorp Inc.', matterNo: 'MTR-2024-1042', time: '10 min ago', risk: 'High', user: 'A. Smith, Esq.' },
  { id: 2, action: 'Review Completed by Counsel', document: 'Vendor Agreement — Q3 Cohort', matterNo: 'MTR-2024-1096', time: '1 hr ago', risk: 'Low', user: 'J. Wilson, Esq.' },
  { id: 3, action: 'New Contract Version Submitted', document: 'Employment Contract — Dev', matterNo: 'MTR-2024-1103', time: '3 hr ago', risk: 'Medium', user: 'S. Jenkins' },
  { id: 4, action: 'AI Risk Alert Raised', document: 'MSA — Global Solutions', matterNo: 'MTR-2024-0998', time: '5 hr ago', risk: 'High', user: 'AI Analysis Engine' },
];

const upcomingDeadlines = [
  { matter: 'NDA — TechCorp', deadline: 'Mar 18, 2026', days: 2, type: 'Signature Due' },
  { matter: 'MSA — Global Solutions', deadline: 'Mar 20, 2026', days: 4, type: 'Counsel Review' },
  { matter: 'Lease — NY Branch', deadline: 'Mar 25, 2026', days: 9, type: 'Renewal Decision' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      
      {/* Page Header — legal letterhead style */}
      <div className="relative bg-white border border-legal-border rounded-xl px-8 py-6 shadow-legal overflow-hidden">
        {/* Subtle scales watermark */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] leading-none text-legal-navy opacity-[0.04] pointer-events-none select-none">⚖</div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="statute-label mb-2">Matter Overview · Dashboard</p>
            <h1 className="text-3xl font-bold text-legal-navy">Good morning, <em className="text-legal-gold not-italic">Jane Doe, Esq.</em></h1>
            <div className="gold-divider" />
            <p className="text-legal-textLight text-sm max-w-xl leading-relaxed">
              You have <strong className="text-legal-navy">7 high-risk flags</strong> requiring review and <strong className="text-legal-navy">2 urgent matters</strong> pending your counsel. The below summarizes your active docket.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-legal-textLight uppercase tracking-wider font-semibold">Session Date</p>
            <p className="text-sm font-bold text-legal-navy mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-3 text-legal-emerald">
              <ShieldCheck size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Secure Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className={`relative rounded-xl border ${stat.bg} p-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            <div className="absolute top-3 right-3">
              <stat.icon className={`h-5 w-5 ${stat.color} opacity-60`} />
            </div>
            <p className="statute-label mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-legal-navy mt-1">{stat.value}</p>
            <p className="text-[11px] text-legal-textLight mt-0.5 leading-tight">{stat.sub}</p>
            <div className="mt-3 pt-3 border-t border-black/5">
              <p className={`text-xs font-semibold flex items-center gap-1 ${stat.color}`}>
                <ArrowUpRight size={12} />
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-legal-border pb-4">
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-legal-gold" />
              <div>
                <CardTitle>Matter Activity Log</CardTitle>
                <CardDescription className="mt-0.5">Recent events, edits, and alerts across all active contracts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.map((activity, i) => (
              <div key={activity.id} className={`flex items-start gap-4 px-6 py-4 hover:bg-legal-ivory/60 transition-colors cursor-pointer ${i !== recentActivity.length - 1 ? 'border-b border-legal-border' : ''}`}>
                
                <div className="mt-0.5 shrink-0">
                  {activity.risk === 'High' ? (
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <AlertTriangle size={14} />
                    </div>
                  ) : activity.risk === 'Medium' ? (
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Clock size={14} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-legal-emerald flex items-center justify-center">
                      <CheckCircle size={14} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-legal-navy">{activity.action}</p>
                  <p className="text-sm text-legal-text mt-0.5 truncate">{activity.document}</p>
                  <div className="flex flex-wrap items-center text-xs text-legal-textLight gap-x-3 gap-y-0.5 mt-1.5">
                    <span className="font-mono text-[10px] bg-legal-gray px-1.5 py-0.5 rounded text-legal-navy">{activity.matterNo}</span>
                    <span>{activity.time}</span>
                    <span>·</span>
                    <span>{activity.user}</span>
                  </div>
                </div>

                <Badge variant={activity.risk === 'High' ? 'danger' : activity.risk === 'Medium' ? 'warning' : 'success'} className="shrink-0 text-[10px]">
                  {activity.risk}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-5">

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="border-b border-legal-border pb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-legal-gold" />
                <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingDeadlines.map((d, i) => (
                <div key={i} className={`px-5 py-3.5 flex items-center justify-between ${i !== upcomingDeadlines.length - 1 ? 'border-b border-legal-border' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-legal-navy truncate">{d.matter}</p>
                    <p className="text-[11px] text-legal-textLight mt-0.5">{d.type} · {d.deadline}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ml-2 ${d.days <= 3 ? 'bg-red-100 text-red-700' : d.days <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-legal-emerald'}`}>
                    {d.days}d
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Risk Summary */}
          <div className="relative rounded-xl overflow-hidden border border-legal-navy/20 shadow">
            <div className="h-1 w-full bg-gradient-to-r from-legal-navy via-legal-gold to-legal-emerald" />
            <div className="bg-legal-navy text-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={16} className="text-legal-gold" />
                <h3 className="text-sm font-bold tracking-wide uppercase">AI Counsel Summary</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                The platform has detected <strong className="text-red-400">3 critical indemnification shifts</strong> in the newly submitted Vendor Agreement cohort. Immediate senior counsel review is advised before execution.
              </p>
              <button className="mt-4 w-full py-2 text-xs font-bold uppercase tracking-wider rounded-md border border-legal-gold/30 text-legal-gold hover:bg-legal-gold/10 transition-colors">
                View Full AI Analysis →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="border-b border-legal-border pb-4">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                'Review Pending Matters',
                'Initiate New Contract Draft',
                'Generate Risk Assessment Report',
                'Export Audit Log (PDF)',
              ].map((action) => (
                <button key={action} className="w-full text-left px-4 py-2.5 rounded-lg border border-legal-border bg-white hover:bg-legal-ivory hover:border-legal-gold/40 transition-all text-sm font-medium text-legal-navy flex items-center justify-between group">
                  {action}
                  <ArrowUpRight size={14} className="text-legal-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
