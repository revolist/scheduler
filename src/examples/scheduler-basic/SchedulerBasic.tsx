import React, { useMemo, useRef, useEffect } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import {
  EventSchedulerPlugin,
  createSchedulerEventTooltip,
} from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';
import './styles.scss';

export default function SchedulerBasic(_props: { rows?: any[] }) {
  const plugins = useMemo(() => [EventSchedulerPlugin], []);
  const events = useMemo(createEvents, []);
  const hover = useMemo(() => createSchedulerEventTooltip(), []);
  const grid = useRef<HTMLRevoGridElement>(null);
  useEffect(() => {
    if (grid.current) void hover.connect(grid.current);
    return () => hover.destroy();
  }, [hover]);
  return (
    <RevoGrid
      ref={grid}
      onAftergridinit={() => {
        if (grid.current) void hover.connect(grid.current);
      }}
      tooltip={hover.tooltip}
      className="scheduler-basic demo-preview-content-sized-grid"
      hideAttribution
      theme={currentTheme().isDark() ? 'darkMaterial' : 'material'}
      plugins={plugins}
      columns={columns}
      source={events}
      eventScheduler={config}
      eventSchedulerResources={resources}
    />
  );
}
