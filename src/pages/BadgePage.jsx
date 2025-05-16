import { Container, Typography, Grid, Card, CardContent, Chip, Box } from '@mui/material';
import { BADGE_TYPES } from "../constants/badgeTypes";

import { findChildById } from '../utils/localData';

function BadgePage() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const child = findChildById(user.id);
  const userBadges = child.badges || {};

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>나의 뱃지</Typography>
      <Grid container spacing={3}>
        {BADGE_TYPES.map(badge => {
          const currentTier = userBadges[badge.key] || null;
          return (
            <Grid item xs={12} sm={6} md={4} key={badge.key}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{badge.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{badge.description}</Typography>
                  <Box sx={{ mt: 2 }}>
                    {badge.levels.map(level => (
                      <Chip
                        key={level.tier}
                        label={level.label + ' ' + level.condition}
                        color={currentTier === level.tier ? 'primary' : 'default'}
                        sx={{ mr: 1, mb: 1 }}
                        variant={currentTier === level.tier ? 'filled' : 'outlined'}
                      />
                    ))}
                    {!currentTier && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.disabled">
                        아직 획득한 뱃지가 없어요.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

export default BadgePage;
