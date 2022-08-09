import { Box } from '@mui/system';
import React from 'react';
import FilterAppLogs from './FilterAppLogs';
import FilterDatesLogs from './FilterDatesLogs';
import FilterSeverityLogs from './FilterSeverityLogs';
import FilterTextSearchLogs from './FilterTextSearchLogs';

export default function FilterLogs () {
    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0' }}>
                <Box sx={{ flex: 1}}>
                    <FilterDatesLogs />
                </Box>
                <Box sx={{ display: 'flex', flex: 1 }}>
                    <FilterSeverityLogs />
                    <FilterAppLogs />
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0' }}>
                <FilterTextSearchLogs />
            </Box>
        </>
    );
}