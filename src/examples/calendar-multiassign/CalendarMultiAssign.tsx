import React, { useEffect, useMemo, useRef } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { createCalendarDemo } from './demo';
import './styles.scss';
export default function CalendarMultiAssign(_props: { rows?: any[] }) {
  const model = useMemo(() => createCalendarDemo(), []);
  const plugins = useMemo(() => [EventSchedulerPlugin], []);
  const columns = useMemo(() => [], []);
  const grid = useRef<HTMLRevoGridElement>(null);
  const root = useRef<HTMLElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const agenda = useRef<HTMLDivElement>(null);
  const dark = currentTheme().isDark();
  useEffect(() => {
    model.mount(grid.current!, {
      root: root.current!,
      toolbar: toolbar.current!,
      sidebar: sidebar.current!,
      agenda: agenda.current!,
    });
    return () => model.destroy();
  }, [model]);
  return (
    <section
      ref={root}
      className="calendar-multiassign"
      data-theme={dark ? 'dark' : 'light'}
    >
      <div ref={toolbar} />
      <div className="calendar-multiassign__body">
        <aside ref={sidebar} className="calendar-multiassign__sidebar" />
        <div className="calendar-multiassign__stage">
          <RevoGrid
            ref={grid}
            className="calendar-multiassign__grid demo-preview-content-sized-grid"
            hideAttribution
            theme={dark ? 'darkMaterial' : 'material'}
            plugins={plugins}
            columns={columns}
            source={model.events}
            eventScheduler={model.config}
            eventSchedulerResources={model.resources}
          />
          <div
            ref={agenda}
            className="calendar-multiassign__agenda-host"
            hidden
          />
        </div>
      </div>
    </section>
  );
}
