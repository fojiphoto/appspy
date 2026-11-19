'use client';
import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Download, ExternalLink, Search, Star } from 'lucide-react';
import {
  type TopNewData, type TopNewGame, UA_SCENARIOS, REVENUE_PER_INSTALL, compact, money, revenueRange, uaSpend,
} from '@/lib/topNew';

const WINDOWS = ['30', '60', '90', '180', '270'] as const;
const WINDOW_LABEL: Record<string, string> = { '30': '1 month', '60': '2 months', '90': '3 months', '180': '6 months', '270': '9 months' };
type SortKey = 'rank' | 'installs' | 'perDay' | 'delta' | 'score' | 'ratings' | 'ageDays' | 'title';

const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States', gb: 'United Kingdom', de: 'Germany', fr: 'France', es: 'Spain', it: 'Italy', pl: 'Poland',
  ca: 'Canada', au: 'Australia', br: 'Brazil', mx: 'Mexico', ar: 'Argentina', in: 'India', pk: 'Pakistan',
  id: 'Indonesia', vn: 'Vietnam', ph: 'Philippines', th: 'Thailand', my: 'Malaysia', jp: 'Japan', kr: 'South Korea',
  tr: 'Turkey', sa: 'Saudi Arabia', eg: 'Egypt', ng: 'Nigeria', ru: 'Russia',
};
const country = (c: string) => COUNTRY_NAMES[c] || c.toUpperCase();
const playUrl = (pkg: string) => `https://play.google.com/store/apps/details?id=${pkg}`;
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function monetisation(g: TopNewGame) {
  if (!g.free) return `Paid $${g.price}`;
  if (g.iap && g.ads) return 'Ads + purchases';
  if (g.iap) return 'Purchases';
  if (g.ads) return 'Ads';
  return 'Free, none declared';
}

function toCsv(games: TopNewGame[], days: string) {
  const head = ['rank', 'game', 'developer', 'category', 'released', 'age_days', 'installs', 'installs_per_day', 'rating', 'ratings_count',
    'monetisation', 'best_top_free', 'best_top_grossing', 'est_revenue_low_usd', 'est_revenue_high_usd',
    'est_ua_spend_low_usd', 'est_ua_spend_mid_usd', 'est_ua_spend_high_usd', 'package', 'play_url'];
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = games.map((g) => {
    const rev = revenueRange(g);
    const ua = uaSpend(g.installs);
    return [g.rank, g.title, g.developer, g.genre, g.released, g.ageDays, g.installs, g.perDay, g.score ?? '', g.ratings ?? '',
      monetisation(g),
      g.bestFree ? `#${g.bestFree[0]} ${country(g.bestFree[1])}` : '',
      g.bestGross ? `#${g.bestGross[0]} ${country(g.bestGross[1])}` : '',
      rev?.low ?? '', rev?.high ?? '', ua.low, ua.mid, ua.high, g.pkg, playUrl(g.pkg)].map(cell).join(',');
  });
  const blob = new Blob([`﻿${head.join(',')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `top-new-games-${days}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Movement({ g, hasPrev }: { g: TopNewGame; hasPrev: boolean }) {
  if (!hasPrev) return null;
  if (g.prevRank == null) return <span className="ml-1 text-[10px] font-semibold text-emerald-400">NEW</span>;
  const diff = g.prevRank - (g.rank || 0);
  if (diff === 0) return null;
  return diff > 0
    ? <span className="ml-1 inline-flex items-center text-[10px] text-emerald-400"><ArrowUp size={10} />{diff}</span>
    : <span className="ml-1 inline-flex items-center text-[10px] text-rose-400"><ArrowDown size={10} />{-diff}</span>;
}

function Th({ label, k, sort, setSort, align = 'right', title }: {
  label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; setSort: (s: { key: SortKey; dir: 1 | -1 }) => void;
  align?: 'left' | 'right'; title?: string;
}) {
  const active = sort.key === k;
  return (
    <th className={`px-3 py-2.5 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`} title={title}>
      <button
        type="button"
        onClick={() => setSort({ key: k, dir: active ? (sort.dir === 1 ? -1 : 1) : (k === 'rank' || k === 'title' || k === 'ageDays' ? 1 : -1) })}
        className={`inline-flex items-center gap-1 hover:text-white ${active ? 'text-white' : ''}`}
      >
        {label}{active && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  );
}

export default function TopNewGamesClient({ data }: { data: TopNewData }) {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>('30');
  const [price, setPrice] = useState<'free' | 'paid'>('free');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 });
  const [open, setOpen] = useState<string | null>(null);
  const [showUndated, setShowUndated] = useState(false);
  const [showEarly, setShowEarly] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  const win = data.windows[days];
  const hasPrev = !!win?.changes;
  const changes = price === 'free' ? win?.changes : null;
  const themeList = price === 'free' ? win?.themes || [] : [];
  const games = useMemo(() => (price === 'paid' ? win?.paid : win?.games) || [], [win, price]);
  const byPkg = useMemo(() => new Map(games.map((g) => [g.pkg, g])), [games]);
  // Counted here, from whichever list is showing, so the panel always matches the table.
  const cats = useMemo(() => {
    const by = new Map<string, { category: string; count: number; installs: number }>();
    for (const g of games) {
      const e = by.get(g.genre) || { category: g.genre, count: 0, installs: 0 };
      e.count += 1; e.installs += g.installs;
      by.set(g.genre, e);
    }
    return [...by.values()].sort((a, b) => b.count - a.count || b.installs - a.installs);
  }, [games]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = games.filter((g) =>
      (!category || g.genre === category)
      && (!q || g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q) || g.pkg.toLowerCase().includes(q)));
    const val = (g: TopNewGame): number | string => {
      switch (sort.key) {
        case 'title': return g.title.toLowerCase();
        case 'score': return g.score ?? -1;
        case 'ratings': return g.ratings ?? -1;
        case 'delta': return g.delta ?? -1;
        default: return (g[sort.key] as number) ?? 0;
      }
    };
    return [...list].sort((a, b) => {
      const x = val(a); const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir || (a.rank || 0) - (b.rank || 0);
    });
  }, [games, query, category, sort]);

  if (!win || !win.games?.length) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold">Top New Games</h1>
        <p className="mt-3 text-sm text-gray-400">No data has been collected yet. The first table appears after the daily collector has run once.</p>
      </div>
    );
  }

  const totalInstalls = games.reduce((s, g) => s + g.installs, 0);
  const first = games[0];
  const last = games[games.length - 1];
  const maxCat = Math.max(1, ...cats.map((c) => c.count));
  const failed = data.run ? data.run.charts_failed : 0;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── heading ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Top New {price === 'paid' ? 'Paid' : 'Free'} Android Games</h1>
          <p className="mt-1 text-sm text-gray-400 max-w-3xl">
            {price === 'paid' ? 'Paid' : 'Free'} games released on Google Play in the last {WINDOW_LABEL[days]} ({days} days), ranked by installs. Release date, installs and rating
            are read from Google Play itself. Estimates are marked <span className="text-amber-300">Est.</span>
          </p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>Updated <span className="text-white">{fmtDate(data.date)}</span></div>
          {data.run && (
            <div className={failed ? 'text-amber-300' : ''}>
              {data.run.charts_ok} of {data.run.charts_ok + failed} charts read · {compact(data.run.games_seen)} games checked
            </div>
          )}
        </div>
      </div>

      {/* ── window tabs ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
          {WINDOWS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDays(d); setOpen(null); setCategory(''); }}
              className={`px-4 py-1.5 text-sm rounded-md transition ${days === d ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              {WINDOW_LABEL[d]}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
          {(['free', 'paid'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPrice(p); setOpen(null); setCategory(''); }}
              className={`px-3 py-1.5 text-sm rounded-md capitalize transition ${price === p ? 'bg-white/15 text-white' : 'text-gray-300 hover:text-white'}`}
            >
              {p} <span className="text-xs text-gray-400">{(p === 'paid' ? win.paid?.length : win.games.length) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search game or developer"
            className="w-56 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#161922] px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
        </select>
        <button
          type="button"
          onClick={() => toCsv(games, `${price}-${days}`)}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {/* ── summary ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Games released in window', compact(win.pool), 'found on the charts, with a release date on Google Play'],
          ['#1 installs', first ? compact(first.installs) : '–', first?.title || ''],
          [`#${games.length} installs`, last ? compact(last.installs) : '–', 'the bar to enter this table'],
          [`Top ${games.length} combined`, compact(totalInstalls), 'installs since release'],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-gray-400">{label}</div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
            <div className="text-xs text-gray-500 truncate">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="bg-white/5 text-xs text-gray-400">
            <tr>
              <Th label="#" k="rank" sort={sort} setSort={setSort} align="left" />
              <Th label="Game" k="title" sort={sort} setSort={setSort} align="left" />
              <th className="px-3 py-2.5 text-left font-medium">Category</th>
              <Th label="Released" k="ageDays" sort={sort} setSort={setSort} title="Released on, from Google Play" />
              <Th label="Installs" k="installs" sort={sort} setSort={setSort} title="Google Play's install counter. All of them happened since release." />
              <Th label="Per day" k="perDay" sort={sort} setSort={setSort} title="Installs divided by days since release" />
              <Th label="Last day" k="delta" sort={sort} setSort={setSort} title="Installs gained since the previous daily snapshot" />
              <Th label="Rating" k="score" sort={sort} setSort={setSort} />
              <th className="px-3 py-2.5 text-right font-medium" title="Model, not measured. See the method section.">
                <span className="text-amber-300">Est.</span> revenue
              </th>
              <th className="px-3 py-2.5 text-right font-medium" title="Model, not measured. Mid scenario; open the row for low and high.">
                <span className="text-amber-300">Est.</span> UA spend
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const rev = revenueRange(g);
              const ua = uaSpend(g.installs);
              const isOpen = open === g.pkg;
              return (
                <Fragment key={g.pkg}>
                  <tr
                    className={`border-t border-white/5 cursor-pointer hover:bg-white/[0.04] ${isOpen ? 'bg-white/[0.04]' : ''}`}
                    onClick={() => setOpen(isOpen ? null : g.pkg)}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300">
                      {g.rank}<Movement g={g} hasPrev={hasPrev} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${g.icon}=s72`} alt="" width={36} height={36} loading="lazy" className="h-9 w-9 shrink-0 rounded-lg bg-white/5" />
                        <div className="min-w-0">
                          <div className="truncate font-medium max-w-[300px]">{g.title}</div>
                          <div className="truncate text-xs text-gray-500 max-w-[300px]">{g.developer}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{g.genre}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div>{g.released && fmtDate(g.released)}</div>
                      <div className="text-xs text-gray-500">{g.ageDays} {g.ageDays === 1 ? 'day' : 'days'} ago</div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-semibold" title={g.installs.toLocaleString('en-US')}>
                      {compact(g.installs)}
                      <div className="text-xs font-normal text-gray-500">{g.installsLabel}</div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-gray-300">{compact(g.perDay || 0)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-gray-300">
                      {g.delta == null ? <span className="text-gray-600">–</span> : `+${compact(Math.max(0, g.delta))}`}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {g.score ? (
                        <>
                          <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{g.score.toFixed(1)}</span>
                          <div className="text-xs text-gray-500">{compact(g.ratings || 0)} ratings</div>
                        </>
                      ) : <span className="text-xs text-gray-600" title="Google Play shows no rating for this game yet">no rating yet</span>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-gray-300">
                      {rev ? (rev.low === rev.high ? money(rev.low) : `${money(rev.low)} – ${money(rev.high)}`) : <span className="text-gray-600">–</span>}
                      {g.bestGross && <div className="text-xs text-emerald-400" title="Best Top Grossing chart position today">Grossing #{g.bestGross[0]} {g.bestGross[1].toUpperCase()}</div>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-gray-300">{money(ua.mid)}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-white/5 bg-white/[0.02]">
                      <td />
                      <td colSpan={9} className="px-3 py-3">
                        <div className="grid gap-x-8 gap-y-2 text-xs text-gray-300 sm:grid-cols-2 lg:grid-cols-4">
                          <div><span className="text-gray-500">Package</span><br />{g.pkg}</div>
                          <div><span className="text-gray-500">Exact installs</span><br />{g.installs.toLocaleString('en-US')}</div>
                          <div><span className="text-gray-500">Earns from</span><br />{monetisation(g)}</div>
                          <div><span className="text-gray-500">Last updated on Play</span><br />{g.updated ? fmtDate(g.updated) : '–'}</div>
                          <div><span className="text-gray-500">Best Top Free position today</span><br />
                            {g.bestFree ? `#${g.bestFree[0]} in ${country(g.bestFree[1])}` : 'not on a Top Free chart today'}</div>
                          <div><span className="text-gray-500">Best Top Grossing position today</span><br />
                            {g.bestGross ? `#${g.bestGross[0]} in ${country(g.bestGross[1])}` : 'not on a Top Grossing chart today'}</div>
                          <div><span className="text-gray-500">Charts it is on today</span><br />{g.charts}</div>
                          <div><span className="text-gray-500"><span className="text-amber-300">Est.</span> UA spend, low / mid / high</span><br />
                            {money(ua.low)} / {money(ua.mid)} / {money(ua.high)}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          <a href={playUrl(g.pkg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
                            Open on Google Play <ExternalLink size={11} />
                          </a>
                          <Link href={`/app?id=${g.pkg}&store=google`} className="text-indigo-300 hover:text-indigo-200">Open in AppSpy</Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!rows.length && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-500">No game in this table matches the search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── changes, categories, themes ─────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold">Changes since yesterday</h2>
          {changes ? (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="text-xs text-gray-400">Entered the top 100 ({changes.entered.length})</div>
                <ul className="mt-1 space-y-0.5">
                  {changes.entered.slice(0, 12).map((p) => (
                    <li key={p} className="truncate text-emerald-300">#{byPkg.get(p)?.rank} {byPkg.get(p)?.title}</li>
                  ))}
                  {!changes.entered.length && <li className="text-gray-500">None</li>}
                </ul>
              </div>
              <div>
                <div className="text-xs text-gray-400">Dropped out ({changes.dropped.length})</div>
                <ul className="mt-1 space-y-0.5">
                  {changes.dropped.slice(0, 12).map((d) => (
                    <li key={d.pkg} className="truncate text-rose-300">was #{d.prevRank} {d.title}</li>
                  ))}
                  {!changes.dropped.length && <li className="text-gray-500">None</li>}
                </ul>
              </div>
              <p className="text-xs text-gray-500">Compared with {fmtDate(changes.since)}. A game drops out when it passes {days} days old or is overtaken.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">
              {price === 'paid' ? 'Changes are tracked for the free table.' : `This is the first daily snapshot (${fmtDate(data.firstSnapshot)}). Rank movement, new entries and the “Last day” column fill in from the second run.`}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold">Categories in this table</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {cats.map((c) => (
              <li key={c.category}>
                <button type="button" onClick={() => setCategory(category === c.category ? '' : c.category)} className="block w-full text-left">
                  <div className="flex justify-between gap-2">
                    <span className={category === c.category ? 'text-indigo-300' : ''}>{c.category}</span>
                    <span className="text-gray-400">{c.count} · {compact(c.installs)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-white/5"><div className="h-1.5 rounded bg-indigo-400" style={{ width: `${(c.count / maxCat) * 100}%` }} /></div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold">Words that repeat in titles</h2>
          <p className="mt-1 text-xs text-gray-500">A word or pair of words used by three or more of the top 100.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {themeList.map((t) => (
              <button
                key={t.term}
                type="button"
                onClick={() => setQuery(query === t.term ? '' : t.term)}
                title={`${t.count} games, ${compact(t.installs)} installs`}
                className={`rounded-full border px-2.5 py-1 text-xs ${query === t.term ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:text-white'}`}
              >
                {t.term} <span className="text-gray-500">{t.count}</span>
              </button>
            ))}
            {!themeList.length && <span className="text-sm text-gray-500">No word repeats three times.</span>}
          </div>
        </section>
      </div>

      {/* ── public before release ───────────────────────────────────────── */}
      {!!win.early?.length && (
        <section className="rounded-xl border border-white/10 bg-white/[0.03]">
          <button type="button" onClick={() => setShowEarly(!showEarly)} className="flex w-full items-center gap-2 p-4 text-left">
            {showEarly ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="text-sm font-semibold">Released in the last {days} days, but public earlier ({win.early.length})</span>
            <span className="text-xs text-gray-500">not ranked above, because some installs came before the release date</span>
          </button>
          {showEarly && (
            <div className="border-t border-white/10 p-4">
              <p className="mb-3 max-w-3xl text-xs text-gray-400">
                These games have a release date inside the window, but public reviews older than that date: early access, a soft
                launch or a relaunch. Their install count covers a longer period than the window, so it is not comparable.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-xs text-gray-400">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">Game</th>
                      <th className="px-2 py-2 text-left font-medium">Category</th>
                      <th className="px-2 py-2 text-right font-medium">Released on</th>
                      <th className="px-2 py-2 text-right font-medium">Oldest review</th>
                      <th className="px-2 py-2 text-right font-medium">Installs, all time</th>
                      <th className="px-2 py-2 text-right font-medium">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {win.early.map((g) => (
                      <tr key={g.pkg} className="border-t border-white/5">
                        <td className="px-2 py-1.5">
                          <a href={playUrl(g.pkg)} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300">
                            <span className="block max-w-[280px] truncate">{g.title}</span>
                            <span className="block max-w-[280px] truncate text-xs text-gray-500">{g.developer}</span>
                          </a>
                        </td>
                        <td className="px-2 py-1.5 text-gray-300">{g.genre}</td>
                        <td className="px-2 py-1.5 text-right text-gray-300">{g.released && fmtDate(g.released)}</td>
                        <td className="px-2 py-1.5 text-right text-amber-300">{g.reviewCheck?.oldest && fmtDate(g.reviewCheck.oldest)}</td>
                        <td className="px-2 py-1.5 text-right font-semibold" title={g.installs.toLocaleString('en-US')}>{compact(g.installs)}</td>
                        <td className="px-2 py-1.5 text-right text-gray-300">{g.score ? g.score.toFixed(1) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── undated ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03]">
        <button type="button" onClick={() => setShowUndated(!showUndated)} className="flex w-full items-center gap-2 p-4 text-left">
          {showUndated ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-sm font-semibold">Games with no release date on Google Play ({data.undated.length})</span>
          <span className="text-xs text-gray-500">not ranked above, because their age cannot be proved</span>
        </button>
        {showUndated && (
          <div className="border-t border-white/10 p-4">
            <p className="mb-3 max-w-3xl text-xs text-gray-400">
              Google Play shows no “Released on” date for these games, and most have no rating either, so they cannot be placed in a
              30, 60 or 90 day window. Many are new and growing fast. They are tracked every day from the date in “First seen”, so their
              growth from then on is measured, not guessed.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-xs text-gray-400">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Game</th>
                    <th className="px-2 py-2 text-left font-medium">Category</th>
                    <th className="px-2 py-2 text-right font-medium">Installs</th>
                    <th className="px-2 py-2 text-right font-medium">Last day</th>
                    <th className="px-2 py-2 text-right font-medium">Rating</th>
                    <th className="px-2 py-2 text-right font-medium">Best Top Free today</th>
                    <th className="px-2 py-2 text-right font-medium">First seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.undated.slice(0, 100).map((g) => (
                    <tr key={g.pkg} className="border-t border-white/5">
                      <td className="px-2 py-1.5">
                        <a href={playUrl(g.pkg)} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300">
                          <span className="block max-w-[280px] truncate">{g.title}</span>
                          <span className="block max-w-[280px] truncate text-xs text-gray-500">{g.developer}</span>
                        </a>
                      </td>
                      <td className="px-2 py-1.5 text-gray-300">{g.genre}</td>
                      <td className="px-2 py-1.5 text-right font-semibold" title={g.installs.toLocaleString('en-US')}>{compact(g.installs)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-300">{g.delta == null ? '–' : `+${compact(Math.max(0, g.delta))}`}</td>
                      <td className="px-2 py-1.5 text-right text-gray-300">{g.score ? g.score.toFixed(1) : '–'}</td>
                      <td className="px-2 py-1.5 text-right text-gray-300">{g.bestFree ? `#${g.bestFree[0]} ${g.bestFree[1].toUpperCase()}` : '–'}</td>
                      <td className="px-2 py-1.5 text-right text-gray-300">{fmtDate(g.firstSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── method ──────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03]">
        <button type="button" onClick={() => setShowMethod(!showMethod)} className="flex w-full items-center gap-2 p-4 text-left">
          {showMethod ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-sm font-semibold">How this table is made, and its limits</span>
        </button>
        {showMethod && (
          <div className="space-y-3 border-t border-white/10 p-4 text-sm text-gray-300 max-w-4xl">
            <p>
              <b className="text-white">Read from Google Play, every day:</b> the “Released on” date, the install counter (the exact number
              behind a label like “1,000,000+”), the rating and the number of ratings. A game released {days} days ago has had all of its
              installs inside those {days} days, so its total installs are its installs for the window.
            </p>
            <p>
              <b className="text-white">How games are found:</b> Google Play has no “new games” chart. The collector reads Top Free and Top
              Grossing for all 18 game categories in {data.countries.length} countries, 200 places deep, and checks the release date of every
              game it has not seen before.
            </p>
            <p><b className="text-white">Limits:</b></p>
            <ul className="list-disc space-y-1 pl-5">
              <li>A new game that is not on any of those charts today is missed until it reaches one.</li>
              <li>Games with no release date on Google Play are listed separately and not ranked.</li>
              <li>A game whose public reviews are older than its release date (early access, relaunch) is listed separately and not ranked.</li>
              <li>Installs are worldwide. Google Play does not publish installs per country.</li>
              <li>Android only. Apple publishes no install counts.</li>
              <li>The install counter is Google’s. It can include paid and incentivised installs, and Google can correct it later.</li>
              <li>Google updates each game’s counter at its own pace, not every day. A “Last day” of +0 means the counter has not moved since the previous snapshot, not that nobody installed the game.</li>
              <li>The release date differs by country. The earliest date found across 8 countries is used.</li>
            </ul>
            <p>
              <b className="text-white"><span className="text-amber-300">Est.</span> revenue</b> is a model, not a measurement: installs × an assumed
              revenue per install (ads only ${REVENUE_PER_INSTALL.ads[0]}–${REVENUE_PER_INSTALL.ads[1]}, ads + purchases ${REVENUE_PER_INSTALL.both[0]}–${REVENUE_PER_INSTALL.both[1]},
              purchases only ${REVENUE_PER_INSTALL.iap[0]}–${REVENUE_PER_INSTALL.iap[1]}). Google Play publishes no revenue. The Top Grossing position
              shown under it is real, but it is a rank, not an amount.
            </p>
            <p>
              <b className="text-white"><span className="text-amber-300">Est.</span> UA spend</b> is installs × paid share × cost per install:{' '}
              {UA_SCENARIOS.map((s) => `${s.label} ${Math.round(s.paidShare * 100)}% × $${s.cpi.toFixed(2)}`).join('; ')}. Benchmarks: Adjust Gaming App
              Insights 2026 and Playio / Game Growth Advisor 2026. The country mix of each game’s installs is unknown, which is why the range is wide.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
