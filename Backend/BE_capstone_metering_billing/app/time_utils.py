"""Small helper so 'current calendar month' filtering works identically on
Postgres (production) and SQLite (test suite) — see note in metering_service.py."""

import calendar
from datetime import datetime, timezone


def current_month_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    now = now or datetime.now(timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_day = calendar.monthrange(start.year, start.month)[1]
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end
