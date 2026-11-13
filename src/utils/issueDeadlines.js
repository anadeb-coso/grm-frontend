import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { database } from '../database';

/**
 * Plaintes en retard, calculées localement à partir des plaintes synchronisées (déjà limitées au
 * périmètre du compte connecté par le serveur). Mêmes règles que le web
 * (grm-backend/src/issue/deadlines.py) :
 * - niveau = niveau le plus haut atteint par escalade, sinon Village ;
 * - départ : date exacte de réception (Village) ou date réelle de l'escalade (niveau escaladé),
 *   à défaut date d'enregistrement ;
 * - échéance = départ + N jours (ouvrables : lundi -> vendredi, ou calendaires), jour de départ exclu ;
 * - en retard : ni résolue ni rejetée, et aujourd'hui > échéance.
 */
export const LEVEL_RANK = { Village: 1, Canton: 2, Commune: 3, Prefecture: 4, Region: 5, Country: 6 };
const OBSERVED_TABLES = ['issues', 'escalation_levels', 'processing_delays', 'issue_statuses'];

const normalizeLevel = (value) => {
  if (!value) return null;
  const level = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return LEVEL_RANK[level] ? level : null;
};

/** Date locale à minuit (on compare des jours, pas des heures). */
export const startOfDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export function addDelay(start, days, workingDays = true) {
  const current = startOfDay(start);
  if (!workingDays) {
    current.setDate(current.getDate() + days);
    return current;
  }
  let remaining = days;
  while (remaining > 0) {
    current.setDate(current.getDate() + 1);
    const weekday = current.getDay(); // 0 = dimanche, 6 = samedi
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return current;
}

/** Liste des plaintes en retard : [{ issue, level, deadline, daysLate }], la plus en retard d'abord. */
export async function loadOverdueIssues(today = new Date()) {
  const [issues, levels, delays, statuses] = await Promise.all([
    database.get('issues').query(Q.where('is_deleted', false), Q.where('confirmed', true)).fetch(),
    database.get('escalation_levels').query(Q.where('is_deleted', false)).fetch(),
    database.get('processing_delays').query(Q.where('is_deleted', false)).fetch(),
    database.get('issue_statuses').query().fetch(),
  ]);

  const delayByLevel = {};
  delays.forEach((d) => { if (d.delayDays) delayByLevel[d.level] = d; });
  const statusById = {};
  statuses.forEach((s) => { statusById[s.id] = s; });

  // Niveau le plus haut atteint + date d'arrivée la plus ancienne à ce niveau, par plainte.
  const escalationByIssue = {};
  levels.forEach((lvl) => {
    const level = normalizeLevel(lvl.administrativeLevel);
    if (!level) return;
    const arrival = startOfDay(lvl.escalationDate || lvl.dueAt);
    const current = escalationByIssue[lvl.issueId];
    if (!current || LEVEL_RANK[level] > LEVEL_RANK[current.level]) {
      escalationByIssue[lvl.issueId] = { level, arrival };
    } else if (level === current.level && arrival && (!current.arrival || arrival < current.arrival)) {
      current.arrival = arrival;
    }
  });

  const todayDay = startOfDay(today);
  const overdue = [];
  issues.forEach((issue) => {
    const status = statusById[issue.statusId];
    if (status && (status.finalStatus || status.rejectedStatus)) return; // clôturée

    const escalation = escalationByIssue[issue.id];
    const level = escalation?.level || 'Village';
    const start = escalation?.arrival || startOfDay(issue.receivedDate || issue.intakeDate);
    const delay = delayByLevel[level];
    if (!delay || !start) return;

    const deadline = addDelay(start, delay.delayDays, delay.workingDays);
    if (todayDay > deadline) {
      const daysLate = Math.round((todayDay - deadline) / 86400000);
      overdue.push({ issue, level, deadline, daysLate });
    }
  });
  return overdue.sort((a, b) => b.daysLate - a.daysLate);
}

/** [{ villageId, villageName, count }] des plaintes en retard, le plus de retards d'abord. */
export function groupOverdueByVillage(overdue) {
  const villages = new Map();
  overdue.forEach(({ issue }) => {
    const key = String(issue.administrativeRegionId ?? '');
    const entry = villages.get(key) || {
      villageId: key, villageName: issue.administrativeRegionName || key || '-', count: 0,
    };
    entry.count += 1;
    villages.set(key, entry);
  });
  return [...villages.values()].sort((a, b) => b.count - a.count || a.villageName.localeCompare(b.villageName));
}

/** Plaintes en retard (liste + regroupement par village), mises à jour à chaque synchronisation. */
export function useOverdueIssues() {
  const [state, setState] = useState({ loading: true, overdue: [], villages: [] });

  useEffect(() => {
    let active = true;
    const reload = async () => {
      try {
        const overdue = await loadOverdueIssues();
        if (active) setState({ loading: false, overdue, villages: groupOverdueByVillage(overdue) });
      } catch (err) {
        if (__DEV__) console.warn('[issueDeadlines] calcul des retards impossible', err);
        if (active) setState((s) => ({ ...s, loading: false }));
      }
    };
    reload();
    const subscription = database.withChangesForTables(OBSERVED_TABLES).subscribe(() => reload());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
