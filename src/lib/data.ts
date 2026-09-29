import { differenceInCalendarDays } from "date-fns";

export type ContentLike = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  conversions: number;
  gmv: number;
};

/**
 * Full-funnel rollup: TOFU (Awareness) -> MOFU (Consideration) -> BOFU (Conversion).
 * This is the single source of truth for every funnel number shown on
 * /dashboard, /analytics and the generated /report.
 */
export function computeFunnel(items: ContentLike[]) {
  const tofuViews = items.reduce((a, c) => a + c.views, 0);
  const mofuEngagement = items.reduce((a, c) => a + c.likes + c.comments + c.shares + c.saves, 0);
  const bofuOrders = items.reduce((a, c) => a + c.conversions, 0);
  const bofuClicks = items.reduce((a, c) => a + c.clicks, 0);
  const totalGmv = items.reduce((a, c) => a + c.gmv, 0);

  const cvrAwarenessToConsideration = tofuViews > 0 ? (mofuEngagement / tofuViews) * 100 : 0;
  const cvrConsiderationToConversion = mofuEngagement > 0 ? (bofuOrders / mofuEngagement) * 100 : 0;
  const engagementRate = tofuViews > 0 ? (mofuEngagement / tofuViews) * 100 : 0;

  return {
    tofuViews,
    mofuEngagement,
    bofuOrders,
    bofuClicks,
    totalGmv,
    cvrAwarenessToConsideration,
    cvrConsiderationToConversion,
    engagementRate,
  };
}

/**
 * Goal Health engine — mirrors the "Terlambat X hari" badge from the spec.
 * A goal is "delayed" when its current progress is behind the pace
 * required to hit the target by the deadline.
 */
export function computeGoalHealth(goal: {
  targetValue: number;
  currentValue: number;
  startDate: Date;
  deadline: Date;
}) {
  const now = new Date();
  const totalDays = Math.max(1, differenceInCalendarDays(goal.deadline, goal.startDate));
  const elapsedDays = Math.min(totalDays, Math.max(0, differenceInCalendarDays(now, goal.startDate)));
  const expectedPace = (elapsedDays / totalDays) * 100;
  const actualProgress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;

  let daysDelayed = 0;
  if (actualProgress < expectedPace) {
    // How many days "behind schedule" the brand effectively is, based on
    // how far off-pace the current progress is relative to the daily rate.
    const dailyRate = 100 / totalDays;
    daysDelayed = Math.max(0, Math.round((expectedPace - actualProgress) / dailyRate));
  }

  const isOverdue = now > goal.deadline && actualProgress < 100;
  if (isOverdue) {
    daysDelayed = Math.max(daysDelayed, differenceInCalendarDays(now, goal.deadline));
  }

  return {
    percentage: Math.min(100, Math.round(actualProgress)),
    expectedPace: Math.round(expectedPace),
    daysDelayed,
    onTrack: daysDelayed === 0,
  };
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}
