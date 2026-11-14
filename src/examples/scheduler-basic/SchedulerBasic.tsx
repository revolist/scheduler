import React, { useMemo } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { EventSchedulerPlugin } from '@revolist/scheduler';
import { currentTheme } from '../../shared/theme';
import { columns, config, createEvents, resources } from './data';
import './styles.scss';

export default function SchedulerBasic(_props: { rows?: any[] }) {
  const plugins = useMemo(() => [EventSchedulerPlugin], []);
  const events = useMemo(createEvents, []);
  return (
    <RevoGrid
      className="scheduler-basic demo-preview-content-sized-grid"
      hideAttribution
      theme={currentTheme().isDark() ? 'darkMaterial' : 'material'}
      plugins={plugins}
      columns={columns}
      eventSchedulerEvents={events}
      eventScheduler={config}
      eventSchedulerResources={resources}
    />
  );
}
