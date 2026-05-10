import React, { useState, useEffect } from 'react';
import styles from './StatsSection.module.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const API_BASE = import.meta.env.VITE_URL;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtFull = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles['tooltip']}>
      <div className={styles['tooltip__label']}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles['tooltip__row']}>
          <span className={styles['tooltip__dot']} style={{ background: p.fill }} />
          <span className={styles['tooltip__name']}>{p.name}</span>
          <span className={styles['tooltip__val']}>{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Pulse Card ─────────────────────────────────────────────────────────────
function PulseCard({ title, primary, primaryLabel, rows, loading }) {
  return (
    <div className={styles['pulse-card']}>
      <div className={styles['pulse-card__label']}>{title}</div>
      {loading ? (
        <div className={styles['loader-wrap']}><span className={styles['spinner']} /></div>
      ) : (
        <>
          <div className={styles['pulse-card__primary']}>
            <span className={styles['pulse-card__primary-val']}>{primary}</span>
            <span className={styles['pulse-card__primary-lbl']}>{primaryLabel}</span>
          </div>
          <div className={styles['pulse-card__rows']}>
            {rows.map((r, i) => (
              <div key={i} className={styles['pulse-card__row']}>
                <span className={styles['pulse-card__row-label']}>{r.label}</span>
                <span className={styles['pulse-card__row-val']}>{r.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── VIP Leaderboard ────────────────────────────────────────────────────────
function VIPLeaderboard({ data, totalRevenue, loading }) {
  return (
    <div className={styles['vip-card']}>
      <div className={styles['section-label']}>
        <span>VIP Leaderboard</span>
        <span className={styles['section-label__sub']}>Top 7 · Current Month</span>
      </div>
      {loading ? (
        <div className={styles['loader-wrap']}><span className={styles['spinner']} /></div>
      ) : data.length === 0 ? (
        <div className={styles['empty']}>No data for this month.</div>
      ) : (
        <div className={styles['vip-list']}>
          {data.map((c, i) => {
            const pct = totalRevenue > 0
              ? ((c.revenue / totalRevenue) * 100).toFixed(1)
              : 0;
            return (
              <div key={c.cust_id} className={styles['vip-row']}>
                <div className={styles['vip-row__top']}>
                  <div className={styles['vip-row__left']}>
                    <span className={styles['vip-rank']}>{i + 1}</span>
                    <div>
                      <div className={styles['vip-name']}>{c.name}</div>
                      <div className={styles['vip-meta']}>
                        <span className={`${styles['badge']} ${styles['badge--unit']}`}>{c.sales_type}</span>
                        <span className={styles['vip-bottles']}>{c.bottles}B</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles['vip-row__right']}>
                    <div className={styles['vip-revenue']}>{fmtFull(c.revenue)}</div>
                    <div className={styles['vip-pct']}>{pct}%</div>
                  </div>
                </div>
                <div className={styles['vip-bar-track']}>
                  <div className={styles['vip-bar-fill']} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sales Mix Chart ────────────────────────────────────────────────────────
const BAR_COLORS = {
  cod:     '#c1121f',
  vendor:  '#669bbc',
  account: '#003049',
};

function SalesMixChart({ data, loading }) {
  return (
    <div className={styles['chart-card']}>
      <div className={styles['section-label']}>
        <span>Sales Mix Trend</span>
        <span className={styles['section-label__sub']}>Last 6 Months</span>
      </div>
      <div className={styles['chart-legend']}>
        {Object.entries(BAR_COLORS).map(([key, color]) => (
          <div key={key} className={styles['chart-legend__item']}>
            <span className={styles['chart-legend__dot']} style={{ background: color }} />
            <span className={styles['chart-legend__label']}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          </div>
        ))}
      </div>
      {loading ? (
        <div className={styles['loader-wrap']}><span className={styles['spinner']} /></div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%" barGap={3}>
            <CartesianGrid vertical={false} stroke="#e0e0e0" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#999', fontFamily: 'inherit' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#999', fontFamily: 'inherit' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,48,73,0.04)' }} />
            <Bar dataKey="cod"     name="COD"     fill={BAR_COLORS.cod}     radius={[2,2,0,0]} />
            <Bar dataKey="vendor"  name="Vendor"  fill={BAR_COLORS.vendor}  radius={[2,2,0,0]} />
            <Bar dataKey="account" name="Account" fill={BAR_COLORS.account} radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function StatsSection({ isVisible, externalRefresh }) {
  const [pulse,   setPulse]   = useState(null);
  const [vip,     setVip]     = useState([]);
  const [trend,   setTrend]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pulseRes, vipRes, trendRes] = await Promise.all([
          fetch(`${API_BASE}/stats/pulse`),
          fetch(`${API_BASE}/stats/vip`),
          fetch(`${API_BASE}/stats/trend`),
        ]);
        const [pulseData, vipData, trendData] = await Promise.all([
          pulseRes.json(),
          vipRes.json(),
          trendRes.json(),
        ]);
        if (pulseData.status) setPulse(pulseData.data);
        if (vipData.status)   setVip(vipData.data   || []);
        if (trendData.status) setTrend(trendData.data || []);
      } catch {
        // fail silently — cards show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [externalRefresh]);

  // ── Derived pulse values ──
  const totalRevenue   = pulse?.total_revenue   ?? 0;
  const totalBottles   = pulse?.total_bottles   ?? 0;
  const totalLitres    = pulse?.total_litres    ?? 0;
  const codRevenue     = pulse?.cod_revenue     ?? 0;
  const accountRevenue = pulse?.account_revenue ?? 0;
  const vendorRevenue  = pulse?.vendor_revenue  ?? 0;

  return (
    <div className={`${styles['stats-section']} ${isVisible ? styles['display-grid'] : styles['display-none']}`}>

      {/* ── HEADER ── */}
      <div className={styles['stats-header']}>
        <span className={styles['stats-header__title']}>Stats &amp; Analysis</span>
        <span className={styles['stats-header__sub']}>Current month · Updated end of month</span>
      </div>

      {/* ── BENTO GRID ── */}
      <div className={styles['bento']}>

        {/* Row 1 — Pulse Cards */}
        <PulseCard
          title="Revenue Breakdown"
          primary={fmtFull(totalRevenue)}
          primaryLabel="Total Revenue"
          loading={loading}
          rows={[
            { label: 'Account', value: fmtFull(accountRevenue) },
            { label: 'COD',     value: fmtFull(codRevenue)     },
            { label: 'Vendor',  value: fmtFull(vendorRevenue)  },
          ]}
        />

        <PulseCard
          title="Physical Volume"
          primary={totalBottles.toLocaleString()}
          primaryLabel="Bottles Sold"
          loading={loading}
          rows={[
            { label: 'Litres', value: totalLitres.toLocaleString() },
          ]}
        />

        {/* Row 2 — VIP (left) + Chart (right) */}
        <VIPLeaderboard
          data={vip}
          totalRevenue={totalRevenue}
          loading={loading}
        />

        <SalesMixChart
          data={trend}
          loading={loading}
        />

      </div>
    </div>
  );
}

export default StatsSection;