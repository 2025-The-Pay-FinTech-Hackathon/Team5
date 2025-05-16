import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Slider,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  EmojiEvents as BadgeIcon,
  PhotoCamera as PhotoCameraIcon,
  ColorLens as ColorLensIcon,
} from '@mui/icons-material';

const ProfileCustomization = ({ user, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState(user?.profile?.selectedBadges || []);
  const [profileColor, setProfileColor] = useState(user?.profile?.color || '#6C63FF');
  const [profileFrame, setProfileFrame] = useState(user?.profile?.frame || 'default');
  const [profileImage, setProfileImage] = useState(user?.profile?.image || null);
  const [customColor, setCustomColor] = useState(profileColor);
  const fileInputRef = useRef(null);

  const availableBadges = [
    { id: 1, name: '첫 저축', icon: '💰', description: '첫 저축 목표 달성' },
    { id: 2, name: '미션 마스터', icon: '🎯', description: '10개의 미션 완료' },
    { id: 3, name: '퀴즈 전문가', icon: '📚', description: '퀴즈 100점 달성' },
    { id: 4, name: '저축왕', icon: '👑', description: '100만원 저축 달성' },
    { id: 5, name: '습관 형성', icon: '📅', description: '30일 연속 저축' },
  ];

  const profileFrames = [
    { id: 'default', name: '기본', style: { border: '2px solid #6C63FF' } },
    { id: 'gold', name: '골드', style: { border: '3px solid #FFD700' } },
    { id: 'rainbow', name: '레인보우', style: { border: '3px solid transparent', background: 'linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)' } },
    { id: 'neon', name: '네온', style: { border: '2px solid #00ff00', boxShadow: '0 0 10px #00ff00' } },
    { id: 'crystal', name: '크리스탈', style: { border: '2px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(5px)' } },
  ];

  const presetColors = [
    '#6C63FF', '#F67280', '#43E97B', '#5BC0EB', '#FFD700',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  ];

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    const updatedProfile = {
      ...user.profile,
      selectedBadges,
      color: profileColor,
      frame: profileFrame,
      image: profileImage,
    };
    onUpdate({ ...user, profile: updatedProfile });
    handleClose();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (event) => {
    setCustomColor(event.target.value);
    setProfileColor(event.target.value);
  };

  const toggleBadge = (badgeId) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < 3) {
      setSelectedBadges([...selectedBadges, badgeId]);
    }
  };

  const getFrameStyle = (frameId) => {
    const frame = profileFrames.find(f => f.id === frameId);
    return frame ? frame.style : profileFrames[0].style;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">프로필 커스터마이징</Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleOpen}
          >
            프로필 수정
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              borderRadius: '50%',
              position: 'relative',
              ...getFrameStyle(profileFrame),
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: profileColor,
                fontSize: '2rem',
              }}
              src={profileImage}
            >
              {!profileImage && user?.name?.[0]}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <PhotoCameraIcon />
            </IconButton>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </Paper>

          <Box>
            <Typography variant="h5" gutterBottom>
              {user?.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedBadges.map(badgeId => {
                const badge = availableBadges.find(b => b.id === badgeId);
                return badge ? (
                  <Tooltip key={badge.id} title={badge.description}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        borderRadius: 2,
                      }}
                    >
                      <span>{badge.icon}</span>
                      <Typography variant="body2">{badge.name}</Typography>
                    </Paper>
                  </Tooltip>
                ) : null;
              })}
            </Box>
          </Box>
        </Box>
      </CardContent>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                프로필 이미지
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  src={profileImage}
                  sx={{ width: 100, height: 100, bgcolor: profileColor }}
                >
                  {!profileImage && user?.name?.[0]}
                </Avatar>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  이미지 변경
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                프로필 프레임
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {profileFrames.map(frame => (
                  <Paper
                    key={frame.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      ...frame.style,
                      ...(profileFrame === frame.id && {
                        boxShadow: 3,
                      }),
                    }}
                    onClick={() => setProfileFrame(frame.id)}
                  >
                    <Avatar
                      src={profileImage}
                      sx={{ width: 60, height: 60, bgcolor: profileColor }}
                    >
                      {!profileImage && user?.name?.[0]}
                    </Avatar>
                  </Paper>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                프로필 색상
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {presetColors.map(color => (
                    <Box
                      key={color}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: profileColor === color ? '2px solid #000' : 'none',
                      }}
                      onClick={() => setProfileColor(color)}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ColorLensIcon />
                  <TextField
                    type="color"
                    value={customColor}
                    onChange={handleColorChange}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body2">
                    {customColor}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                뱃지 선택 (최대 3개)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {availableBadges.map(badge => (
                  <Tooltip key={badge.id} title={badge.description}>
                    <Paper
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: selectedBadges.includes(badge.id) ? 'primary.light' : 'background.paper',
                        color: selectedBadges.includes(badge.id) ? 'primary.contrastText' : 'text.primary',
                      }}
                      onClick={() => toggleBadge(badge.id)}
                    >
                      <span>{badge.icon}</span>
                      <Typography variant="body2">{badge.name}</Typography>
                      {selectedBadges.includes(badge.id) && <CheckIcon fontSize="small" />}
                    </Paper>
                  </Tooltip>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>취소</Button>
          <Button onClick={handleSave} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProfileCustomization; 