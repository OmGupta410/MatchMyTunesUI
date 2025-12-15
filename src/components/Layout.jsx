import { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  Stack,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import brandLogo from "../assets/final-withfont-removebg.png";

const Layout = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElQuickAction, setAnchorElQuickAction] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Plans", path: "/plans" },
  ];

  const quickActionItems = [
    { label: "Transfer New", action: "transfer" },
    { label: "Share", action: "share" },
    { label: "Backup", action: "backup" },
    { label: "Plans (Subscription)", action: "plans" },
  ];

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleCloseNavMenu();
  };

  const handleOpenQuickMenu = (event) => {
    setAnchorElQuickAction(event.currentTarget);
  };

  const handleCloseQuickMenu = () => {
    setAnchorElQuickAction(null);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "transfer":
        navigate("/transfer/setup");
        break;
      case "share":
        navigate("/about?focus=share");
        break;
      case "backup":
        navigate("/about?focus=backup");
        break;
      case "plans":
        navigate("/plans");
        break;
      default:
        break;
    }
    handleCloseQuickMenu();
    handleCloseNavMenu();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(249,115,22,0.25), transparent 35%)",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "rgba(5,11,44,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(22px)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ cursor: "pointer" }}
              onClick={() => handleNavigate("/")}
            >
              <Box
                component="img"
                src={brandLogo}
                alt="MatchMyTunes logo"
                sx={{
                  height: { xs: 32, md: 44 },
                  width: "auto",
                }}
              />
              <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
                <Typography variant="subtitle2" sx={{ letterSpacing: 3, fontWeight: 700 }}>
                  MATCHMYTUNES
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Playlist bridge for every service
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" }, justifyContent: "flex-end" }}>
              <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
              >
                {navItems.map((item) => (
                  <MenuItem key={item.path} onClick={() => handleNavigate(item.path)}>
                    <Typography textAlign="center">{item.label}</Typography>
                  </MenuItem>
                ))}
                {quickActionItems.map((item) => (
                  <MenuItem key={item.action} onClick={() => handleQuickAction(item.action)}>
                    <Typography textAlign="center">{item.label}</Typography>
                  </MenuItem>
                ))}
                {!user ? (
                  <>
                    <MenuItem onClick={() => handleNavigate("/login")}>Login</MenuItem>
                    <MenuItem onClick={() => handleNavigate("/signup")}>Sign Up</MenuItem>
                  </>
                ) : (
                  <MenuItem onClick={logout}>Logout</MenuItem>
                )}
              </Menu>
            </Box>

            <Stack
              direction="row"
              spacing={3}
              sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, justifyContent: "center" }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ color: "white", fontWeight: 500 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                onClick={handleOpenQuickMenu}
                endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                aria-controls={anchorElQuickAction ? "quick-action-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={anchorElQuickAction ? "true" : undefined}
                sx={{
                  color: "#EEF2FF",
                  borderColor: "rgba(255,255,255,0.2)",
                  borderWidth: 1,
                  borderStyle: "solid",
                  display: { xs: "none", md: "inline-flex" },
                }}
              >
                Quick Action
              </Button>
              {!user ? (
                <>
                  <Button variant="text" onClick={() => handleNavigate("/login")} sx={{ color: "#EEF2FF" }}>
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleNavigate("/signup")}
                  >
                    Create account
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Hey, {user.displayName}
                  </Typography>
                  <Button variant="outlined" color="secondary" onClick={logout}>
                    Logout
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Menu
        id="quick-action-menu"
        anchorEl={anchorElQuickAction}
        open={Boolean(anchorElQuickAction)}
        onClose={handleCloseQuickMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {quickActionItems.map((item) => (
          <MenuItem key={item.action} onClick={() => handleQuickAction(item.action)}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
      <Box component="main">
        <Outlet />
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mt: 8 }} />
      <Box
        component="footer"
        sx={{
          width: "100%",
          background: "linear-gradient(130deg, rgba(12,16,43,0.94), rgba(5,8,28,0.9))",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          py: { xs: 5, md: 7 },
          px: { xs: 3, md: 6, xl: 10 },
        }}
      >
        <Stack spacing={4}>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 3, md: 5 },
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ letterSpacing: 4 }}>
                MATCHMYTUNES
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seamlessly move playlists between Spotify, YouTube, and every supported service while keeping order, artwork, and metadata intact.
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                NAVIGATE
              </Typography>
              <Button color="inherit" size="small" onClick={() => navigate("/about")}>About</Button>
              <Button color="inherit" size="small" onClick={() => navigate("/plans")}>Plans</Button>
              <Button color="inherit" size="small" onClick={() => navigate("/transfer/setup")}>Start transfer</Button>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                SUPPORT
              </Typography>
              <Button color="inherit" size="small" onClick={() => navigate("/about?focus=share")}>Share</Button>
              <Button color="inherit" size="small" onClick={() => navigate("/about?focus=backup")}>Backup</Button>
              <Button color="inherit" size="small" onClick={() => navigate("/login")}>Sign in</Button>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                CONNECT
              </Typography>
              <Button
                color="inherit"
                size="small"
                component="a"
                href="mailto:support@matchmytunes.com"
              >
                Email support
              </Button>
              <Button
                color="inherit"
                size="small"
                component="a"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </Button>
              <Button
                color="inherit"
                size="small"
                component="a"
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </Button>
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            © {new Date().getFullYear()} MatchMyTunes. All rights reserved.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default Layout;
