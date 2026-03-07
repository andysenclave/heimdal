import { useNavigate } from 'react-router-dom';
import { DecoCard, DecoStatCard, DecoBadge, DecoButton } from '@components/primitives';
import { MiniBarChart } from '@components/charts/MiniBarChart';
import { PageHeader } from '@components/common/PageHeader';
import { ROUTES } from '@lib/constants';

// Sample data — will be replaced with real API data
const guardCallsData = [
  { name: 'Mon', value: 186 },
  { name: 'Tue', value: 215 },
  { name: 'Wed', value: 198 },
  { name: 'Thu', value: 247 },
  { name: 'Fri', value: 312 },
  { name: 'Sat', value: 87 },
  { name: 'Sun', value: 62 },
];

const userGrowthData = [
  { name: 'Oct', value: 4 },
  { name: 'Nov', value: 6 },
  { name: 'Dec', value: 3 },
  { name: 'Jan', value: 8 },
  { name: 'Feb', value: 5 },
  { name: 'Mar', value: 7 },
];

const recentDecisions = [
  { user: 'andy@thimple.in', resource: 'portfolio:read', allowed: true, time: '2m ago' },
  { user: 'viewer@acme.com', resource: 'trade:execute', allowed: false, time: '5m ago' },
  { user: 'admin@thimple.in', resource: 'watchlist:manage', allowed: true, time: '12m ago' },
  { user: 'guest@dev.io', resource: 'portfolio:write', allowed: false, time: '18m ago' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-deco-fade-in">
      <PageHeader title="Dashboard" subtitle="System overview · real-time" />

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <DecoStatCard label="Organizations" value="3" icon="◇" accent="amber" />
        <DecoStatCard label="Applications" value="5" icon="⬡" accent="teal" />
        <DecoStatCard label="Users" value="24" icon="○" accent="purple" />
        <DecoStatCard label="Guard Checks (24h)" value="1,247" icon="⊡" accent="green" />
      </div>

      {/* Charts row 1 — Guard calls + User growth */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <DecoCard title="Guard Calls — Last 7 Days">
          <MiniBarChart data={guardCallsData} color="rgb(var(--color-amber))" height={160} />
          <div className="mt-2.5 flex justify-between font-mono text-[11px] text-deco-text-dim">
            <span>Total: <span className="font-bold text-deco-amber">1,307</span></span>
            <span>Avg: <span className="font-bold text-deco-amber">187/day</span></span>
            <span>Peak: <span className="font-bold text-deco-amber">Fri 312</span></span>
          </div>
        </DecoCard>

        <DecoCard title="User Growth — 6 Months">
          <MiniBarChart data={userGrowthData} color="rgb(var(--color-teal))" height={160} />
          <div className="mt-2.5 flex justify-between font-mono text-[11px] text-deco-text-dim">
            <span>Total: <span className="font-bold text-deco-teal">33</span></span>
            <span>This month: <span className="font-bold text-deco-teal">+7</span></span>
          </div>
        </DecoCard>
      </div>

      {/* Charts row 2 — Apps, Roles, Allow/Deny */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DecoCard title="Apps Onboarded">
          <div className="mt-2 flex items-end gap-1.5" style={{ height: 60 }}>
            {[1, 0, 2, 1, 0, 1].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: Math.max(v * 20, 3),
                    backgroundColor: v > 0
                      ? 'rgb(var(--color-purple))'
                      : 'rgb(var(--color-border))',
                  }}
                />
                <span className="font-mono text-[9px] text-deco-text-dim">
                  {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] text-deco-text-dim">
            Total: <span className="font-bold text-deco-purple">5 apps</span>
          </p>
        </DecoCard>

        <DecoCard title="Roles Defined">
          <div className="mt-2 flex items-end gap-1.5" style={{ height: 60 }}>
            {[3, 0, 1, 2, 0, 1].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: Math.max(v * 15, 3),
                    backgroundColor: v > 0
                      ? 'rgb(var(--color-green))'
                      : 'rgb(var(--color-border))',
                  }}
                />
                <span className="font-mono text-[9px] text-deco-text-dim">
                  {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] text-deco-text-dim">
            Total: <span className="font-bold text-deco-green">7 roles</span>
          </p>
        </DecoCard>

        <DecoCard title="Guard Allow / Deny">
          <div className="mt-2 flex overflow-hidden rounded-sm border border-deco-border" style={{ height: 40 }}>
            <div className="flex items-center justify-center bg-deco-green font-mono text-[11px] font-bold text-[#0A0A0C]" style={{ width: '78%' }}>
              78%
            </div>
            <div className="flex items-center justify-center bg-deco-red font-mono text-[11px] font-bold text-[#0A0A0C]" style={{ width: '22%' }}>
              22%
            </div>
          </div>
          <div className="mt-2 flex gap-4 font-mono text-[11px]">
            <span className="text-deco-green">◆ 973 allowed</span>
            <span className="text-deco-red">◆ 274 denied</span>
          </div>
        </DecoCard>
      </div>

      {/* Bottom row — Recent decisions + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DecoCard title="Recent Guard Decisions">
          <div className="space-y-0">
            {recentDecisions.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border-deco-border py-2.5"
                style={{ borderBottom: i < recentDecisions.length - 1 ? '1px solid rgb(var(--color-border))' : 'none' }}
              >
                <DecoBadge variant={d.allowed ? 'green' : 'red'} size="sm">
                  {d.allowed ? 'PASS' : 'DENY'}
                </DecoBadge>
                <span className="flex-1 font-mono text-[11px] text-deco-text-soft">{d.user}</span>
                <span className="font-mono text-[11px] font-semibold text-deco-amber">{d.resource}</span>
                <span className="font-mono text-[10px] text-deco-text-dim">{d.time}</span>
              </div>
            ))}
          </div>
        </DecoCard>

        <DecoCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            <DecoButton variant="primary" onClick={() => navigate(ROUTES.ORGANIZATIONS)}>+ New Organization</DecoButton>
            <DecoButton variant="secondary" onClick={() => navigate(ROUTES.APPLICATIONS)}>+ Register App</DecoButton>
            <DecoButton variant="ghost" onClick={() => navigate(ROUTES.ROLES)}>+ Create Role</DecoButton>
            <DecoButton variant="ghost" onClick={() => navigate(ROUTES.PERMISSIONS)}>+ Add Permission</DecoButton>
            <DecoButton variant="ghost" className="col-span-2" onClick={() => navigate(ROUTES.GUARD_TESTER)}>
              Open Guard Tester →
            </DecoButton>
          </div>
        </DecoCard>
      </div>
    </div>
  );
}
