import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Search as SearchIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';

const ActivityHistory = ({ activities }) => {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const activityTypes = [
    { id: 'saving', label: '저축', icon: '💰' },
    { id: 'quiz', label: '퀴즈', icon: '📚' },
    { id: 'mission', label: '미션', icon: '🎯' },
    { id: 'badge', label: '뱃지', icon: '🏆' },
    { id: 'goal', label: '목표', icon: '🎯' },
  ];

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const toggleActivityType = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(activity.type);
    const matchesDate = (!startDate || new Date(activity.date) >= startDate) &&
                       (!endDate || new Date(activity.date) <= endDate);
    return matchesSearch && matchesType && matchesDate;
  });

  const getActivityIcon = (type) => {
    const activityType = activityTypes.find(t => t.id === type);
    return activityType ? activityType.icon : '📝';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">활동 내역</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="활동 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton onClick={handleFilterClick}>
              <FilterListIcon />
            </IconButton>
          </Box>
        </Box>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
          </MenuItem>
          <MenuItem>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </LocalizationProvider>
          </MenuItem>
          <Divider />
          <MenuItem>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {activityTypes.map(type => (
                <Chip
                  key={type.id}
                  label={`${type.icon} ${type.label}`}
                  onClick={() => toggleActivityType(type.id)}
                  color={selectedTypes.includes(type.id) ? 'primary' : 'default'}
                  variant={selectedTypes.includes(type.id) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </MenuItem>
        </Menu>

        <List>
          {filteredActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getActivityIcon(activity.type)}</span>
                      <Typography>{activity.title}</Typography>
                    </Box>
                  }
                  secondary={activity.date}
                />
              </ListItem>
              {index < filteredActivities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {filteredActivities.length === 0 && (
            <ListItem>
              <ListItemText
                primary="활동 내역이 없습니다."
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default ActivityHistory; 