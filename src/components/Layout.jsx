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
  useTheme,
  Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = ({ children }) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
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
              <GraphicEqIcon sx={{ color: theme.palette.primary.main }} />
              <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column" }}>
                <Typography variant="subtitle2" sx={{ letterSpacing: 4 }}>
                  MATCH MY TUNES
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Playlist bridge for every service
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{ display: { xs: "flex", md: "none" }, letterSpacing: 4 }}
              >
                MMT
              </Typography>
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
      <Box component="main">{children}</Box>
    </Box>
  );
};

export default Layout;
