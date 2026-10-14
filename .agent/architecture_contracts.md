# Architecture Contracts: TaskFlow v3.0

## 1. Design Tokens & UI Architecture
- **Primary Color:** Indigo-tinted modern blue (`--color-brand-50` to `--color-brand-900`)
- **Accent Tints:** Emerald (`--color-success` / 500 / 600), Rose/Red (`--color-danger`), Amber (`--color-warning`), Purple (`--color-purple`)
- **Surfaces:** Clean slate modern tokens (`--color-surface-50` to `--color-surface-900`), layered glass (`backdrop-blur-md`, subtle inner borders)
- **Typography:** Inter with optimal tabular numerals, font-feature-settings, fluid sizing.
- **Elevation & Shadows:** Smooth soft shadows with colored ambient bounce (`shadow-2xs`, `shadow-sm`, `shadow-md`, `shadow-xl`).

## 2. API Contract: Enhanced Stats Endpoint (`GET /api/stats`)
Extended to provide rich visualization data without client-side calculation lag:

```python
class DayCompletion(BaseModel):
    date: str       # YYYY-MM-DD
    day_name: str   # Seg, Ter, Qua, etc.
    completed: int  # Tasks completed on that day
    created: int    # Tasks created on that day

class TagDistribution(BaseModel):
    tag: str
    count: int

class UserStatsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    completed_on_time: int
    overdue_tasks: int
    standby_tasks: int
    subtasks_total: int
    subtasks_completed: int
    completion_rate_percent: float
    on_time_rate_percent: float
    by_priority: PriorityDistribution
    by_status: StatusDistribution
    # v3.0 extensions:
    recent_activity_trend: list[DayCompletion]  # Last 7 days
    tag_distribution: list[TagDistribution]     # Top tags
    productivity_score: int                     # 0 - 100 calculated health score
```

## 3. Frontend Types Parity (`frontend/src/types/task.ts`)
```typescript
export interface DayActivity {
  date: string;
  day_name: string;
  completed: number;
  created: number;
}

export interface TagMetric {
  tag: string;
  count: number;
}

export interface UserStats {
  total_tasks: number;
  completed_tasks: number;
  completed_on_time: number;
  overdue_tasks: number;
  standby_tasks: number;
  subtasks_total: number;
  subtasks_completed: number;
  completion_rate_percent: number;
  on_time_rate_percent: number;
  by_priority: {
    high: number;
    normal: number;
    low: number;
  };
  by_status: {
    todo: number;
    doing: number;
    done: number;
    standby: number;
  };
  recent_activity_trend?: DayActivity[];
  tag_distribution?: TagMetric[];
  productivity_score?: number;
}
```
