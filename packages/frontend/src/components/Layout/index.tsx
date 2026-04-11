// ============================================================
// PBI-04: レスポンシブレイアウト（MUI Drawer + AppBar）
// ============================================================

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditNoteIcon from '@mui/icons-material/EditNote';
import TableChartIcon from '@mui/icons-material/TableChart';
import TuneIcon from '@mui/icons-material/Tune';
import SpaIcon from '@mui/icons-material/Spa';
// [Add] PBI-37: SNSナビアイコン
import ShareIcon from '@mui/icons-material/Share';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'ダッシュボード', path: '/', icon: <DashboardIcon /> },
  { label: '肌状態を記録', path: '/input', icon: <EditNoteIcon /> },
  { label: 'データビュー', path: '/data', icon: <TableChartIcon /> },
  { label: '化粧品マスタ', path: '/settings', icon: <TuneIcon /> },
  // [Add] PBI-37: SNS出力画面
  { label: 'SNS出力', path: '/sns', icon: <ShareIcon /> },
];

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const drawer = (
    <Box>
      <Toolbar>
        <SpaIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700} color="primary.main">
          SkinJournal
        </Typography>
      </Toolbar>
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar（モバイル時のみ表示） */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
          elevation={1}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <SpaIcon sx={{ mr: 1, flexShrink: 0 }} />
            <Typography variant="h6" fontWeight={700} noWrap>
              SkinJournal
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 7, md: 0 },
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
