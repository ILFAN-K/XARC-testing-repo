/** A single navigation item in the admin sidebar. */
export interface AdminNavItem {
  /** Unique key, used for icon mapping and active-state matching. */
  key: string;
  /** Display label. */
  label: string;
  /** App Router path, e.g. '/admin/dashboard'. */
  href: string;
}

/** A logical group of navigation items, rendered with a divider between groups. */
export interface AdminNavGroup {
  items: AdminNavItem[];
}
