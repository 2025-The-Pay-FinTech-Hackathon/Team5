import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { BADGE_TYPES } from '../constants/badgeTypes';
import { findChildById, getChildrenByParent } from '../utils/localData';
import { checkAndUpdateBadges } from '../utils/badgeUtils';

function BadgePage() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const children = useMemo(() => (
    user?.role === 'parent' ? getChildrenByParent(user.id) : []
  ), [user?.id, user?.role]);
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || '');
  const [child, setChild] = useState(null);

  useEffect(() => {
    const loadedChild = user?.role === 'parent'
      ? findChildById(selectedChildId)
      : findChildById(user?.id);
    setChild(loadedChild ? checkAndUpdateBadges(loadedChild) : null);
  }, [selectedChildId, user?.id, user?.role]);

  const userBadges = child?.badges || {};

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h4">나의 배지</Typography>
        {user?.role === 'parent' && children.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>자녀 선택</InputLabel>
            <Select
              value={selectedChildId}
              label="자녀 선택"
              onChange={(event) => setSelectedChildId(event.target.value)}
            >
              {children.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {!child ? (
        <Typography color="text.secondary">배지를 확인할 자녀 정보가 없습니다.</Typography>
      ) : (
        <Grid container spacing={3}>
          {BADGE_TYPES.map((badge) => {
            const currentTier = userBadges[badge.key] || null;
            return (
              <Grid item xs={12} sm={6} md={4} key={badge.key}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{badge.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{badge.description}</Typography>
                    <Box sx={{ mt: 2 }}>
                      {badge.levels.map((level) => (
                        <Chip
                          key={level.tier}
                          label={`${level.label} ${level.condition}`}
                          color={currentTier === level.tier ? 'primary' : 'default'}
                          sx={{ mr: 1, mb: 1 }}
                          variant={currentTier === level.tier ? 'filled' : 'outlined'}
                        />
                      ))}
                      {!currentTier && (
                        <Typography variant="body2" sx={{ mt: 1 }} color="text.disabled">
                          아직 획득한 배지가 없습니다.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}

export default BadgePage;
